import ctypes
import logging
import os
import subprocess
from fastapi import Depends, FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from . import legacy_database as database
from sqlalchemy.orm import Session

from .auth import _user_can_see_contact, get_current_user_id, get_visible_contacts, start_scheduler
from .database import get_db as get_saas_db, init_db as init_saas_db
from .models import Candidature, CandidatureEvent, Contact, ContactInteraction, Etablissement, Relance
from .routers import auth as auth_router
from .routers import admin as admin_router
from .routers import candidatures as candidatures_router
from .routers import candidature_events as candidature_events_router
from .routers import contact_interactions as contact_interactions_router
from .routers import etablissements as etablissements_router
from .routers import me as me_router
from .routers import relances as relances_router
from .routers import subscription as subscription_router
import json
from contextlib import asynccontextmanager
from datetime import datetime

APP_VERSION = "0.1.0"
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    init_saas_db()
    start_scheduler()
    yield

app = FastAPI(title="OfferTrail", lifespan=lifespan)
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.state.limiter = Limiter(key_func=get_remote_address)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SlowAPIMiddleware)
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(admin_router.router)
app.include_router(etablissements_router.router, prefix="/etablissements", tags=["etablissements"])
app.include_router(candidatures_router.router, prefix="/candidatures", tags=["candidatures"])
app.include_router(relances_router.router, prefix="/relances", tags=["relances"])
app.include_router(candidature_events_router.router, prefix="/candidature-events", tags=["candidature-events"])
app.include_router(contact_interactions_router.router, prefix="/contact-interactions", tags=["contact-interactions"])
app.include_router(me_router.router, prefix="/me", tags=["me"])
app.include_router(subscription_router.router)

templates = Jinja2Templates(directory="src/templates")

def get_branch_name():
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode("utf-8").strip()
    except Exception:
        return "dev"

def split_legacy_contact_name(name: str):
    cleaned = (name or "").strip()
    if not cleaned:
        return "", ""
    parts = cleaned.split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])

def format_contact_for_legacy_views(contact: dict):
    formatted = dict(contact)
    first_name = (formatted.get("first_name") or "").strip()
    last_name = (formatted.get("last_name") or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    formatted["name"] = full_name or formatted.get("name") or "Contact"

    if formatted.get("organization_id"):
        organization = database.get_organization(formatted["organization_id"])
        formatted["company"] = organization["name"] if organization else formatted.get("company")
    else:
        formatted["company"] = formatted.get("company")

    return formatted


HIDDEN_SAAS_STATUSES = {"refusee", "ghosting", "abandonnee", "offre_recue", "acceptee"}
LEGACY_TO_SAAS_STATUS = {
    "INTERESTED": "en_attente",
    "APPLIED": "envoyee",
    "INTERVIEW": "entretien",
    "OFFER": "offre_recue",
    "REJECTED": "refusee",
}
SAAS_TO_LEGACY_STATUS = {
    "brouillon": "INTERESTED",
    "envoyee": "APPLIED",
    "en_attente": "INTERESTED",
    "relancee": "APPLIED",
    "entretien": "INTERVIEW",
    "test_technique": "INTERVIEW",
    "offre_recue": "OFFER",
    "acceptee": "OFFER",
    "refusee": "REJECTED",
    "ghosting": "REJECTED",
    "abandonnee": "REJECTED",
}
SAAS_TO_FRONT_TYPE = {
    "client_final": "CLIENT_FINAL",
    "esn": "ESN",
    "cabinet_recrutement": "CABINET_RECRUTEMENT",
    "startup": "STARTUP",
    "pme": "PME",
    "grand_compte": "GRAND_COMPTE",
    "portage": "PORTAGE",
    "autre": "AUTRE",
    "independant": "AUTRE",
}


def _legacy_hash(raw_value: str, prefix: str = "") -> int:
    hash_value = 0
    for character in f"{prefix}{raw_value}":
        hash_value = ctypes.c_int32(((hash_value << 5) - hash_value + ord(character))).value
    normalized = abs(hash_value)
    return normalized or 1


def _resolve_hashed_uuid(db: Session, model, raw_id: str | int, prefix: str = "") -> str | None:
    value = str(raw_id)
    if "-" in value:
        return value
    try:
        numeric_value = int(value)
    except ValueError:
        return value

    for (candidate_id,) in db.query(model.id).all():
        if _legacy_hash(str(candidate_id), prefix=prefix) == numeric_value:
            return str(candidate_id)
    return None


def _map_etablissement_to_legacy(etablissement: Etablissement, candidatures: list[Candidature]) -> dict:
    total = len(candidatures)
    responded = [
        candidature
        for candidature in candidatures
        if candidature.date_reponse is not None
        or candidature.statut in {"refusee", "entretien", "offre_recue", "acceptee"}
    ]
    positive = [
        candidature
        for candidature in candidatures
        if candidature.statut in {"entretien", "offre_recue", "acceptee"}
    ]
    ghosting = [candidature for candidature in candidatures if candidature.statut == "ghosting"]
    delays = [
        (candidature.date_reponse - candidature.date_candidature).days
        for candidature in candidatures
        if candidature.date_reponse is not None and candidature.date_candidature is not None
    ]
    response_rate = round((len(responded) / total) * 100, 2) if total else 0
    positive_rate = round((len(positive) / total) * 100, 2) if total else 0
    numeric_id = _legacy_hash(etablissement.id, prefix="org:")
    probity_level = "insuffisant"
    probity_score = None
    if total >= 3:
        probity_score = round((response_rate * 0.65) + (positive_rate * 0.35), 2)
        if probity_score >= 70:
            probity_level = "fiable"
        elif probity_score >= 40:
            probity_level = "moyen"
        else:
            probity_level = "m\xe9fiance"

    return {
        "id": numeric_id,
        "organization_id": numeric_id,
        "name": etablissement.nom,
        "type": SAAS_TO_FRONT_TYPE.get((etablissement.type or "").strip().lower(), "AUTRE"),
        "website": etablissement.site_web,
        "linkedin_url": None,
        "city": None,
        "notes": etablissement.description,
        "created_at": (etablissement.created_at.isoformat() if etablissement.created_at else None),
        "updated_at": (etablissement.updated_at.isoformat() if etablissement.updated_at else None),
        "total_applications": total,
        "total_responses": len(responded),
        "response_rate": response_rate,
        "avg_response_days": round(sum(delays) / len(delays), 2) if delays else None,
        "ghosting_count": len(ghosting),
        "positive_count": len(positive),
        "positive_rate": positive_rate,
        "probity_score": probity_score,
        "probity_level": probity_level,
        "metrics": {
            "probity_score": probity_score,
            "probity_level": probity_level,
        },
    }


def _map_contact_to_legacy(contact: Contact, interaction: ContactInteraction | None = None) -> dict:
    return {
        "id": _legacy_hash(contact.id, prefix="contact:"),
        "organization_id": _legacy_hash(contact.etablissement_id, prefix="org:") if contact.etablissement_id else None,
        "first_name": contact.prenom,
        "last_name": contact.nom,
        "email": contact.email_pro,
        "phone": interaction.telephone if interaction else None,
        "role": contact.poste,
        "is_recruiter": 1 if (contact.poste and "recrut" in contact.poste.lower()) else 0,
        "linkedin_url": contact.linkedin_url,
        "notes": interaction.notes if interaction else None,
        "created_at": contact.created_at.isoformat() if contact.created_at else None,
        "updated_at": contact.updated_at.isoformat() if contact.updated_at else None,
    }


def _map_relance_by_candidature(relances: list[Relance]) -> dict[str, Relance]:
    relances_by_candidature: dict[str, Relance] = {}
    for relance in relances:
        current = relances_by_candidature.get(relance.candidature_id)
        if current is None or relance.date_prevue < current.date_prevue:
            relances_by_candidature[relance.candidature_id] = relance
    return relances_by_candidature


def _map_candidature_to_legacy(
    candidature: Candidature,
    etablissement: Etablissement | None,
    relance: Relance | None = None,
) -> dict:
    return {
        "id": _legacy_hash(candidature.id),
        "organization_id": _legacy_hash(etablissement.id, prefix="org:") if etablissement else None,
        "final_customer_organization_id": _legacy_hash(candidature.client_final.id, prefix="org:") if candidature.client_final else None,
        "final_customer_name": candidature.client_final.nom if candidature.client_final else None,
        "company": etablissement.nom if etablissement else "Etablissement",
        "title": candidature.poste,
        "type": candidature.description or "CDI",
        "status": SAAS_TO_LEGACY_STATUS.get(candidature.statut, "APPLIED"),
        "source": candidature.source,
        "job_url": candidature.url_offre,
        "applied_at": candidature.date_candidature.isoformat() if candidature.date_candidature else None,
        "next_followup_at": relance.date_prevue.isoformat() if relance and relance.statut == "a_faire" else None,
        "created_at": candidature.created_at.isoformat() if candidature.created_at else None,
        "updated_at": candidature.updated_at.isoformat() if candidature.updated_at else None,
        "hidden": 0,
    }


def _map_event_to_legacy(event: CandidatureEvent, candidature: Candidature | None = None) -> dict:
    event_type_map = {
        "creation": "CREATED",
        "statut_change": "STATUS_CHANGED",
        "note_ajout": "NOTE_ADDED",
        "contact_ajout": "CONTACT_LINKED",
        "relance_envoyee": "FOLLOWUP_SENT",
        "entretien_planifie": "INTERVIEW_SCHEDULED",
        "offre_recue": "OFFER_RECEIVED",
        "document_joint": "UPDATED",
    }
    payload: dict[str, object] = {}
    if event.ancien_statut:
        payload["old_status"] = SAAS_TO_LEGACY_STATUS.get(event.ancien_statut, event.ancien_statut.upper())
    if event.nouveau_statut:
        payload["new_status"] = SAAS_TO_LEGACY_STATUS.get(event.nouveau_statut, event.nouveau_statut.upper())
    if event.contenu:
        payload["text"] = event.contenu
    if candidature:
        payload.setdefault("company", candidature.etablissement.nom if candidature.etablissement else None)
        payload.setdefault("title", candidature.poste)
    return {
        "id": _legacy_hash(event.id, prefix="event:"),
        "ts": event.created_at.isoformat() if event.created_at else None,
        "type": event_type_map.get(event.type, event.type.upper()),
        "event_type": event_type_map.get(event.type, event.type.upper()),
        "payload": payload,
    }

@app.get("/", response_class=HTMLResponse)
async def list_applications(
    request: Request,
    status: str = None,
    type: str = None,
    source: str = None,
    has_contact: str = None,
    followup_due: str = None,
    search: str = None,
    show_hidden: str = None
):
    filters = {
        "status": status,
        "type": type,
        "source": source,
        "has_contact": has_contact,
        "followup_due": followup_due
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    show_hidden_bool = show_hidden == "yes"
    apps = database.list_applications(filters=filters, search=search, show_hidden=show_hidden_bool)
    
    # Dashboard data
    kpis = database.get_kpis(filters)
    monthly_kpis = database.get_monthly_kpis()
    annual_stats = database.get_annual_monthly_stats()
    followups = database.list_followups()
    sources = database.get_distinct_sources()
    
    return templates.TemplateResponse(request, "index.html", {
        "branch_name": get_branch_name(),
        "applications": apps,
        "filters": filters,
        "search": search,
        "show_hidden": show_hidden_bool,
        "kpis": kpis,
        "monthly_kpis": monthly_kpis,
        "annual_stats": annual_stats,
        "followups": followups,
        "sources": sources
    })

@app.get("/api/dashboard")
async def api_dashboard(
    status: str = None,
    type: str = None,
    source: str = None,
):
    filters = {
        "status": status,
        "type": type,
        "source": source,
    }
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    kpis = database.get_kpis(filters)
    monthly_kpis = database.get_monthly_kpis()
    sources = database.get_distinct_sources()
    followups = database.list_followups()
    
    return {
        "kpis": kpis,
        "monthly_kpis": monthly_kpis,
        "sources": sources,
        "followups": followups
    }

@app.get("/api/insights/monthly-applications")
async def api_monthly_applications(year: int = None):
    if year is None:
        year = datetime.now().year
    
    stats = database.get_annual_monthly_stats(year)
    return {
        "year": year,
        "months": stats
    }

@app.get("/api/applications")
async def api_applications(
    status: str = None,
    type: str = None,
    source: str = None,
    search: str = None,
    show_hidden: bool = False,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    candidatures = (
        db.query(Candidature)
        .filter(Candidature.user_id == user_id)
        .order_by(Candidature.updated_at.desc())
        .all()
    )
    if status:
        saas_status = LEGACY_TO_SAAS_STATUS.get(status.upper(), status.lower())
        candidatures = [item for item in candidatures if item.statut == saas_status]
    elif not show_hidden:
        candidatures = [item for item in candidatures if item.statut not in HIDDEN_SAAS_STATUSES]
    if type:
        candidatures = [item for item in candidatures if (item.description or "").lower() == type.lower()]
    if source:
        candidatures = [item for item in candidatures if (item.source or "").lower() == source.lower()]
    if search:
        needle = search.strip().lower()
        candidatures = [
            item
            for item in candidatures
            if needle in (item.poste or "").lower()
            or needle in (item.notes or "").lower()
            or needle in ((item.etablissement.nom if item.etablissement else "")).lower()
        ]

    relances_by_candidature = _map_relance_by_candidature(
        db.query(Relance).filter(Relance.user_id == user_id, Relance.statut == "a_faire").all()
    )
    total = len(candidatures)
    offset = (page - 1) * limit
    items = candidatures[offset : offset + limit]

    return {
        "items": [
            _map_candidature_to_legacy(
                item,
                item.etablissement,
                relances_by_candidature.get(item.id),
            )
            for item in items
        ],
        "total": total,
        "page": page,
        "limit": limit
    }

@app.post("/applications", response_class=RedirectResponse)
async def create_application(
    company: str = Form(...),
    title: str = Form(...),
    type: str = Form(...),
    status: str = Form(...),
    source: str = Form(None),
    job_url: str = Form(None),
    applied_at: str = Form(None),
    next_followup_at: str = Form(None)
):
    database.create_application(company, title, type, status, applied_at, next_followup_at, source, job_url)
    return RedirectResponse(url="/", status_code=303)

@app.get("/api/organizations")
async def api_list_organizations(
    type: str = None,
    search: str = None,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    etablissements = db.query(Etablissement).order_by(Etablissement.nom.asc()).all()
    candidatures = db.query(Candidature).filter(Candidature.user_id == user_id).all()
    candidatures_by_ets: dict[str, list[Candidature]] = {}
    for candidature in candidatures:
        candidatures_by_ets.setdefault(candidature.etablissement_id, []).append(candidature)

    results = []
    for etablissement in etablissements:
        mapped = _map_etablissement_to_legacy(etablissement, candidatures_by_ets.get(etablissement.id, []))
        if type and mapped["type"] != type:
            continue
        if search and search.strip().lower() not in mapped["name"].lower():
            continue
        results.append(mapped)
    return results

@app.get("/api/organizations/{org_id}")
async def api_get_organization(
    org_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_id = _resolve_hashed_uuid(db, Etablissement, org_id, prefix="org:")
    if not resolved_id:
        raise HTTPException(status_code=404, detail="Organization not found")
    org = db.query(Etablissement).filter(Etablissement.id == resolved_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    candidatures = db.query(Candidature).filter(
        Candidature.user_id == user_id,
        Candidature.etablissement_id == org.id,
    ).all()
    return _map_etablissement_to_legacy(org, candidatures)

@app.post("/api/organizations", status_code=201)
async def api_create_organization(
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    etablissement = Etablissement(
        nom=data.get("name") or "Sans nom",
        type=(data.get("type") or "AUTRE").lower(),
        site_web=data.get("website"),
        description=data.get("notes"),
        created_by=user_id,
    )
    db.add(etablissement)
    db.commit()
    db.refresh(etablissement)
    return {"id": _legacy_hash(etablissement.id, prefix="org:")}

@app.patch("/api/organizations/{org_id}")
async def api_update_organization(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_id = _resolve_hashed_uuid(db, Etablissement, org_id, prefix="org:")
    organization = db.query(Etablissement).filter(Etablissement.id == resolved_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    if "name" in data:
        organization.nom = data["name"]
    if "type" in data and data["type"] is not None:
        organization.type = str(data["type"]).lower()
    if "website" in data:
        organization.site_web = data["website"]
    if "notes" in data:
        organization.description = data["notes"]
    db.commit()
    db.refresh(organization)
    candidatures = db.query(Candidature).filter(
        Candidature.user_id == user_id,
        Candidature.etablissement_id == organization.id,
    ).all()
    return _map_etablissement_to_legacy(organization, candidatures)

@app.delete("/api/organizations/{org_id}")
async def api_delete_organization(
    org_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_id = _resolve_hashed_uuid(db, Etablissement, org_id, prefix="org:")
    organization = db.query(Etablissement).filter(Etablissement.id == resolved_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    has_candidatures = db.query(Candidature).filter(Candidature.etablissement_id == organization.id).first()
    if has_candidatures:
        raise HTTPException(status_code=400, detail="Cannot delete organization with applications")
    db.delete(organization)
    db.commit()
    return {"success": True}

@app.post("/api/organizations/{org_id}/merge")
async def api_merge_organization(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    source_id = _resolve_hashed_uuid(db, Etablissement, org_id, prefix="org:")
    target_id = _resolve_hashed_uuid(db, Etablissement, data.get("target_organization_id"), prefix="org:")
    source = db.query(Etablissement).filter(Etablissement.id == source_id).first()
    target = db.query(Etablissement).filter(Etablissement.id == target_id).first()
    if not source or not target or source.id == target.id:
        raise HTTPException(status_code=400, detail="Merge failed")
    db.query(Candidature).filter(Candidature.etablissement_id == source.id).update(
        {Candidature.etablissement_id: target.id},
        synchronize_session=False,
    )
    db.query(Contact).filter(Contact.etablissement_id == source.id).update(
        {Contact.etablissement_id: target.id},
        synchronize_session=False,
    )
    db.delete(source)
    db.commit()
    return {"success": True}

@app.post("/api/organizations/{org_id}/split")
async def api_split_organization(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    source_id = _resolve_hashed_uuid(db, Etablissement, org_id, prefix="org:")
    source = db.query(Etablissement).filter(Etablissement.id == source_id).first()
    new_name = (data.get("name") or "").strip()
    if not source or not new_name:
        raise HTTPException(status_code=400, detail="Split failed")
    new_organization = Etablissement(
        nom=new_name,
        type=str(data.get("type") or "AUTRE").lower(),
        site_web=data.get("website"),
        description=data.get("notes"),
        created_by=user_id,
    )
    db.add(new_organization)
    db.flush()
    db.query(Candidature).filter(Candidature.etablissement_id == source.id).update(
        {Candidature.etablissement_id: new_organization.id},
        synchronize_session=False,
    )
    if data.get("move_contacts", True):
        db.query(Contact).filter(Contact.etablissement_id == source.id).update(
            {Contact.etablissement_id: new_organization.id},
            synchronize_session=False,
        )
    db.commit()
    return {"id": _legacy_hash(new_organization.id, prefix="org:")}

@app.get("/api/contacts")
async def api_list_contacts(
    organization_id: str = None,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_org_id = _resolve_hashed_uuid(db, Etablissement, organization_id, prefix="org:") if organization_id else None
    contacts = get_visible_contacts(db, user_id, etablissement_id=resolved_org_id)
    interactions = {
        interaction.contact_id: interaction
        for interaction in db.query(ContactInteraction).filter(ContactInteraction.user_id == user_id).all()
    }
    return [_map_contact_to_legacy(contact, interactions.get(contact.id)) for contact in contacts]

@app.get("/api/contacts/{contact_id}")
async def api_get_contact(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_contact_id = _resolve_hashed_uuid(db, Contact, contact_id, prefix="contact:")
    if not resolved_contact_id:
        raise HTTPException(status_code=404, detail="Contact not found")
    contact = db.query(Contact).filter(Contact.id == resolved_contact_id).first()
    if not contact or not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=404, detail="Contact not found")
    interaction = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.contact_id == contact.id, ContactInteraction.user_id == user_id)
        .first()
    )
    applications = (
        db.query(Candidature)
        .filter(
            Candidature.user_id == user_id,
            Candidature.etablissement_id == contact.etablissement_id,
        )
        .order_by(Candidature.updated_at.desc())
        .all()
    )
    relances_by_candidature = _map_relance_by_candidature(
        db.query(Relance).filter(Relance.user_id == user_id, Relance.statut == "a_faire").all()
    )
    events = []
    if interaction:
        events.append(
            {
                "id": _legacy_hash(interaction.id, prefix="event:"),
                "ts": interaction.updated_at.isoformat() if interaction.updated_at else interaction.created_at.isoformat(),
                "type": "UPDATED",
                "event_type": "UPDATED",
                "payload": {"text": interaction.notes} if interaction.notes else {},
            }
        )
    for application in applications:
        for event in application.events:
            mapped = _map_event_to_legacy(event, application)
            mapped["application"] = {
                "id": _legacy_hash(application.id),
                "title": application.poste,
                "status": SAAS_TO_LEGACY_STATUS.get(application.statut, "APPLIED"),
            }
            events.append(mapped)
    events.sort(key=lambda item: item["ts"] or "", reverse=True)
    organization = None
    if contact.etablissement:
        org_candidatures = db.query(Candidature).filter(
            Candidature.user_id == user_id,
            Candidature.etablissement_id == contact.etablissement.id,
        ).all()
        organization = _map_etablissement_to_legacy(contact.etablissement, org_candidatures)

    return {
        **_map_contact_to_legacy(contact, interaction),
        "organization": organization,
        "applications": [
            _map_candidature_to_legacy(item, item.etablissement, relances_by_candidature.get(item.id))
            for item in applications
        ],
        "events": events,
    }

@app.post("/api/contacts", status_code=201)
async def api_create_contact_standalone(
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    organization_id = _resolve_hashed_uuid(db, Etablissement, data.get("organization_id"), prefix="org:") if data.get("organization_id") else None
    if not organization_id:
        raise HTTPException(status_code=400, detail="organization_id is required")
    contact = Contact(
        etablissement_id=organization_id,
        prenom=data.get("first_name") or "",
        nom=data.get("last_name") or "",
        poste=data.get("role"),
        linkedin_url=data.get("linkedin_url"),
        email_pro=data.get("email"),
        created_by=user_id,
    )
    db.add(contact)
    db.flush()
    if data.get("notes") or data.get("phone"):
        db.add(
            ContactInteraction(
                contact_id=contact.id,
                user_id=user_id,
                notes=data.get("notes"),
                telephone=data.get("phone"),
            )
        )
    db.commit()
    return {"id": contact.id}

@app.patch("/api/contacts/{contact_id}")
async def api_update_contact(
    contact_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_contact_id = _resolve_hashed_uuid(db, Contact, contact_id, prefix="contact:")
    contact = db.query(Contact).filter(Contact.id == resolved_contact_id).first()
    if not contact or not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=404, detail="Contact not found")
    if "organization_id" in data:
        contact.etablissement_id = _resolve_hashed_uuid(db, Etablissement, data.get("organization_id"), prefix="org:")
    if "first_name" in data:
        contact.prenom = data.get("first_name") or ""
    if "last_name" in data:
        contact.nom = data.get("last_name") or ""
    if "email" in data:
        contact.email_pro = data.get("email")
    if "role" in data:
        contact.poste = data.get("role")
    if "linkedin_url" in data:
        contact.linkedin_url = data.get("linkedin_url")
    interaction = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.contact_id == contact.id, ContactInteraction.user_id == user_id)
        .first()
    )
    if data.get("notes") is not None or data.get("phone") is not None:
        if interaction is None:
            interaction = ContactInteraction(contact_id=contact.id, user_id=user_id)
            db.add(interaction)
        if "notes" in data:
            interaction.notes = data.get("notes")
        if "phone" in data:
            interaction.telephone = data.get("phone")
    db.commit()
    return {"success": True}

@app.delete("/api/contacts/{contact_id}")
async def api_delete_contact(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_contact_id = _resolve_hashed_uuid(db, Contact, contact_id, prefix="contact:")
    contact = db.query(Contact).filter(Contact.id == resolved_contact_id).first()
    if not contact or not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"success": True}

@app.get("/api/companies")
async def api_list_companies(type: str = None, search: str = None):
    # Compatibility route
    return api_list_organizations(type, search)

@app.get("/api/companies/{company_id}")
async def api_get_company(
    company_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_id = _resolve_hashed_uuid(db, Etablissement, company_id, prefix="org:")
    organization = db.query(Etablissement).filter(Etablissement.id == resolved_id).first()
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    candidatures = db.query(Candidature).filter(
        Candidature.user_id == user_id,
        Candidature.etablissement_id == organization.id,
    ).order_by(Candidature.updated_at.desc()).all()
    relances_by_candidature = _map_relance_by_candidature(
        db.query(Relance).filter(Relance.user_id == user_id).all()
    )
    interactions = {
        interaction.contact_id: interaction
        for interaction in db.query(ContactInteraction).filter(ContactInteraction.user_id == user_id).all()
    }
    contacts = [
        _map_contact_to_legacy(contact, interactions.get(contact.id))
        for contact in get_visible_contacts(db, user_id, etablissement_id=organization.id)
    ]

    events = []
    for candidature in candidatures:
        for event in candidature.events:
            mapped = _map_event_to_legacy(event, candidature)
            mapped["application"] = {
                "id": _legacy_hash(candidature.id),
                "title": candidature.poste,
                "status": SAAS_TO_LEGACY_STATUS.get(candidature.statut, "APPLIED"),
            }
            events.append(mapped)
    events.sort(key=lambda item: item["ts"] or "", reverse=True)

    detail = _map_etablissement_to_legacy(organization, candidatures)
    detail.update(
        {
            "applications": [
                _map_candidature_to_legacy(item, organization, relances_by_candidature.get(item.id))
                for item in candidatures
            ],
            "contacts": contacts,
            "events": events,
        }
    )
    return detail

@app.get("/api/applications/{app_id}")
async def api_application_details(
    app_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_id = _resolve_hashed_uuid(db, Candidature, app_id)
    candidature = db.query(Candidature).filter(
        Candidature.id == resolved_id,
        Candidature.user_id == user_id,
    ).first()
    if not candidature:
        raise HTTPException(status_code=404, detail="Application not found")

    relance = (
        db.query(Relance)
        .filter(Relance.candidature_id == candidature.id, Relance.user_id == user_id, Relance.statut == "a_faire")
        .order_by(Relance.date_prevue.asc())
        .first()
    )
    contacts = [
        _map_contact_to_legacy(
            contact,
            next((interaction for interaction in contact.interactions if interaction.user_id == user_id), None),
        )
        for contact in get_visible_contacts(db, user_id, etablissement_id=candidature.etablissement_id)
    ]
    events = [_map_event_to_legacy(event, candidature) for event in candidature.events]
    events.sort(key=lambda item: item["ts"] or "", reverse=True)
    organization_info = _map_etablissement_to_legacy(candidature.etablissement, [candidature]) if candidature.etablissement else None

    return {
        "application": _map_candidature_to_legacy(candidature, candidature.etablissement, relance),
        "organization": organization_info,
        "final_customer_organization": (
            _map_etablissement_to_legacy(candidature.client_final, [candidature])
            if candidature.client_final
            else None
        ),
        "events": events,
        "contacts": contacts,
        "all_contacts": contacts,
    }

@app.post("/api/applications", status_code=201)
async def api_create_application(data: dict):
    app_id = database.create_application(
        company_name=data.get("company"),
        title=data.get("title"),
        app_type=data.get("type"),
        status=data.get("status"),
        applied_at=data.get("applied_at"),
        next_followup_at=data.get("next_followup_at"),
        source=data.get("source"),
        job_url=data.get("job_url"),
        org_type=data.get("org_type", "AUTRE"),
        organization_id=data.get("organization_id"),
        final_customer_organization_id=data.get("final_customer_organization_id"),
    )
    return {"id": app_id}

@app.patch("/api/applications/{app_id}")
async def api_update_application(app_id: int, data: dict):
    if set(data.keys()) == {"status"}:
        success = database.update_application_status(app_id, data["status"])
    else:
        success = database.update_application(app_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Update failed")
    return {"success": True}

@app.post("/api/applications/{app_id}/notes")
async def api_add_note(app_id: int, data: dict):
    database.add_note(app_id, data.get("text", ""))
    return {"success": True}

@app.post("/api/applications/{app_id}/followup")
async def api_mark_followup(app_id: int):
    database.mark_as_followed_up(app_id)
    return {"success": True}

@app.post("/api/applications/{app_id}/events")
async def api_create_app_event(app_id: int, data: dict):
    with database.get_db() as conn:
        database.log_event(conn, "application", app_id, data.get("event_type"), {"source": "api"})
        conn.commit()
    return {"success": True}

@app.post("/api/applications/{app_id}/link-contact")
async def api_link_contact(app_id: int, data: dict):
    database.link_contact_to_application(app_id, data.get("contact_id"))
    return {"success": True}

@app.post("/api/applications/{app_id}/create-contact")
async def api_create_contact(app_id: int, data: dict):
    contact_id = database.create_contact(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        organization_id=data.get("organization_id"),
        role=data.get("role"),
        is_recruiter=data.get("is_recruiter", 0)
    )
    database.link_contact_to_application(app_id, contact_id)
    return {"id": contact_id}

@app.get("/applications/{app_id}", response_class=HTMLResponse)
async def application_details(request: Request, app_id: int):
    app_data = database.get_application(app_id)
    if not app_data:
        return RedirectResponse(url="/", status_code=404)
    
    company_info = None
    if app_data.get("organization_id"):
        company_info = database.get_organization(app_data["organization_id"])
        
    events = database.get_events_for_entity("application", app_id)
    # Parse payload_json for each event
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    contacts = [format_contact_for_legacy_views(contact) for contact in database.get_contacts_for_application(app_id)]
    all_contacts = [format_contact_for_legacy_views(contact) for contact in database.list_contacts()]
    
    # Also get contact events
    for contact in contacts:
        contact_events = database.get_events_for_entity("contact", contact["id"])
        for ce in contact_events:
            ce["payload"] = json.loads(ce["payload_json"])
            # Prefix contact name to event type for clarity or just add to list
            events.append(ce)
    
    # Sort events by ts again after merging
    events.sort(key=lambda x: x["ts"], reverse=True)
    
    return templates.TemplateResponse(request, "details.html", {
        "branch_name": get_branch_name(),
        "application": app_data,
        "company": company_info,
        "events": events,
        "contacts": contacts,
        "all_contacts": all_contacts
    })

@app.post("/applications/{app_id}/events")
async def create_app_event(app_id: int, event_type: str = Form(...)):
    with database.get_db() as conn:
        database.log_event(conn, "application", app_id, event_type, {"source": "manual_dashboard_lite"})
        conn.commit()
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/dashboard", response_class=HTMLResponse)
async def kpi_dashboard(
    request: Request,
    status: str = None,
    type: str = None,
    source: str = None
):
    filters = {
        "status": status,
        "type": type,
        "source": source
    }
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    kpis = database.get_kpis(filters)
    sources = database.get_distinct_sources()
    
    return templates.TemplateResponse(request, "dashboard.html", {
        "branch_name": get_branch_name(),
        "kpis": kpis,
        "filters": filters,
        "sources": sources
    })

@app.post("/applications/{app_id}/link-contact", response_class=RedirectResponse)
async def link_contact(app_id: int, contact_id: int = Form(...)):
    database.link_contact_to_application(app_id, contact_id)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/create-contact", response_class=RedirectResponse)
async def create_and_link_contact(
    app_id: int,
    name: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    company: str = Form(None)
):
    first_name, last_name = split_legacy_contact_name(name)
    organization_id = None

    if company and company.strip():
        with database.get_db() as conn:
            organization_id = database.get_or_create_organization(conn, company.strip())
            conn.commit()

    contact_id = database.create_contact(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        organization_id=organization_id
    )
    database.link_contact_to_application(app_id, contact_id)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/followups", response_class=HTMLResponse)
async def list_followups(request: Request):
    apps = database.list_followups()
    return templates.TemplateResponse(request, "followups.html", {
        "branch_name": get_branch_name(),
        "applications": apps
    })

@app.post("/applications/{app_id}/followup", response_class=RedirectResponse)
async def mark_followup(app_id: int):
    database.mark_as_followed_up(app_id)
    return RedirectResponse(url="/#queue", status_code=303)

@app.post("/applications/{app_id}/status", response_class=RedirectResponse)
async def update_status(app_id: int, status: str = Form(...)):
    database.update_application_status(app_id, status)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/notes", response_class=RedirectResponse)
async def add_note(app_id: int, text: str = Form(...)):
    database.add_note(app_id, text)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": APP_VERSION}


# ─── Route aliases : /contacts/* ↔ /api/contacts/* ──────────────────────────
# Le frontend appelle désormais /contacts au lieu de /api/contacts.

@app.get("/contacts")
async def list_contacts_alias(
    organization_id: str = None,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_list_contacts(organization_id=organization_id, db=db, user_id=user_id)


@app.get("/contacts/{contact_id}")
async def get_contact_alias(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_get_contact(contact_id=contact_id, db=db, user_id=user_id)


@app.post("/contacts", status_code=201)
async def create_contact_alias(
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_create_contact_standalone(data=data, db=db, user_id=user_id)


@app.patch("/contacts/{contact_id}")
async def update_contact_alias(
    contact_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_update_contact(contact_id=contact_id, data=data, db=db, user_id=user_id)


@app.delete("/contacts/{contact_id}")
async def delete_contact_alias(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_delete_contact(contact_id=contact_id, db=db, user_id=user_id)


# ─── Route aliases : /etablissements/{id}/merge|split ──────────────────────

@app.post("/etablissements/{org_id}/merge")
async def merge_etablissement_alias(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_merge_organization(org_id=org_id, data=data, db=db, user_id=user_id)


@app.post("/etablissements/{org_id}/split")
async def split_etablissement_alias(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    return await api_split_organization(org_id=org_id, data=data, db=db, user_id=user_id)

def parse_date(date_str):
    if not date_str or not date_str.strip():
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return None

@app.post("/api/import")
async def api_process_import(data: dict):
    tsv_data = data.get("tsv", "")
    lines = tsv_data.strip().split("\n")
    if not lines:
        return {"error": "Empty data"}
    
    header = lines[0].split("\t")
    rows = lines[1:]
    
    mapping = {
        "Entreprise": "company",
        "Poste": "title",
        "Lien de l’offre": "job_url",
        "Type": "type",
        "Source": "source",
        "Date candidature": "applied_at",
        "Statut": "status",
        "Date relance prévue": "next_followup_at",
        "Notes": "notes",
        "Contact RH": "contact_rh",
        "Email RH": "email_rh",
        "Téléphone": "phone"
    }
    
    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in mapping:
            col_map[mapping[h_clean]] = i

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}
    
    status_map = {
        "INTERESTED": "INTERESTED", "A CONTACTER": "INTERESTED",
        "APPLIED": "APPLIED", "POSTULÉ": "APPLIED", "CANDIDATURE ENVOYÉE": "APPLIED",
        "INTERVIEW": "INTERVIEW", "ENTRETIEN": "INTERVIEW",
        "OFFER": "OFFER", "OFFRE": "OFFER",
        "REJECTED": "REJECTED", "REFUSÉ": "REJECTED"
    }

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2
        
        try:
            def get_val(key):
                if key in col_map and col_map[key] < len(cols):
                    return cols[col_map[key]].strip()
                return None

            company = get_val("company")
            title = get_val("title")
            
            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue
            
            job_url = get_val("job_url")
            app_type = get_val("type") or "CDI"
            if "FREE" in app_type.upper():
                app_type = "FREELANCE"
            else:
                app_type = "CDI"
            
            source = get_val("source")
            applied_at = parse_date(get_val("applied_at"))
            next_followup_at = parse_date(get_val("next_followup_at"))
            
            raw_status = (get_val("status") or "APPLIED").upper()
            status = status_map.get(raw_status, "APPLIED")

            app_id = database.create_application(
                company_name=company,
                title=title,
                app_type=app_type,
                status=status,
                applied_at=applied_at,
                next_followup_at=next_followup_at,
                source=source,
                job_url=job_url
            )
            
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                database.add_note(app_id, "\n".join(notes))
                
            results["created"] += 1
            
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    return results

@app.get("/import", response_class=HTMLResponse)
async def import_page(request: Request):
    return templates.TemplateResponse(request, "import.html", {
        "branch_name": get_branch_name(),
        "results": None
    })

@app.post("/import", response_class=HTMLResponse)
async def process_import(request: Request, tsv_data: str = Form(...)):
    lines = tsv_data.strip().split("\n")
    if not lines:
        return RedirectResponse(url="/import", status_code=303)
    
    header = lines[0].split("\t")
    rows = lines[1:]
    
    mapping = {
        "Entreprise": "company",
        "Poste": "title",
        "Lien de l’offre": "job_url",
        "Type": "type",
        "Source": "source",
        "Date candidature": "applied_at",
        "Statut": "status",
        "Date relance prévue": "next_followup_at",
        "Notes": "notes",
        "Contact RH": "contact_rh",
        "Email RH": "email_rh",
        "Téléphone": "phone"
    }
    
    # Reverse mapping for easy lookup
    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in mapping:
            col_map[mapping[h_clean]] = i

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}
    
    status_map = {
        "INTERESTED": "INTERESTED", "A CONTACTER": "INTERESTED",
        "APPLIED": "APPLIED", "POSTULÉ": "APPLIED", "CANDIDATURE ENVOYÉE": "APPLIED",
        "INTERVIEW": "INTERVIEW", "ENTRETIEN": "INTERVIEW",
        "OFFER": "OFFER", "OFFRE": "OFFER",
        "REJECTED": "REJECTED", "REFUSÉ": "REJECTED"
    }

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2
        
        try:
            def get_val(key):
                if key in col_map and col_map[key] < len(cols):
                    return cols[col_map[key]].strip()
                return None

            company = get_val("company")
            title = get_val("title")
            
            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue
            
            job_url = get_val("job_url")
            app_type = get_val("type") or "CDI"
            if "FREE" in app_type.upper():
                app_type = "FREELANCE"
            else:
                app_type = "CDI"
            
            source = get_val("source")
            applied_at = parse_date(get_val("applied_at"))
            next_followup_at = parse_date(get_val("next_followup_at"))
            
            raw_status = (get_val("status") or "APPLIED").upper()
            status = status_map.get(raw_status, "APPLIED")

            app_id = database.create_application(
                company_name=company,
                title=title,
                app_type=app_type,
                status=status,
                applied_at=applied_at,
                next_followup_at=next_followup_at,
                source=source,
                job_url=job_url
            )
            
            # Handle extra fields as notes
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                database.add_note(app_id, "\n".join(notes))
                
            results["created"] += 1
            
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    return templates.TemplateResponse(request, "import.html", {
        "branch_name": get_branch_name(),
        "results": results
    })
