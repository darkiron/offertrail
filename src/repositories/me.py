"""Data access for the ``/me`` domain (profile dashboard, pipeline, stats).

Pure SQLAlchemy query functions extracted from ``src/routers/me.py`` per
ADR-0002. No business rules, no HTTP concerns: callers (routers/services)
decide what a missing result means (404, 403, ...) and own any pure-Python
aggregation/sorting/shaping that doesn't touch the database.
"""
from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from src.models import Candidature, CandidatureEvent, Etablissement, Relance


def list_open_relances(db: Session, user_id: str) -> list[Relance]:
    return (
        db.query(Relance)
        .filter(Relance.user_id == user_id, Relance.statut == "a_faire")
        .order_by(Relance.date_prevue.asc(), Relance.created_at.asc())
        .all()
    )


def count_candidatures_by_status(db: Session, user_id: str, statuses: list[str]) -> int:
    return (
        db.query(Candidature)
        .filter(Candidature.user_id == user_id, Candidature.statut.in_(statuses))
        .count()
    )


def count_responses_since(db: Session, user_id: str, since: datetime) -> int:
    return (
        db.query(Candidature)
        .filter(
            Candidature.user_id == user_id,
            Candidature.date_reponse.isnot(None),
            Candidature.date_reponse >= since,
        )
        .count()
    )


def count_interview_events_since(db: Session, user_id: str, entretien_statut: str, since: datetime) -> int:
    return (
        db.query(func.count(func.distinct(CandidatureEvent.candidature_id)))
        .filter(
            CandidatureEvent.user_id == user_id,
            or_(
                CandidatureEvent.type == "entretien_planifie",
                CandidatureEvent.nouveau_statut == entretien_statut,
            ),
            CandidatureEvent.created_at >= since,
        )
        .scalar()
        or 0
    )


def count_candidatures(db: Session, user_id: str) -> int:
    return db.query(Candidature).filter(Candidature.user_id == user_id).count()


def count_due_relances(db: Session, user_id: str, before: datetime) -> int:
    return (
        db.query(Relance)
        .filter(
            Relance.user_id == user_id,
            Relance.statut == "a_faire",
            Relance.date_prevue <= before,
        )
        .count()
    )


def list_due_relances(db: Session, user_id: str, before: datetime) -> list[Relance]:
    return (
        db.query(Relance)
        .filter(
            Relance.user_id == user_id,
            Relance.statut == "a_faire",
            Relance.date_prevue <= before,
        )
        .order_by(Relance.date_prevue.asc())
        .all()
    )


def complete_relance(
    db: Session,
    relance: Relance,
    completed_at: datetime,
    event_content: str | None,
    next_action_data: dict | None,
) -> tuple[CandidatureEvent, Relance | None]:
    relance.statut = "faite"
    relance.date_effectuee = completed_at
    event = CandidatureEvent(
        candidature_id=relance.candidature_id,
        user_id=relance.user_id,
        type="relance_envoyee",
        contenu=event_content,
    )
    db.add(event)
    created_next = None
    if next_action_data:
        due_at = next_action_data.get("due_at")
        if due_at:
            created_next = Relance(
                candidature_id=relance.candidature_id,
                user_id=relance.user_id,
                date_prevue=datetime.fromisoformat(str(due_at).replace("Z", "+00:00")),
                canal=next_action_data.get("channel"),
                statut="a_faire",
            )
            db.add(created_next)
    db.commit()
    db.refresh(event)
    if created_next:
        db.refresh(created_next)
    return event, created_next


def search_my_etablissements(
    db: Session,
    user_id: str,
    q: str | None,
    relationship_role: str | None,
) -> list[Etablissement]:
    linked_ids = db.query(Candidature.etablissement_id).filter(Candidature.user_id == user_id)
    final_ids = db.query(Candidature.client_final_id).filter(
        Candidature.user_id == user_id,
        Candidature.client_final_id.isnot(None),
    )
    query = db.query(Etablissement).filter(
        or_(Etablissement.id.in_(linked_ids), Etablissement.id.in_(final_ids))
    )
    if q and q.strip():
        query = query.filter(Etablissement.nom.ilike(f"%{q.strip()}%"))
    if relationship_role == "intermediary":
        query = query.filter(Etablissement.id.in_(linked_ids))
    elif relationship_role == "client_final":
        query = query.filter(Etablissement.id.in_(final_ids))
    return query.all()


def list_candidatures_for_organization(db: Session, user_id: str, organization_id: str) -> list[Candidature]:
    return (
        db.query(Candidature)
        .filter(
            Candidature.user_id == user_id,
            or_(
                Candidature.etablissement_id == organization_id,
                Candidature.client_final_id == organization_id,
            ),
        )
        .order_by(Candidature.updated_at.desc())
        .all()
    )


def list_recent_events_for_candidatures(
    db: Session, user_id: str, candidature_ids: list[str], limit: int = 30
) -> list[CandidatureEvent]:
    return (
        db.query(CandidatureEvent)
        .filter(
            CandidatureEvent.user_id == user_id,
            CandidatureEvent.candidature_id.in_(candidature_ids),
        )
        .order_by(CandidatureEvent.created_at.desc())
        .limit(limit)
        .all()
    )


def search_my_candidatures(
    db: Session,
    user_id: str,
    include_closed: bool,
    excluded_statuses: list[str],
    statuses: list[str] | None,
    q: str | None,
) -> list[Candidature]:
    query = db.query(Candidature).filter(Candidature.user_id == user_id)
    if not include_closed:
        query = query.filter(Candidature.statut.notin_(excluded_statuses))
    if statuses:
        query = query.filter(Candidature.statut.in_(statuses))
    if q and q.strip():
        needle = f"%{q.strip()}%"
        query = query.join(Etablissement, Candidature.etablissement_id == Etablissement.id).filter(
            or_(Candidature.poste.ilike(needle), Etablissement.nom.ilike(needle))
        )
    return query.all()


def list_related_candidatures(db: Session, user_id: str, etablissement_id: str) -> list[Candidature]:
    return (
        db.query(Candidature)
        .filter(Candidature.user_id == user_id, Candidature.etablissement_id == etablissement_id)
        .all()
    )


def list_open_relances_for_candidature(db: Session, user_id: str, candidature_id: str) -> list[Relance]:
    return (
        db.query(Relance)
        .filter(
            Relance.user_id == user_id,
            Relance.candidature_id == candidature_id,
            Relance.statut == "a_faire",
        )
        .order_by(Relance.date_prevue.asc())
        .all()
    )


def cancel_open_actions_for_candidature(db: Session, user_id: str, candidature_id: str) -> int:
    open_actions = (
        db.query(Relance)
        .filter(
            Relance.user_id == user_id,
            Relance.candidature_id == candidature_id,
            Relance.statut == "a_faire",
        )
        .all()
    )
    for action in open_actions:
        action.statut = "ignoree"
    return len(open_actions)


def record_status_change(
    db: Session,
    candidature_id: str,
    user_id: str,
    old_status: str,
    new_status: str,
    content: str,
) -> None:
    db.add(
        CandidatureEvent(
            candidature_id=candidature_id,
            user_id=user_id,
            type="statut_change",
            ancien_statut=old_status,
            nouveau_statut=new_status,
            contenu=content,
        )
    )
    db.commit()


def schedule_action(
    db: Session,
    candidature_id: str,
    user_id: str,
    due_at: datetime,
    channel: str | None,
    note: str | None,
) -> Relance:
    action = Relance(
        candidature_id=candidature_id,
        user_id=user_id,
        date_prevue=due_at,
        canal=channel,
        contenu=note,
        statut="a_faire",
    )
    db.add(action)
    db.add(
        CandidatureEvent(
            candidature_id=candidature_id,
            user_id=user_id,
            type="relance_planifiee",
            contenu=note or f"Relance planifiée le {due_at.isoformat()}",
        )
    )
    db.commit()
    db.refresh(action)
    return action


def create_candidature(db: Session, data: dict, user_id: str) -> Candidature:
    candidature = Candidature(**data, user_id=user_id)
    db.add(candidature)
    db.flush()
    db.add(
        CandidatureEvent(
            candidature_id=candidature.id,
            user_id=user_id,
            type="creation",
            nouveau_statut=candidature.statut,
            contenu="Candidature creee",
        )
    )
    db.commit()
    db.refresh(candidature)
    return candidature


def list_candidature_history(db: Session, candidature_id: str, cutoff: datetime | None) -> list[CandidatureEvent]:
    query = (
        db.query(CandidatureEvent)
        .filter(CandidatureEvent.candidature_id == candidature_id)
        .order_by(CandidatureEvent.created_at.desc())
    )
    if cutoff is not None:
        query = query.filter(CandidatureEvent.created_at >= cutoff)
    return query.all()


def pipeline_counts(db: Session, user_id: str) -> list[tuple[str, int]]:
    return (
        db.query(Candidature.statut, func.count(Candidature.id))
        .filter(Candidature.user_id == user_id)
        .group_by(Candidature.statut)
        .all()
    )
