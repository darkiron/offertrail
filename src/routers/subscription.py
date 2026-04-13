import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.auth import get_current_profile, get_db, get_jwt_payload
from src.models import Profile
from src.services.subscription import get_usage, activate_pro, _downgrade_to_starter
from src.services.stripe_service import (
    create_checkout_session, verify_webhook_signature, is_configured
)

router = APIRouter(prefix="/subscription", tags=["subscription"])

ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing"}


def _activate_profile_subscription(
    db: Session,
    profile: Profile,
    customer_id: str | None = None,
    subscription_id: str | None = None,
) -> None:
    if customer_id:
        profile.stripe_customer_id = customer_id
    if subscription_id:
        profile.stripe_subscription_id = subscription_id
    activate_pro(db, profile)


def _find_profile_for_subscription_event(db: Session, subscription_data: dict) -> Profile | None:
    metadata = subscription_data.get("metadata") or {}
    user_id = metadata.get("user_id")
    if user_id:
        return db.query(Profile).filter(Profile.id == user_id).first()

    customer_id = subscription_data.get("customer")
    if customer_id:
        return db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()

    return None


@router.get("/me")
def get_my_subscription(
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
):
    return get_usage(db, profile)


@router.post("/checkout")
def create_checkout(
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
    payload: dict = Depends(get_jwt_payload),
):
    """
    En local sans Stripe → simule l'upgrade directement.
    En prod avec Stripe configuré → retourne l'URL de checkout.
    """
    if not is_configured():
        activate_pro(db, profile)
        return {
            "mode": "simulated",
            "checkout_url": None,
            "message": "Upgrade simulé — Stripe non configuré"
        }

    user_email = payload.get("email", "")
    if not user_email:
        raise HTTPException(status_code=400, detail="Email utilisateur introuvable")

    checkout_url = create_checkout_session(
        profile.id,
        user_email,
        stripe_customer_id=profile.stripe_customer_id,
    )
    return {
        "mode": "stripe",
        "checkout_url": checkout_url,
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Reçoit les événements Stripe.
    NE PAS authentifier cet endpoint — Stripe n'envoie pas de token.
    Vérifier la signature avec le webhook secret.
    """
    body       = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(body, sig_header)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature webhook invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id") or session.get("client_reference_id")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if profile:
                _activate_profile_subscription(
                    db,
                    profile,
                    customer_id=customer_id,
                    subscription_id=subscription_id,
                )

    elif event["type"] in {"customer.subscription.created", "customer.subscription.updated"}:
        subscription = event["data"]["object"]
        profile = _find_profile_for_subscription_event(db, subscription)
        if profile:
            status = subscription.get("status")
            if status in ACTIVE_SUBSCRIPTION_STATUSES:
                _activate_profile_subscription(
                    db,
                    profile,
                    customer_id=subscription.get("customer"),
                    subscription_id=subscription.get("id"),
                )
            else:
                _downgrade_to_starter(db, profile)

    elif event["type"] in {"customer.subscription.deleted", "invoice.payment_failed"}:
        subscription = event["data"]["object"]
        profile = _find_profile_for_subscription_event(db, subscription)
        if profile:
            _downgrade_to_starter(db, profile)

    return {"status": "ok"}
