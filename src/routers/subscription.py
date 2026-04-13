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
    checkout_url = create_checkout_session(profile.id, user_email)
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
        session     = event["data"]["object"]
        user_id     = session.get("metadata", {}).get("user_id")
        customer_id = session.get("customer")
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if profile:
                if customer_id:
                    profile.stripe_customer_id = customer_id
                activate_pro(db, profile)

    elif event["type"] == "customer.subscription.deleted":
        # Abonnement annulé ou paiement échoué → downgrade
        subscription = event["data"]["object"]
        customer_id  = subscription.get("customer")
        if customer_id:
            profile = db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()
            if profile:
                _downgrade_to_starter(db, profile)

    return {"status": "ok"}
