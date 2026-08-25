"""
OfferTrail — monitoring d'erreurs (Sentry), désactivé par défaut.

No-op complet tant que `SENTRY_DSN` n'est pas défini : `init_sentry()` retourne
immédiatement sans importer `sentry_sdk`, sans appel réseau et sans overhead —
le comportement de l'application reste strictement identique à l'absence de ce
module (voir src/main.py).

Quand activé, ce module reprend les principes du contrat d'observabilité
frontend (docs/engineering/frontend-observability.md, branche
refactor/frontend-atomic-scss) : release identifiée par le SHA du commit
déployé, et scrubbing PII explicite avant tout envoi à Sentry.

Important — ce module fournit uniquement le CODE. Activer `SENTRY_DSN` en
production reste conditionné à des décisions produit/ops non prises ici :
- une politique de rétention des données validée,
- une politique d'échantillonnage (sampling) définie,
- un propriétaire d'alerte (alert ownership) identifié,
- une revue de confidentialité (privacy review) effectuée.
Tant que ces points ne sont pas actés, `SENTRY_DSN` doit rester vide en
déploiement (voir render.yaml / docs/render-deployment.md, non modifiés par
ce changement).

Scrubbing PII appliqué (voir `_before_send`) :
- Authorization / Cookie / Proxy-Authorization / X-Api-Key : toujours retirés
  des en-têtes de requête avant envoi (défense en profondeur — le SDK Sentry
  le fait déjà par défaut quand `send_default_pii=False`, ce qui est explicite
  ci-dessous, mais on ne s'y fie pas implicitement).
- Corps de requête du webhook Stripe (`POST /subscription/webhook`) : jamais
  transmis. Point d'attention critique : l'intégration Starlette de Sentry
  capture le corps JSON des requêtes (jusqu'à `max_request_body_size`)
  INDÉPENDAMMENT de `send_default_pii` — seuls les cookies et en-têtes
  sensibles sont conditionnés par ce flag. Sans ce filtre explicite, le
  payload Stripe (PII client + détails de paiement) serait donc transmis tel
  quel à chaque erreur sur cette route.
- Tout champ `password` dans un corps de requête (JSON ou formulaire) : retiré,
  quelle que soit la route.
"""
import logging
from typing import Any

from src.config import settings

logger = logging.getLogger(__name__)

# Route dont le corps de requête ne doit jamais quitter le serveur : contient
# le payload brut envoyé par Stripe (PII client, détails de paiement).
_STRIPE_WEBHOOK_PATH = "/subscription/webhook"

_SENSITIVE_HEADER_NAMES = {
    "authorization",
    "cookie",
    "set-cookie",
    "proxy-authorization",
    "x-api-key",
}

_REDACTED = "[Filtered]"


def _scrub_headers(headers: dict) -> None:
    for key in list(headers.keys()):
        if isinstance(key, str) and key.lower() in _SENSITIVE_HEADER_NAMES:
            headers[key] = _REDACTED


def _scrub_password_fields(data: Any) -> Any:
    """Retire récursivement tout champ `password` d'un corps de requête."""
    if isinstance(data, dict):
        return {
            key: (
                _REDACTED
                if isinstance(key, str) and key.lower() == "password"
                else _scrub_password_fields(value)
            )
            for key, value in data.items()
        }
    if isinstance(data, list):
        return [_scrub_password_fields(item) for item in data]
    return data


def _before_send(event: dict, hint: dict) -> dict:
    """Hook Sentry `before_send` : dernier filtre PII avant envoi de l'event.

    Appelé pour chaque exception/message capturé. Ne doit jamais lever — un
    scrubbing manqué ne doit pas faire perdre l'event, mais une exception ici
    ne doit jamais faire planter la requête applicative non plus ; on reste
    donc défensif sur les types.
    """
    request = event.get("request")
    if not isinstance(request, dict):
        return event

    headers = request.get("headers")
    if isinstance(headers, dict):
        _scrub_headers(headers)

    url = request.get("url") or ""
    if _STRIPE_WEBHOOK_PATH in url:
        # Le payload webhook Stripe ne doit jamais atteindre un tiers, même
        # partiellement — on ne tente pas de le filtrer champ par champ.
        if "data" in request:
            request["data"] = "[Filtered: Stripe webhook payload]"
        request.pop("cookies", None)
    elif "data" in request:
        request["data"] = _scrub_password_fields(request["data"])

    return event


def init_sentry() -> None:
    """Initialise Sentry si `SENTRY_DSN` est configuré — no-op sinon.

    À appeler une seule fois, au chargement du module bootstrap
    (src/main.py), avant la création de l'app FastAPI.
    """
    if not settings.SENTRY_DSN.strip():
        return

    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    release = settings.RENDER_GIT_COMMIT.strip() or None

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        release=release,
        # Explicite : ne pas se fier à la valeur par défaut du SDK installé
        # (None, traité comme désactivé dans sentry-sdk 2.x, mais amené à
        # changer entre versions — on fixe donc le comportement ici).
        send_default_pii=False,
        before_send=_before_send,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
        ],
    )
    logger.info("Sentry monitoring initialisé (release=%s)", release or "inconnue")
