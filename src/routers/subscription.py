import logging
from datetime import UTC, datetime
from typing import Optional

import stripe
from fastapi import APIRouter, Body, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth import get_current_profile, get_jwt_payload
from src.database import get_db
from src.models import Profile
from src.services.subscription import _set_cancelled, get_usage
from src.services.stripe_service import (
    APP_BASE_URL,
    create_checkout_session,
    is_configured,
    verify_webhook,
)

router = APIRouter(prefix="/subscription", tags=["subscription"])
logger = logging.getLogger(__name__)
verify_webhook_signature = verify_webhook


def _stripe_datetime(timestamp: int | None) -> datetime | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, UTC).replace(tzinfo=None)


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

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata", {})
        user_id = meta.get("user_id")
        plan = meta.get("plan", "pro")
        period = meta.get("period", "monthly")
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if profile:
                profile.plan = plan
                profile.billing_period = period
                profile.subscription_status = "active"
                profile.plan_started_at = datetime.now(UTC).replace(tzinfo=None)
                profile.stripe_customer_id = session.get("customer")
                profile.stripe_subscription_id = session.get("subscription")
                db.commit()

    elif event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        subscription = event["data"]["object"]
        meta = subscription.get("metadata", {})
        customer_id = subscription.get("customer")
        user_id = meta.get("user_id")
        profile = None
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
        if profile is None and customer_id:
            profile = db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()
        if profile:
            profile.plan = meta.get("plan", profile.plan or "pro")
            profile.billing_period = meta.get("period", profile.billing_period or "monthly")
            profile.subscription_status = subscription.get("status", "active")
            profile.plan_started_at = _stripe_datetime(subscription.get("start_date"))
            profile.stripe_customer_id = customer_id
            profile.stripe_subscription_id = subscription.get("id")
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        if customer_id:
            profile = db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()
            if profile:
                _set_cancelled(db, profile)

    elif event["type"] == "customer.subscription.trial_will_end":
        pass

    return {"status": "ok"}
