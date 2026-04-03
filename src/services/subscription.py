from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.models import Candidature, User

CANDIDATURES_MAX_STARTER = 25


def get_usage(db: Session, user: User) -> dict:
    nb_cand = db.query(Candidature).filter(Candidature.user_id == user.id).count()
    is_pro = user.plan == "pro"

    return {
        "plan": user.plan,
        "is_pro": is_pro,
        "candidatures_count": nb_cand,
        "candidatures_max": 0 if is_pro else CANDIDATURES_MAX_STARTER,
        "limite_atteinte": not is_pro and nb_cand >= CANDIDATURES_MAX_STARTER,
        "alerte_80": not is_pro and nb_cand >= CANDIDATURES_MAX_STARTER * 0.8,
        "plan_started_at": user.plan_started_at.isoformat() if user.plan_started_at else None,
    }


def check_can_create(db: Session, user: User) -> None:
    if user.plan == "pro":
        return

    nb_cand = db.query(Candidature).filter(Candidature.user_id == user.id).count()
    if nb_cand >= CANDIDATURES_MAX_STARTER:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "LIMIT_REACHED",
                "message": "Limite de 25 candidatures atteinte. Passez en Pro.",
                "current": nb_cand,
                "max": CANDIDATURES_MAX_STARTER,
            },
        )


def activate_pro(db: Session, user: User) -> None:
    user.plan = "pro"
    user.plan_started_at = datetime.utcnow()
    user.plan_expires_at = None
    db.commit()
