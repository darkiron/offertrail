import logging
import os
import stripe

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

STRIPE_PRICE_ID       = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL          = os.getenv("APP_BASE_URL", "http://localhost:5173")
ENABLE_STRIPE_CHECKOUT = os.getenv("ENABLE_STRIPE_CHECKOUT")


def create_checkout_session(
    user_id: str,
    user_email: str,
    stripe_customer_id: str | None = None,
) -> str:
    """
    Crée une session Stripe Checkout et retourne l'URL de paiement.
    Mode abonnement mensuel via le Price configuré dans Stripe.
    """
    checkout_payload = {
        "payment_method_types": ["card"],
        "line_items": [{"price": STRIPE_PRICE_ID, "quantity": 1}],
        "mode": "subscription",
        "success_url": f"{APP_BASE_URL}/app/mon-compte?payment=success",
        "cancel_url": f"{APP_BASE_URL}/app/mon-compte?payment=cancelled",
        "client_reference_id": user_id,
        "metadata": {"user_id": user_id},
        "subscription_data": {"metadata": {"user_id": user_id}},
    }

    if stripe_customer_id:
        checkout_payload["customer"] = stripe_customer_id
    else:
        checkout_payload["customer_email"] = user_email

    session = stripe.checkout.Session.create(
        **checkout_payload,
    )
    return session.url


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """
    Vérifie la signature Stripe du webhook.
    Lève stripe.error.SignatureVerificationError si invalide.
    """
    return stripe.Webhook.construct_event(
        payload, sig_header, STRIPE_WEBHOOK_SECRET
    )


def is_configured() -> bool:
    """
    Active Stripe seulement si la config est exploitable.
    En local, on évite de partir chez Stripe par défaut.
    """
    secret_key = os.getenv("STRIPE_SECRET_KEY", "").strip()
    price_id = os.getenv("STRIPE_PRICE_ID", "").strip()
    app_base_url = os.getenv("APP_BASE_URL", APP_BASE_URL).strip().lower()
    enable_flag = (ENABLE_STRIPE_CHECKOUT or "").strip().lower()

    if enable_flag in {"1", "true", "yes", "on"}:
        if secret_key and price_id and not price_id.startswith("price_"):
            logger.warning(
                "ENABLE_STRIPE_CHECKOUT=1 mais STRIPE_PRICE_ID='%s' est invalide. "
                "Il faut un Price ID (commence par 'price_'), pas un Product ID (commence par 'prod_'). "
                "Stripe Dashboard → Products → ton produit → copier l'ID du prix.",
                price_id,
            )
        return bool(secret_key and price_id.startswith("price_"))

    if enable_flag in {"0", "false", "no", "off"}:
        return False

    if app_base_url.startswith("http://localhost") or app_base_url.startswith("http://127.0.0.1"):
        return False

    return bool(secret_key and price_id.startswith("price_"))
