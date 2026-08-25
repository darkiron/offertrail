"""
OfferTrail — configuration centralisée.

Point d'entrée unique pour les variables d'environnement du backend.
Remplace les appels `os.getenv()` auparavant dispersés dans `main.py`,
`auth.py`, `database.py`, `services/stripe_service.py` et `services/email.py`
(voir ADR-0002).

`pydantic-settings` n'est pas une dépendance du projet (absent de
requirements.txt) : on utilise donc un `pydantic.BaseModel` peuplé
explicitement depuis `os.environ`, ce qui reste dans les dépendances déjà
installées (pydantic est fourni par FastAPI) sans en ajouter une nouvelle.
"""
import os

from dotenv import load_dotenv
from pydantic import BaseModel

# Charge un éventuel fichier .env avant lecture des variables d'environnement —
# même comportement que l'ancien `load_dotenv()` de src/database.py, mais
# centralisé ici pour ne s'exécuter qu'une fois.
load_dotenv()


class Settings(BaseModel):
    # Base de données (src/database.py)
    DATABASE_URL: str = "sqlite:///./offertrail.db"

    # Auth Supabase (src/auth.py)
    SUPABASE_URL: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # CORS (src/main.py)
    ALLOWED_ORIGINS: str | None = None
    ALLOWED_ORIGIN_REGEX: str | None = None

    # Stripe (src/main.py, src/services/stripe_service.py)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    APP_BASE_URL: str = "http://localhost:5173"
    STRIPE_LAUNCH_TRIAL_DAYS: int = 0
    STRIPE_PRICE_PRO_MONTHLY: str = ""
    STRIPE_PRICE_PRO_YEARLY: str = ""
    STRIPE_PRICE_ULTIMATE_MONTHLY: str = ""
    STRIPE_PRICE_ULTIMATE_YEARLY: str = ""

    # Email transactionnel (src/services/email.py)
    RESEND_API_KEY: str = ""

    # Monitoring d'erreurs Sentry (src/services/monitoring.py) — désactivé par
    # défaut (no-op complet) tant que SENTRY_DSN n'est pas défini. Ne pas
    # définir en production sans politique de rétention/échantillonnage,
    # propriétaire d'alerte et revue de confidentialité validés au préalable.
    SENTRY_DSN: str = ""
    # SHA du commit déployé, exposé par Render (voir docs/render-deployment.md) —
    # utilisé pour taguer la release Sentry. Vide en local/dev.
    RENDER_GIT_COMMIT: str = ""


def _load_settings() -> Settings:
    """Lit `os.environ` une fois — mêmes noms de variables et mêmes valeurs
    par défaut que les appels `os.getenv()` historiques qu'elle remplace."""
    return Settings(
        DATABASE_URL=os.getenv("DATABASE_URL", "sqlite:///./offertrail.db"),
        SUPABASE_URL=os.getenv("SUPABASE_URL", ""),
        SUPABASE_JWT_SECRET=os.getenv("SUPABASE_JWT_SECRET", ""),
        ALLOWED_ORIGINS=os.getenv("ALLOWED_ORIGINS"),
        ALLOWED_ORIGIN_REGEX=os.getenv("ALLOWED_ORIGIN_REGEX"),
        STRIPE_SECRET_KEY=os.getenv("STRIPE_SECRET_KEY", ""),
        STRIPE_WEBHOOK_SECRET=os.getenv("STRIPE_WEBHOOK_SECRET", ""),
        APP_BASE_URL=os.getenv("APP_BASE_URL", "http://localhost:5173"),
        STRIPE_LAUNCH_TRIAL_DAYS=int(os.getenv("STRIPE_LAUNCH_TRIAL_DAYS", "0")),
        STRIPE_PRICE_PRO_MONTHLY=os.getenv("STRIPE_PRICE_PRO_MONTHLY", ""),
        STRIPE_PRICE_PRO_YEARLY=os.getenv("STRIPE_PRICE_PRO_YEARLY", ""),
        STRIPE_PRICE_ULTIMATE_MONTHLY=os.getenv("STRIPE_PRICE_ULTIMATE_MONTHLY", ""),
        STRIPE_PRICE_ULTIMATE_YEARLY=os.getenv("STRIPE_PRICE_ULTIMATE_YEARLY", ""),
        RESEND_API_KEY=os.getenv("RESEND_API_KEY", ""),
        SENTRY_DSN=os.getenv("SENTRY_DSN", ""),
        RENDER_GIT_COMMIT=os.getenv("RENDER_GIT_COMMIT", ""),
    )


settings = _load_settings()
