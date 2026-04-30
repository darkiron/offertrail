import logging

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from src.auth import get_current_profile, get_db, get_jwt_payload
from src.models import Profile
from src.services.subscription import get_usage, activate_pro, _set_cancelled
from src.services.stripe_service import (
    create_checkout_session, verify_webhook_signature, is_configured,
    APP_BASE_URL,
)

router = APIRouter(prefix="/subscription", tags=["subscription"])
logger = logging.getLogger(__name__)

ACTIVE_SUBSCRIPTION_STATUSES = {"active", "trialing"}


def _s(obj, attr: str, default=None):
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(attr, default)
    val = getattr(obj, attr, default)
    return val if val is not None else default


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


def _find_profile_for_subscription_event(db: Session, subscription_data) -> Profile | None:
    metadata = _s(subscription_data, "metadata")
    user_id = _s(metadata, "user_id")
    if user_id:
        return db.query(Profile).filter(Profile.id == user_id).first()

    customer_id = _s(subscription_data, "customer")
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

    try:
        checkout_url = create_checkout_session(
            profile.id,
            user_email,
            stripe_customer_id=profile.stripe_customer_id,
        )
    except stripe.StripeError:
        logger.exception("Stripe checkout failed for profile %s", profile.id)
        raise HTTPException(status_code=502, detail="Impossible d'initialiser le paiement Stripe.")
    return {"mode": "stripe", "checkout_url": checkout_url}


@router.post("/portal")
def create_billing_portal(
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
):
    if not is_configured():
        raise HTTPException(status_code=400, detail="Stripe non configuré en local")

    if not profile.stripe_customer_id:
        raise HTTPException(status_code=400, detail="Aucun abonnement Stripe associé à ce compte")

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=profile.stripe_customer_id,
            return_url=f"{APP_BASE_URL}/app/mon-compte",
        )
    except stripe.error.StripeError:
        logger.exception(
            "Stripe billing portal session creation failed for profile %s",
            profile.id,
        )
        raise HTTPException(
            status_code=502,
            detail="Impossible d'ouvrir le portail Stripe pour le moment",
        )

    return {"portal_url": portal_session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    body = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = verify_webhook_signature(body, sig_header)
    except stripe.StripeError:
        raise HTTPException(status_code=400, detail="Signature webhook invalide")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = _s(session, "metadata")
        user_id = _s(metadata, "user_id") or _s(session, "client_reference_id")
        customer_id = _s(session, "customer")
        subscription_id = _s(session, "subscription")
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if profile:
                _activate_profile_subscription(
                    db, profile,
                    customer_id=customer_id,
                    subscription_id=subscription_id,
                )

    elif event["type"] in {"customer.subscription.created", "customer.subscription.updated"}:
        subscription = event["data"]["object"]
        profile = _find_profile_for_subscription_event(db, subscription)
        if profile:
            status = _s(subscription, "status")
            if status in ACTIVE_SUBSCRIPTION_STATUSES:
                _activate_profile_subscription(
                    db, profile,
                    customer_id=_s(subscription, "customer"),
                    subscription_id=_s(subscription, "id"),
                )
            else:
                _set_cancelled(db, profile)

    elif event["type"] in {"customer.subscription.deleted", "invoice.payment_failed"}:
        obj = event["data"]["object"]
        profile = _find_profile_for_subscription_event(db, obj)
        if profile:
            _set_cancelled(db, profile)

    return {"status": "ok"}
