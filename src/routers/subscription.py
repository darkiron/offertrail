import logging
from typing import Callable, Optional

import stripe
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth import get_current_profile, get_jwt_payload
from src.database import get_db
from src.models import Profile
from src.services.subscription import SubscriptionService, get_usage
from src.services.stripe_service import (
    APP_BASE_URL,
    create_checkout_session,
    is_configured,
    verify_webhook,
)

router = APIRouter(prefix="/subscription", tags=["subscription"])
logger = logging.getLogger(__name__)
verify_webhook_signature = verify_webhook

# Event type -> SubscriptionService method. Mirrors exactly the event types
# previously handled by the router's if/elif chain; any event type not in
# this map is ignored, same as before (falls through to the 200 response).
_WEBHOOK_HANDLERS: dict[str, Callable[[Session, dict], None]] = {
    "checkout.session.completed": SubscriptionService.handle_checkout_session_completed,
    "customer.subscription.created": SubscriptionService.handle_subscription_created,
    "customer.subscription.updated": SubscriptionService.handle_subscription_updated,
    "customer.subscription.deleted": SubscriptionService.handle_subscription_deleted,
    "customer.subscription.trial_will_end": SubscriptionService.handle_trial_will_end,
    "invoice.payment_failed": SubscriptionService.handle_invoice_payment_failed,
}


class CheckoutRequest(BaseModel):
    plan: str
    period: str
    coupon: Optional[str] = None


@router.get("/me")
def get_my_subscription(
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
):
    return get_usage(db, profile)


@router.post("/checkout")
def create_checkout(
    body: CheckoutRequest | None = Body(default=None),
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
    payload: dict = Depends(get_jwt_payload),
):
    body = body or CheckoutRequest(plan="pro", period="monthly")

    if body.plan not in ("pro", "ultimate"):
        raise HTTPException(400, "Plan invalide")
    if body.period not in ("monthly", "yearly"):
        raise HTTPException(400, "Periode invalide")

    # Never create a second subscription for an already active plan. Downgrades
    # are handled from the Stripe billing portal; only an explicit upgrade may
    # start a new checkout session.
    if profile.subscription_status == "active":
        raise HTTPException(409, "Abonnement deja actif. Modifiez votre offre depuis le portail de facturation.")

    if not is_configured():
        raise HTTPException(
            status_code=503,
            detail="Stripe n'est pas configure. Aucun abonnement n'a ete cree.",
        )

    user_email = payload.get("email", "")
    if not user_email:
        raise HTTPException(status_code=400, detail="Email utilisateur introuvable")

    try:
        checkout_url = create_checkout_session(
            profile.id,
            user_email,
            body.plan,
            body.period,
            body.coupon,
            profile.stripe_customer_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except stripe.StripeError:
        logger.exception("Stripe checkout failed for profile %s", profile.id)
        raise HTTPException(status_code=502, detail="Impossible d'initialiser le paiement Stripe.")

    return {"mode": "stripe", "checkout_url": checkout_url}


@router.post("/portal")
def create_billing_portal(
    profile: Profile = Depends(get_current_profile),
):
    if not is_configured():
        raise HTTPException(status_code=400, detail="Stripe non configure en local")

    if not profile.stripe_customer_id:
        raise HTTPException(status_code=400, detail="Aucun abonnement Stripe associe a ce compte")

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=profile.stripe_customer_id,
            return_url=f"{APP_BASE_URL}/app/mon-compte",
        )
    except stripe.StripeError as exc:
        logger.exception(
            "Stripe billing portal session creation failed for profile %s: %s",
            profile.id,
            exc.user_message or str(exc),
        )
        raise HTTPException(
            status_code=502,
            detail=f"Stripe: {exc.user_message or str(exc)}",
        )

    return {"portal_url": portal_session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(payload, sig)
    except Exception:
        raise HTTPException(400, "Signature invalide")

    handler = _WEBHOOK_HANDLERS.get(event["type"])
    if handler is not None:
        handler(db, event)

    return {"status": "ok"}
