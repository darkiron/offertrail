import os
import stripe

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

STRIPE_PRICE_ID       = os.getenv("STRIPE_PRICE_ID", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL          = os.getenv("APP_BASE_URL", "http://localhost:5173")


def create_checkout_session(user_id: str, user_email: str) -> str:
    """
    Crée une session Stripe Checkout et retourne l'URL de paiement.
    Mode abonnement mensuel à 9,99€.
    """
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        mode="subscription",
        customer_email=user_email,
        success_url=f"{APP_BASE_URL}/app/mon-compte?payment=success",
        cancel_url=f"{APP_BASE_URL}/app/mon-compte?payment=cancelled",
        metadata={"user_id": user_id},
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
    """Vérifie si Stripe est configuré (clé API présente)."""
    return bool(os.getenv("STRIPE_SECRET_KEY"))
