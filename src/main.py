import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .auth import start_scheduler
from .config import settings
from .database import init_db as init_saas_db
from .routers import auth as auth_router
from .routers import admin as admin_router
from .routers import candidatures as candidatures_router
from .routers import candidature_events as candidature_events_router
from .routers import contact_interactions as contact_interactions_router
from .routers import etablissements as etablissements_router
from .routers import import_data as import_router
from .routers import legacy_aliases as legacy_aliases_router
from .routers.legacy_aliases import api_get_contact  # re-exported: tests/test_contact_visibility.py imports it from here
from .routers import me as me_router
from .routers import relances as relances_router
from .routers import subscription as subscription_router

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
app.include_router(import_router.router, tags=["import"])
app.include_router(legacy_aliases_router.router, tags=["legacy-aliases"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": APP_VERSION}
