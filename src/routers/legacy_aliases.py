"""Quarantined legacy hashed-id alias routes.

These 9 routes and their supporting id-translation shim
(`_legacy_hash`, `_resolve_hashed_uuid`, `_map_*_to_legacy`) exist only
because the frontend used to send fake hashed-numeric ids instead of real
UUIDs to the backend. That frontend-side problem has since been fixed
(Organizations/Candidatures/Contacts all migrated to real UUID strings), but
this backend-side compatibility shim has not been deleted yet — deleting it
safely requires confirming nothing still depends on it.

This module is a pure relocation out of `src/main.py` with zero behavior
change: same routes, same handlers, same shim logic, verbatim. It quarantines
the legacy code so `main.py` only contains real bootstrap.

Temporary. Tracked by https://github.com/darkiron/offertrail/issues/151
(this move) — full deletion is tracked as a separate follow-up issue once the
frontend's UUID migration is fully confirmed. Do not add new code here.
"""

import ctypes

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth import _user_can_see_contact, get_active_user_id, get_current_user_id, get_visible_contacts
from src.database import get_db as get_saas_db
from src.enums import CandidatureStatut, STATUTS_REPONSE_POSITIVE
from src.models import Candidature, CandidatureEvent, Contact, ContactInteraction, Etablissement, Relance

router = APIRouter()

SAAS_TO_LEGACY_STATUS = {
    CandidatureStatut.EN_ATTENTE.value:  "INTERESTED",
    CandidatureStatut.ENVOYEE.value:     "APPLIED",
    CandidatureStatut.ENTRETIEN.value:   "INTERVIEW",
    CandidatureStatut.OFFRE_RECUE.value: "OFFER",
    CandidatureStatut.REFUSEE.value:     "REJECTED",
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
        or candidature.statut in STATUTS_REPONSE_POSITIVE
    ]
    positive = [
        candidature
        for candidature in candidatures
        if candidature.statut in STATUTS_REPONSE_POSITIVE
    ]
    ghosting = [candidature for candidature in candidatures if candidature.statut == CandidatureStatut.REFUSEE]
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
        "type": candidature.type_contrat or "autre",
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
    if source.created_by != user_id:
        raise HTTPException(status_code=403, detail="Merge not authorized")
    db.query(Candidature).filter(
        Candidature.etablissement_id == source.id,
        Candidature.user_id == user_id,
    ).update(
        {Candidature.etablissement_id: target.id},
        synchronize_session=False,
    )
    db.query(Contact).filter(
        Contact.etablissement_id == source.id,
        Contact.created_by == user_id,
    ).update(
        {Contact.etablissement_id: target.id},
        synchronize_session=False,
    )
    foreign_candidature = db.query(Candidature).filter(
        Candidature.etablissement_id == source.id,
        Candidature.user_id != user_id,
    ).first()
    if foreign_candidature:
        raise HTTPException(status_code=409, detail="Organization is shared and cannot be merged")
    db.delete(source)
    db.commit()
    return {"success": True}

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
    if source.created_by != user_id:
        raise HTTPException(status_code=403, detail="Split not authorized")
    new_organization = Etablissement(
        nom=new_name,
        type=str(data.get("type") or "AUTRE").lower(),
        site_web=data.get("website"),
        description=data.get("notes"),
        created_by=user_id,
    )
    db.add(new_organization)
    db.flush()
    db.query(Candidature).filter(
        Candidature.etablissement_id == source.id,
        Candidature.user_id == user_id,
    ).update(
        {Candidature.etablissement_id: new_organization.id},
        synchronize_session=False,
    )
    if data.get("move_contacts", True):
        db.query(Contact).filter(
            Contact.etablissement_id == source.id,
            Contact.created_by == user_id,
        ).update(
            {Contact.etablissement_id: new_organization.id},
            synchronize_session=False,
        )
    db.commit()
    return {"id": _legacy_hash(new_organization.id, prefix="org:")}

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
                "id": application.id,
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
        organization["id"] = contact.etablissement.id

    return {
        **_map_contact_to_legacy(contact, interaction),
        "organization": organization,
        "applications": [
            {
                **_map_candidature_to_legacy(item, item.etablissement, relances_by_candidature.get(item.id)),
                "id": item.id,
            }
            for item in applications
        ],
        "events": events,
    }

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

async def api_delete_contact(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_current_user_id),
):
    resolved_contact_id = _resolve_hashed_uuid(db, Contact, contact_id, prefix="contact:")
    contact = db.query(Contact).filter(Contact.id == resolved_contact_id).first()
    if not contact or not _user_can_see_contact(db, user_id, contact):
        raise HTTPException(status_code=404, detail="Contact not found")
    if contact.created_by != user_id:
        raise HTTPException(status_code=403, detail="Contact deletion not authorized")
    db.delete(contact)
    db.commit()
    return {"success": True}


# ─── Route aliases : /contacts/* ↔ /api/contacts/* ──────────────────────────
# Le frontend appelle désormais /contacts au lieu de /api/contacts.

@router.get("/contacts")
async def list_contacts_alias(
    organization_id: str = None,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_list_contacts(organization_id=organization_id, db=db, user_id=user_id)


@router.get("/contacts/{contact_id}")
async def get_contact_alias(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_get_contact(contact_id=contact_id, db=db, user_id=user_id)


@router.post("/contacts", status_code=201)
async def create_contact_alias(
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_create_contact_standalone(data=data, db=db, user_id=user_id)


@router.patch("/contacts/{contact_id}")
async def update_contact_alias(
    contact_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_update_contact(contact_id=contact_id, data=data, db=db, user_id=user_id)


@router.delete("/contacts/{contact_id}")
async def delete_contact_alias(
    contact_id: str,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_delete_contact(contact_id=contact_id, db=db, user_id=user_id)


# ─── Route aliases : /etablissements/{id}/merge|split ──────────────────────

@router.post("/etablissements/{org_id}/merge")
async def merge_etablissement_alias(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_merge_organization(org_id=org_id, data=data, db=db, user_id=user_id)


@router.post("/etablissements/{org_id}/split")
async def split_etablissement_alias(
    org_id: str,
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
):
    return await api_split_organization(org_id=org_id, data=data, db=db, user_id=user_id)
