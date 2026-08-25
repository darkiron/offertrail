"""Data access for the ``etablissements`` domain.

Pure SQLAlchemy query functions extracted from ``src/routers/etablissements.py``
per ADR-0002. No business rules, no HTTP concerns: callers (routers/services)
decide what a missing result or empty set means (404, 403, ...).
"""
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from src.models import Candidature, Etablissement


def search(db: Session, q: str | None, limit: int | None) -> list[Etablissement]:
    query = db.query(Etablissement)
    if q and q.strip():
        query = query.filter(Etablissement.nom.ilike(f"%{q.strip()}%"))
    query = query.order_by(Etablissement.nom.asc())
    if limit is not None:
        query = query.limit(limit)
    return query.all()


def get_by_id(db: Session, etablissement_id: str) -> Etablissement | None:
    return db.query(Etablissement).filter(Etablissement.id == etablissement_id).first()


def get_by_nom(db: Session, nom: str) -> Etablissement | None:
    return db.query(Etablissement).filter(Etablissement.nom == nom).first()


def create_minimal(db: Session, *, nom: str, created_by: str) -> Etablissement:
    """Crée un établissement avec seulement nom/created_by (``type`` par défaut),
    sans commit — utilisé par l'import en lot qui gère sa propre transaction."""
    etablissement = Etablissement(nom=nom, created_by=created_by)
    db.add(etablissement)
    db.flush()
    return etablissement


def list_candidatures_for_user(db: Session, user_id: str) -> list[Candidature]:
    return db.query(Candidature).filter(Candidature.user_id == user_id).all()


def list_candidatures_for_etablissement(db: Session, user_id: str, etablissement_id: str) -> list[Candidature]:
    return (
        db.query(Candidature)
        .filter(
            Candidature.user_id == user_id,
            or_(
                Candidature.client_final_id == etablissement_id,
                and_(
                    Candidature.client_final_id.is_(None),
                    Candidature.etablissement_id == etablissement_id,
                ),
            ),
        )
        .all()
    )


def is_in_user_portfolio(db: Session, user_id: str, etablissement_id: str) -> bool:
    return (
        db.query(Candidature.id)
        .filter(
            Candidature.user_id == user_id,
            or_(
                Candidature.etablissement_id == etablissement_id,
                Candidature.client_final_id == etablissement_id,
            ),
        )
        .first()
        is not None
    )


def create(
    db: Session,
    *,
    nom: str,
    type_value: str,
    site_web: str | None,
    description: str | None,
    created_by: str,
) -> Etablissement:
    etablissement = Etablissement(
        nom=nom,
        type=type_value,
        site_web=site_web,
        description=description,
        created_by=created_by,
    )
    db.add(etablissement)
    db.flush()
    etablissement_id = etablissement.id
    db.commit()
    return get_by_id(db, etablissement_id)


def update(db: Session, etablissement: Etablissement, updates: dict) -> Etablissement:
    for field, value in updates.items():
        setattr(etablissement, field, value)
    db.commit()
    db.refresh(etablissement)
    return etablissement


def has_candidatures(db: Session, etablissement_id: str) -> bool:
    return (
        db.query(Candidature)
        .filter(Candidature.etablissement_id == etablissement_id)
        .first()
        is not None
    )


def delete(db: Session, etablissement: Etablissement) -> None:
    db.delete(etablissement)
    db.commit()
