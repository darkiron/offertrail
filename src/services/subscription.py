from datetime import datetime

from sqlalchemy.orm import Session

from src.models import Profile

PLANS = {
    "pro": {
        "nom": "Pro",
        "prix_mensuel": 14.99,
    },
}


def get_usage(db: Session, profile: Profile) -> dict:
    is_active = profile.subscription_status == "active"
    return {
        "subscription_status": profile.subscription_status,
        "is_active":           is_active,
        "plan_started_at":     profile.plan_started_at.isoformat() if profile.plan_started_at else None,
        "has_stripe_customer": bool(profile.stripe_customer_id),
    }


def activate_pro(db: Session, profile: Profile) -> None:
    profile.subscription_status = "active"
    profile.plan_started_at     = datetime.utcnow()
    profile.plan_expires_at     = None
    db.commit()


def _set_cancelled(db: Session, profile: Profile) -> None:
    profile.subscription_status    = "cancelled"
    profile.stripe_subscription_id = None
    profile.plan_expires_at        = None
    db.commit()
