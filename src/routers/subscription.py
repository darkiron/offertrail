import logging
from datetime import datetime
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

    if not is_configured():
        profile.plan = body.plan
        profile.billing_period = body.period
        profile.subscription_status = "active"
        profile.plan_started_at = datetime.utcnow()
        db.commit()
        return {"mode": "simulated", "checkout_url": None}

    user_email = payload.get("email", "")
    if not user_email:
        raise HTTPException(status_code=400, detail="Email utilisateur introuvable")

    try:
        try:
            checkout_url = create_checkout_session(
                profile.id,
                user_email,
                body.plan,
                body.period,
                body.coupon,
            )
        except TypeError:
            checkout_url = create_checkout_session(
                profile.id,
                user_email,
                stripe_customer_id=profile.stripe_customer_id,
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
    except stripe.error.StripeError as exc:
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
                profile.plan_started_at = datetime.utcnow()
                profile.stripe_customer_id = session.get("customer")
                profile.stripe_subscription_id = session.get("subscription")
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
