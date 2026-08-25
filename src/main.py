import logging
import subprocess
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from .auth import get_active_profile, get_active_user_id, start_scheduler
from .config import settings
from .database import get_db as get_saas_db, init_db as init_saas_db
from .enums import CandidatureStatut, STATUTS_CLOS, STATUTS_ACTIFS
from .models import Candidature, CandidatureEvent, Etablissement, Profile
from .routers import auth as auth_router
from .routers import admin as admin_router
from .routers import candidatures as candidatures_router
from .routers import candidature_events as candidature_events_router
from .routers import contact_interactions as contact_interactions_router
from .routers import etablissements as etablissements_router
from .routers import legacy_aliases as legacy_aliases_router
from .routers.legacy_aliases import api_get_contact  # re-exported: tests/test_contact_visibility.py imports it from here
from .routers import me as me_router
from .routers import relances as relances_router
from .routers import subscription as subscription_router
from .services.subscription import require_plan_feature
import json
from contextlib import asynccontextmanager
from datetime import datetime

APP_VERSION = "0.1.0"
logger = logging.getLogger(__name__)
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://offertrail.local",
]
DEFAULT_ALLOWED_ORIGIN_REGEX = r"^https://(([a-z0-9-]+\.)?offertrail\.fr|offertrail\.craftcodes\.fr)$"


def _parse_allowed_origins(raw_value: str | None) -> list[str]:
    if not raw_value or not raw_value.strip():
        return DEFAULT_ALLOWED_ORIGINS

    origins: list[str] = []
    for origin in raw_value.split(","):
        normalized = origin.strip().rstrip("/")
        if normalized and normalized not in origins:
            origins.append(normalized)

    return origins or DEFAULT_ALLOWED_ORIGINS


def _parse_allowed_origin_regex(raw_value: str | None) -> str | None:
    if raw_value is None:
        return DEFAULT_ALLOWED_ORIGIN_REGEX

    normalized = raw_value.strip()
    return normalized or None

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.STRIPE_SECRET_KEY.strip():
        logger.warning("STRIPE_SECRET_KEY manquante — paiement Stripe désactivé")
    init_saas_db()
    start_scheduler()
    yield

app = FastAPI(title="OfferTrail", lifespan=lifespan)
origins = _parse_allowed_origins(settings.ALLOWED_ORIGINS)
origin_regex = _parse_allowed_origin_regex(settings.ALLOWED_ORIGIN_REGEX)
app.state.limiter = Limiter(key_func=get_remote_address)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class CatchServerErrorsMiddleware(BaseHTTPMiddleware):
    """Transforme toute exception non gérée en réponse 500 « gérée ».

    Sans cela, une exception remonte jusqu'au ServerErrorMiddleware de Starlette
    (le plus externe), dont la réponse 500 ne traverse pas le CORSMiddleware :
    le navigateur ne reçoit alors aucun en-tête CORS et masque l'erreur réelle
    (préflight avorté). En la convertissant ici, la réponse retraverse le CORS.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception:
            logger.exception("Erreur non gérée sur %s %s", request.method, request.url.path)
            return JSONResponse({"detail": "Erreur interne du serveur"}, status_code=500)


# Ordre des middlewares (le dernier ajouté est le plus externe) :
# CORS doit envelopper tout le reste pour ajouter ses en-têtes même aux erreurs ;
# CatchServerErrors reste au plus près des routes pour capturer les exceptions.
app.add_middleware(CatchServerErrorsMiddleware)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
app.include_router(admin_router.router)
app.include_router(etablissements_router.router, prefix="/etablissements", tags=["etablissements"])
app.include_router(candidatures_router.router, prefix="/candidatures", tags=["candidatures"])
app.include_router(relances_router.router, prefix="/relances", tags=["relances"])
app.include_router(candidature_events_router.router, prefix="/candidature-events", tags=["candidature-events"])
app.include_router(contact_interactions_router.router, prefix="/contact-interactions", tags=["contact-interactions"])
app.include_router(me_router.router, prefix="/me", tags=["me"])
app.include_router(subscription_router.router)
app.include_router(legacy_aliases_router.router, tags=["legacy-aliases"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": APP_VERSION}


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

HIDDEN_SAAS_STATUSES = STATUTS_CLOS | {CandidatureStatut.OFFRE_RECUE}
LEGACY_TO_SAAS_STATUS = {
    "INTERESTED": CandidatureStatut.EN_ATTENTE.value,
    "APPLIED":    CandidatureStatut.ENVOYEE.value,
    "INTERVIEW":  CandidatureStatut.ENTRETIEN.value,
    "OFFER":      CandidatureStatut.OFFRE_RECUE.value,
    "REJECTED":   CandidatureStatut.REFUSEE.value,
}


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
def api_process_import(
    data: dict,
    db: Session = Depends(get_saas_db),
    user_id: str = Depends(get_active_user_id),
    profile: Profile = Depends(get_active_profile),
):
    require_plan_feature(profile, "import_csv")
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
        "Source": "source",
        "Date candidature": "applied_at",
        "Statut": "status",
        "Notes": "notes",
        "Contact RH": "contact_rh",
        "Email RH": "email_rh",
        "Téléphone": "phone",
    }

    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in mapping:
            col_map[mapping[h_clean]] = i

    status_map = {
        "INTERESTED": "brouillon", "A CONTACTER": "brouillon",
        "APPLIED": "envoyee", "POSTULÉ": "envoyee", "CANDIDATURE ENVOYÉE": "envoyee",
        "INTERVIEW": "entretien", "ENTRETIEN": "entretien",
        "OFFER": "offre_recue", "OFFRE": "offre_recue",
        "REJECTED": "refusee", "REFUSÉ": "refusee",
    }

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2

        try:
            def get_val(key, _cols=cols):
                if key in col_map and col_map[key] < len(_cols):
                    return _cols[col_map[key]].strip() or None
                return None

            company = get_val("company")
            title = get_val("title")

            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue

            etablissement = db.query(Etablissement).filter(Etablissement.nom == company).first()
            if not etablissement:
                etablissement = Etablissement(nom=company, created_by=user_id)
                db.add(etablissement)
                db.flush()

            raw_status = (get_val("status") or "APPLIED").upper()
            statut = status_map.get(raw_status, "envoyee")

            raw_date = get_val("applied_at")
            date_candidature = parse_date(raw_date)

            note_parts = []
            if get_val("notes"):      note_parts.append(get_val("notes"))
            if get_val("contact_rh"): note_parts.append("Contact RH: " + get_val("contact_rh"))
            if get_val("email_rh"):   note_parts.append("Email RH: " + get_val("email_rh"))
            if get_val("phone"):      note_parts.append("Telephone: " + get_val("phone"))

            cand = Candidature(
                user_id=user_id,
                etablissement_id=etablissement.id,
                poste=title,
                url_offre=get_val("job_url"),
                source=get_val("source"),
                statut=statut,
                date_candidature=datetime.fromisoformat(date_candidature) if date_candidature else None,
                notes="\n".join(note_parts) if note_parts else None,
            )
            db.add(cand)
            db.flush()
            db.add(CandidatureEvent(
                candidature_id=cand.id,
                user_id=user_id,
                type="creation",
                nouveau_statut=statut,
                contenu="Importée",
            ))
            results["created"] += 1

        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    db.commit()
    return results
