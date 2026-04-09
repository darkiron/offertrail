import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from src.auth import get_current_user, get_db
from src.models import User
from src.services.subscription import get_usage, activate_pro, _downgrade_to_starter
from src.services.stripe_service import (
    create_checkout_session, verify_webhook_signature, is_configured
)

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.get("/me")
def get_my_subscription(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_usage(db, user)


@router.post("/checkout")
def create_checkout(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    En local sans Stripe → simule l'upgrade directement.
    En prod avec Stripe configuré → retourne l'URL de checkout.
    """
    if not is_configured():
        activate_pro(db, user)
        return {
            "mode": "simulated",
            "checkout_url": None,
            "message": "Upgrade simulé — Stripe non configuré"
        }

    checkout_url = create_checkout_session(user.id, user.email)
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
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(payload, sig_header)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Signature webhook invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                activate_pro(db, user)

    elif event["type"] == "customer.subscription.deleted":
        # Abonnement annulé ou paiement échoué → downgrade
        subscription = event["data"]["object"]
        customer_email = subscription.get("customer_email")
        if customer_email:
            user = db.query(User).filter(User.email == customer_email).first()
            if user:
                _downgrade_to_starter(db, user)

    return {"status": "ok"}
