from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import Candidature, Profile

CANDIDATURES_MAX_STARTER = 25


def get_usage(db: Session, profile: Profile) -> dict:
    count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    is_pro = profile.plan == "pro"

    return {
        "plan":               profile.plan,
        "is_pro":             is_pro,
        "candidatures_count": count,
        "candidatures_max":   0 if is_pro else CANDIDATURES_MAX_STARTER,
        "limite_atteinte":    not is_pro and count >= CANDIDATURES_MAX_STARTER,
        "alerte_80":          not is_pro and count >= CANDIDATURES_MAX_STARTER * 0.8,
        "plan_started_at":    profile.plan_started_at.isoformat() if profile.plan_started_at else None,
    }


def check_can_create(db: Session, profile: Profile) -> None:
    if profile.plan == "pro":
        return

    count = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
    if count >= CANDIDATURES_MAX_STARTER:
        raise HTTPException(
            status_code=402,
            detail={
                "code":    "LIMIT_REACHED",
                "message": "Limite de 25 candidatures atteinte. Passez en Pro.",
                "current": count,
                "max":     CANDIDATURES_MAX_STARTER,
            },
        )


def activate_plan(db: Session, profile: Profile, plan: str) -> None:
    if plan not in ("starter", "pro"):
        raise ValueError(f"Plan invalide : {plan!r}")
    if plan == "pro":
        activate_pro(db, profile)
    else:
        _downgrade_to_starter(db, profile)


def activate_pro(db: Session, profile: Profile) -> None:
    profile.plan            = "pro"
    profile.plan_started_at = datetime.utcnow()
    profile.plan_expires_at = None
    db.commit()


def _downgrade_to_starter(db: Session, profile: Profile) -> None:
    profile.plan            = "starter"
    profile.stripe_subscription_id = None
    profile.plan_expires_at = None
    db.commit()
