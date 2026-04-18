from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import Candidature, Profile

PLANS = {
    "free": {
        "nom": "Gratuit",
        "prix_mensuel": 0,
        "candidatures_max": 25,
    },
    "pro": {
        "nom": "Pro",
        "prix_mensuel": 14.99,
        "candidatures_max": 0,
    },
}

CANDIDATURES_MAX_FREE = 25


def get_usage(db: Session, profile: Profile) -> dict:
    count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    is_pro = profile.plan == "pro"

    return {
        "plan":               profile.plan,
        "is_pro":             is_pro,
        "candidatures_count": count,
        "candidatures_max":   0 if is_pro else CANDIDATURES_MAX_FREE,
        "limite_atteinte":    not is_pro and count >= CANDIDATURES_MAX_FREE,
        "alerte_80":          not is_pro and count >= CANDIDATURES_MAX_FREE * 0.8,
        "plan_started_at":    profile.plan_started_at.isoformat() if profile.plan_started_at else None,
    }


def check_can_create(db: Session, profile: Profile) -> None:
    if profile.plan == "pro":
        return

    count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    if count >= CANDIDATURES_MAX_FREE:
        raise HTTPException(
            status_code=402,
            detail={
                "code":    "LIMIT_REACHED",
                "message": "Limite de 25 candidatures atteinte. Passez en Pro.",
                "current": count,
                "max":     CANDIDATURES_MAX_FREE,
            },
        )


def activate_plan(db: Session, profile: Profile, plan: str) -> None:
    if plan not in ("free", "pro"):
        raise ValueError(f"Plan invalide : {plan!r}")
    if plan == "pro":
        activate_pro(db, profile)
    else:
        _downgrade_to_free(db, profile)


def activate_pro(db: Session, profile: Profile) -> None:
    profile.plan            = "pro"
    profile.plan_started_at = datetime.utcnow()
    profile.plan_expires_at = None
    db.commit()


def _downgrade_to_free(db: Session, profile: Profile) -> None:
    profile.plan            = "free"
    profile.stripe_subscription_id = None
    profile.plan_expires_at = None
    db.commit()
