"""Data access for the ``relances`` domain.

Pure SQLAlchemy query functions extracted from ``src/routers/relances.py``
per ADR-0002. No business rules, no HTTP concerns: callers (routers/services)
decide what a missing result means (404, 403, ...).
"""
from sqlalchemy.orm import Session

from src.models import Candidature, Relance


def list_for_user(db: Session, user_id: str) -> list[Relance]:
    return (
        db.query(Relance)
        .filter(Relance.user_id == user_id)
        .order_by(Relance.date_prevue.asc())
        .all()
    )


def get_candidature_by_id_for_user(db: Session, candidature_id: str, user_id: str) -> Candidature | None:
    return (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )


def get_by_id_for_user(db: Session, relance_id: str, user_id: str) -> Relance | None:
    return db.query(Relance).filter(Relance.id == relance_id, Relance.user_id == user_id).first()


def create(db: Session, data: dict, user_id: str) -> Relance:
    relance = Relance(**data, user_id=user_id)
    db.add(relance)
    db.commit()
    db.refresh(relance)
    return relance


def update(db: Session, relance: Relance, updates: dict) -> Relance:
    for field, value in updates.items():
        setattr(relance, field, value)
    db.commit()
    db.refresh(relance)
    return relance


def delete(db: Session, relance: Relance) -> None:
    db.delete(relance)
    db.commit()
