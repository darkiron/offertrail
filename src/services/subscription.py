from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import Profile

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

PAID_SUBSCRIPTION_STATUSES = frozenset({"active", "trialing"})


def is_paid_subscription_status(subscription_status: str | None) -> bool:
    """Return whether Stripe currently grants paid access for this status."""
    return subscription_status in PAID_SUBSCRIPTION_STATUSES


def get_plan_config(plan: str) -> dict:
    return PLANS.get(plan, PLANS["free"])


def get_effective_plan(profile: Profile) -> str:
    if (
        profile.plan in ("pro", "ultimate")
        and is_paid_subscription_status(profile.subscription_status)
    ):
        return profile.plan
    if is_paid_subscription_status(profile.subscription_status):
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
