import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import Profile

logger = logging.getLogger(__name__)

PLANS = {
    "free": {
        "nom": "Free",
        "prix_mensuel": 0,
        "candidatures_max": 5,
        "relances_max": 1,
        "historique_mois": 1,
        "kpis_avances": False,
        "probite_complet": False,
        "export_csv": False,
        "import_csv": False,
        "timeline": False,
        "support_prioritaire": False,
    },
    "pro": {
        "nom": "Pro",
        "prix_mensuel": 9.99,
        "candidatures_max": 100,
        "relances_max": 10,
        "historique_mois": 6,
        "kpis_avances": True,
        "probite_complet": False,
        "export_csv": True,
        "import_csv": True,
        "timeline": False,
        "support_prioritaire": False,
    },
    "ultimate": {
        "nom": "Ultimate",
        "prix_mensuel": 14.99,
        "candidatures_max": 0,
        "relances_max": 0,
        "historique_mois": 0,
        "kpis_avances": True,
        "probite_complet": True,
        "export_csv": True,
        "import_csv": True,
        "timeline": True,
        "support_prioritaire": True,
    },
}


def get_plan_config(plan: str) -> dict:
    return PLANS.get(plan, PLANS["free"])


def get_effective_plan(profile: Profile) -> str:
    if profile.plan in ("pro", "ultimate"):
        return profile.plan
    if profile.subscription_status == "active":
        return "pro"
    return "free"


def require_plan_feature(profile: Profile, feature: str) -> dict:
    """Require a capability declared by the effective subscription plan.

    Feature checks live in one place so a route cannot accidentally expose a
    capability that is advertised as plan-specific.  A 402 response gives the
    frontend enough context to present the upgrade path without leaking data.
    """
    plan = get_effective_plan(profile)
    config = get_plan_config(plan)
    if not config.get(feature, False):
        raise HTTPException(status_code=402, detail={
            "code": "FEATURE_NOT_INCLUDED",
            "feature": feature,
            "plan": plan,
            "upgrade_to": "pro" if plan == "free" else "ultimate",
        })
    return config


def has_plan_feature(profile: Profile, feature: str) -> bool:
    return bool(get_plan_config(get_effective_plan(profile)).get(feature, False))


def history_cutoff(profile: Profile) -> datetime | None:
    """Return the oldest accessible event date for the current plan.

    ``0`` means unlimited history for Ultimate; other values are expressed in
    months in the public plan catalogue.
    """
    months = get_plan_config(get_effective_plan(profile)).get("historique_mois", 0)
    if not months:
        return None
    return datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30 * months)


def check_can_create_candidature(db, profile):
    plan = get_effective_plan(profile)
    config = get_plan_config(plan)
    if config["candidatures_max"] == 0:
        return
    from src.models import Candidature
    count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    if count >= config["candidatures_max"]:
        raise HTTPException(status_code=402, detail={
            "code": "LIMIT_REACHED",
            "message": f"Limite de {config['candidatures_max']} candidatures atteinte.",
            "current": count,
            "max": config["candidatures_max"],
            "upgrade_to": "pro" if plan == "free" else "ultimate",
        })


def check_can_create_relance(db, profile):
    plan = get_effective_plan(profile)
    config = get_plan_config(plan)
    if config["relances_max"] == 0:
        return
    from src.models import Relance
    active = db.query(Relance).filter(
        Relance.user_id == profile.id,
        Relance.statut.in_(("active", "a_faire")),
    ).count()
    if active >= config["relances_max"]:
        raise HTTPException(status_code=402, detail={
            "code": "RELANCE_LIMIT",
            "message": f"Limite de {config['relances_max']} relance(s) active(s) atteinte.",
            "upgrade_to": "pro" if plan == "free" else "ultimate",
        })


def get_usage(db: Session, profile: Profile) -> dict:
    plan = get_effective_plan(profile)
    config = get_plan_config(plan)
    from src.models import Candidature, Relance

    candidatures_count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    relances_active_count = db.query(Relance).filter(
        Relance.user_id == profile.id,
        Relance.statut.in_(("active", "a_faire")),
    ).count()

    return {
        "subscription_status": profile.subscription_status,
        "is_active": plan in ("pro", "ultimate") and profile.subscription_status == "active",
        "plan": plan,
        "billing_period": profile.billing_period,
        "plan_started_at": profile.plan_started_at.isoformat() if profile.plan_started_at else None,
        "limits": config,
        "usage": {
            "candidatures": candidatures_count,
            "relances_active": relances_active_count,
        },
    }


def activate_plan(db: Session, profile: Profile, plan: str, billing_period: str | None = None) -> None:
    profile.plan = plan
    profile.billing_period = billing_period
    profile.subscription_status = "active" if plan in ("pro", "ultimate") else "pending"
    profile.plan_started_at = (
        datetime.now(timezone.utc).replace(tzinfo=None) if plan in ("pro", "ultimate") else None
    )
    profile.plan_expires_at = None
    db.commit()


def activate_pro(db: Session, profile: Profile) -> None:
    activate_plan(db, profile, "pro", profile.billing_period or "monthly")


def _set_cancelled(db: Session, profile: Profile) -> None:
    profile.plan = "free"
    profile.billing_period = None
    profile.subscription_status = "cancelled"
    profile.stripe_subscription_id = None
    profile.plan_expires_at = None
    db.commit()


def _stripe_datetime(timestamp: int | None) -> datetime | None:
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, timezone.utc).replace(tzinfo=None)


class SubscriptionService:
    """Translates verified Stripe webhook events into ``Profile`` billing writes.

    One method per event type handled by ``POST /subscription/webhook``. This
    is a pure structural extraction of the router's former if/elif chain: the
    router now only verifies the webhook signature and dispatches by event
    type, while the event-to-Profile-field mapping lives here, next to the
    rest of this module's plan/billing authority (``activate_plan``,
    ``_set_cancelled``, ``get_usage``, ...). No Profile field, value, or
    written-field-set differs from the pre-extraction behavior.
    """

    @staticmethod
    def handle_checkout_session_completed(db: Session, event: dict) -> None:
        session = event["data"]["object"]
        meta = session.get("metadata", {})
        user_id = meta.get("user_id")
        plan = meta.get("plan", "pro")
        period = meta.get("period", "monthly")
        if not user_id:
            return
        profile = db.query(Profile).filter(Profile.id == user_id).first()
        if not profile:
            return
        profile.plan = plan
        profile.billing_period = period
        profile.subscription_status = "active"
        profile.plan_started_at = datetime.now(timezone.utc).replace(tzinfo=None)
        profile.stripe_customer_id = session.get("customer")
        profile.stripe_subscription_id = session.get("subscription")
        db.commit()

    @staticmethod
    def _sync_subscription_from_stripe(db: Session, event: dict) -> None:
        """Shared logic behind ``customer.subscription.created`` and
        ``.updated``: both events carry the same subscription object shape
        and were handled identically in the original if/elif chain."""
        subscription = event["data"]["object"]
        meta = subscription.get("metadata", {})
        customer_id = subscription.get("customer")
        user_id = meta.get("user_id")
        profile = None
        if user_id:
            profile = db.query(Profile).filter(Profile.id == user_id).first()
        if profile is None and customer_id:
            profile = db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()
        if not profile:
            return
        profile.plan = meta.get("plan", profile.plan or "pro")
        profile.billing_period = meta.get("period", profile.billing_period or "monthly")
        profile.subscription_status = subscription.get("status", "active")
        profile.plan_started_at = _stripe_datetime(subscription.get("start_date"))
        profile.stripe_customer_id = customer_id
        profile.stripe_subscription_id = subscription.get("id")
        db.commit()

    @classmethod
    def handle_subscription_created(cls, db: Session, event: dict) -> None:
        cls._sync_subscription_from_stripe(db, event)

    @classmethod
    def handle_subscription_updated(cls, db: Session, event: dict) -> None:
        cls._sync_subscription_from_stripe(db, event)

    @staticmethod
    def handle_subscription_deleted(db: Session, event: dict) -> None:
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        if not customer_id:
            return
        profile = db.query(Profile).filter(Profile.stripe_customer_id == customer_id).first()
        if profile:
            _set_cancelled(db, profile)

    @staticmethod
    def handle_trial_will_end(db: Session, event: dict) -> None:
        # Deliberate no-op, unchanged from the router's previous behavior:
        # no product feature currently reacts to the trial-ending notice.
        return None

    @staticmethod
    def handle_invoice_payment_failed(db: Session, event: dict) -> None:
        """Deliberate no-op for ``invoice.payment_failed``.

        This event is subscribed to in the production Stripe webhook config
        (see docs/render-deployment.md) but was previously silently ignored
        by the router (no matching if/elif branch → fell through to the
        default 200 response). That silent gap is resolved here by making
        the no-op explicit and logged, without inventing new behavior:

        ``Profile.subscription_status`` only ever takes three values across
        this codebase (pending | active | cancelled — see src/models.py and
        the aggregate counts in src/routers/admin.py). There is no existing
        "payment failed" / past_due status to write, and adding one would be
        new product behavior (it would need admin dashboard, export and
        frontend support) that is out of scope for this pure extraction.
        Stripe already reflects a failed-invoice's effect on the
        subscription lifecycle through ``customer.subscription.updated``
        (status transitions to ``past_due``/``unpaid``/etc.), which is
        already handled by ``_sync_subscription_from_stripe`` above and
        written verbatim into ``subscription_status``. So this event is
        redundant for our current state model, not unhandled by omission.
        """
        subscription_id = event.get("data", {}).get("object", {}).get("subscription")
        logger.warning(
            "Stripe invoice.payment_failed received (subscription=%s); no-op by design, "
            "see SubscriptionService.handle_invoice_payment_failed docstring.",
            subscription_id,
        )
        return None
