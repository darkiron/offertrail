"""Data access for the ``candidature_events`` domain.

Pure SQLAlchemy query functions extracted from
``src/routers/candidature_events.py`` per ADR-0002. No business rules, no
HTTP concerns: callers (routers/services) decide what a missing result means
(404, 403, ...).
"""
from sqlalchemy.orm import Session

from src.models import Candidature, CandidatureEvent


def list_for_user(db: Session, user_id: str) -> list[CandidatureEvent]:
    return (
        db.query(CandidatureEvent)
        .filter(CandidatureEvent.user_id == user_id)
        .order_by(CandidatureEvent.created_at.desc())
        .all()
    )


def get_candidature_by_id_for_user(db: Session, candidature_id: str, user_id: str) -> Candidature | None:
    return (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )


def get_by_id_for_user(db: Session, event_id: str, user_id: str) -> CandidatureEvent | None:
    return (
        db.query(CandidatureEvent)
        .filter(CandidatureEvent.id == event_id, CandidatureEvent.user_id == user_id)
        .first()
    )


def create(db: Session, data: dict, user_id: str) -> CandidatureEvent:
    event = CandidatureEvent(**data, user_id=user_id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update(db: Session, event: CandidatureEvent, updates: dict) -> CandidatureEvent:
    for field, value in updates.items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


def delete(db: Session, event: CandidatureEvent) -> None:
    db.delete(event)
    db.commit()
