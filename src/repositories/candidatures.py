"""Data access for the ``candidatures`` domain.

Pure SQLAlchemy query functions extracted from ``src/routers/candidatures.py``
per ADR-0002. No business rules, no HTTP concerns: callers (routers/services)
decide what a missing result means (404, 403, ...).
"""
from sqlalchemy.orm import Session

from src.models import Candidature, CandidatureEvent, Etablissement


def list_for_user(db: Session, user_id: str) -> list[Candidature]:
    return (
        db.query(Candidature)
        .filter(Candidature.user_id == user_id)
        .order_by(Candidature.updated_at.desc())
        .all()
    )


def get_by_id_for_user(db: Session, candidature_id: str, user_id: str) -> Candidature | None:
    return (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )


def get_etablissement_by_id(db: Session, etablissement_id: str) -> Etablissement | None:
    return db.query(Etablissement).filter(Etablissement.id == etablissement_id).first()


def create(db: Session, data: dict, user_id: str) -> Candidature:
    cand = Candidature(**data, user_id=user_id)
    db.add(cand)
    db.flush()
    db.add(
        CandidatureEvent(
            candidature_id=cand.id,
            user_id=user_id,
            type="creation",
            nouveau_statut=cand.statut,
            contenu="Candidature creee",
        )
    )
    db.commit()
    return get_by_id_for_user(db, cand.id, user_id)


def update(db: Session, candidature_id: str, user_id: str, updates: dict, old_status: str | None) -> Candidature | None:
    if updates:
        db.query(Candidature).filter(
            Candidature.id == candidature_id,
            Candidature.user_id == user_id,
        ).update(updates)
        new_status = updates.get("statut")
        if new_status and new_status != old_status:
            db.add(
                CandidatureEvent(
                    candidature_id=candidature_id,
                    user_id=user_id,
                    type="statut_change",
                    ancien_statut=old_status,
                    nouveau_statut=new_status,
                )
            )
    db.commit()
    return get_by_id_for_user(db, candidature_id, user_id)


def list_events_for_candidature(db: Session, candidature_id: str, user_id: str) -> list[CandidatureEvent]:
    return (
        db.query(CandidatureEvent)
        .filter(
            CandidatureEvent.candidature_id == candidature_id,
            CandidatureEvent.user_id == user_id,
        )
        .order_by(CandidatureEvent.created_at.desc())
        .all()
    )


def delete(db: Session, candidature: Candidature) -> None:
    db.delete(candidature)
    db.commit()
