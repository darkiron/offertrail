"""Data access for the ``admin`` backoffice domain.

Pure SQLAlchemy query functions extracted from ``src/routers/admin.py`` per
ADR-0002. No business rules, no HTTP concerns: callers (routers/services)
decide what a missing result means (404, 403, ...) and own any pure-Python
aggregation (MRR computation, CSV shaping, ...) that doesn't touch the
database.
"""
from datetime import datetime

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from src.models import Candidature, Etablissement, Profile, Relance


def list_all_profiles(db: Session) -> list[Profile]:
    return db.query(Profile).all()


def list_profiles_ordered_by_created_at(db: Session) -> list[Profile]:
    return db.query(Profile).order_by(Profile.created_at.desc()).all()


def count_profiles_created_since(db: Session, since: datetime) -> int:
    return db.query(Profile).filter(Profile.created_at >= since).count()


def count_candidatures(db: Session) -> int:
    return db.query(func.count(Candidature.id)).scalar()


def count_relances(db: Session) -> int:
    return db.query(func.count(Relance.id)).scalar()


def count_etablissements(db: Session) -> int:
    return db.query(func.count(Etablissement.id)).scalar()


def count_active_users_since(db: Session, since: datetime) -> int:
    return (
        db.query(func.count(func.distinct(Candidature.user_id)))
        .filter(Candidature.created_at >= since)
        .scalar()
    )


def count_candidatures_for_user(db: Session, user_id: str) -> int:
    return db.query(func.count(Candidature.id)).filter(Candidature.user_id == user_id).scalar()


def get_profile_by_id(db: Session, user_id: str) -> Profile | None:
    return db.query(Profile).filter(Profile.id == user_id).first()


def set_pending(db: Session, profile: Profile) -> Profile:
    profile.subscription_status = "pending"
    db.commit()
    return profile


def toggle_active(db: Session, profile: Profile) -> bool:
    profile.is_active = not profile.is_active
    db.commit()
    return profile.is_active


def deactivate(db: Session, profile: Profile) -> None:
    profile.is_active = False
    db.commit()


def list_recent_signups(db: Session, limit: int = 5) -> list[Profile]:
    return db.query(Profile).order_by(Profile.created_at.desc()).limit(limit).all()


def list_recent_activations(db: Session, limit: int = 5) -> list[Profile]:
    return (
        db.query(Profile)
        .filter(Profile.subscription_status == "active", Profile.plan_started_at.isnot(None))
        .order_by(Profile.plan_started_at.desc())
        .limit(limit)
        .all()
    )


def list_active_plan_profiles_before(db: Session, before: datetime) -> list[Profile]:
    return (
        db.query(Profile)
        .filter(
            Profile.plan.in_(("pro", "ultimate")),
            Profile.plan_started_at < before,
        )
        .all()
    )


def count_profiles_created_between(db: Session, start: datetime, end: datetime) -> int:
    return (
        db.query(Profile)
        .filter(and_(Profile.created_at >= start, Profile.created_at < end))
        .count()
    )


def count_plan_upgrades_between(db: Session, start: datetime, end: datetime) -> int:
    return (
        db.query(Profile)
        .filter(
            Profile.plan.in_(("pro", "ultimate")),
            Profile.plan_started_at >= start,
            Profile.plan_started_at < end,
        )
        .count()
    )


def count_profiles_by_plan(db: Session, plan: str) -> int:
    return db.query(Profile).filter(Profile.plan == plan).count()


def count_all_profiles(db: Session) -> int:
    return db.query(Profile).count()


def count_profiles_by_subscription_status(db: Session, status: str) -> int:
    return db.query(Profile).filter(Profile.subscription_status == status).count()


def count_candidatures_created_between(db: Session, start: datetime, end: datetime) -> int:
    return (
        db.query(Candidature)
        .filter(and_(Candidature.created_at >= start, Candidature.created_at < end))
        .count()
    )
