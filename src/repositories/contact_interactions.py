"""Data access for the ``contact_interactions`` domain.

Pure SQLAlchemy query functions extracted from
``src/routers/contact_interactions.py`` per ADR-0002. No business rules, no
HTTP concerns: callers (routers/services) decide what a missing result means
(404, 403, ...).
"""
from sqlalchemy.orm import Session

from src.models import Contact, ContactInteraction


def list_for_user(db: Session, user_id: str) -> list[ContactInteraction]:
    return (
        db.query(ContactInteraction)
        .filter(ContactInteraction.user_id == user_id)
        .order_by(ContactInteraction.updated_at.desc())
        .all()
    )


def get_contact_by_id(db: Session, contact_id: str) -> Contact | None:
    return db.query(Contact).filter(Contact.id == contact_id).first()


def get_by_id_for_user(db: Session, interaction_id: str, user_id: str) -> ContactInteraction | None:
    return (
        db.query(ContactInteraction)
        .filter(ContactInteraction.id == interaction_id, ContactInteraction.user_id == user_id)
        .first()
    )


def create(db: Session, data: dict, user_id: str) -> ContactInteraction:
    interaction = ContactInteraction(**data, user_id=user_id)
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def update(db: Session, interaction: ContactInteraction, updates: dict) -> ContactInteraction:
    for field, value in updates.items():
        setattr(interaction, field, value)
    db.commit()
    db.refresh(interaction)
    return interaction


def delete(db: Session, interaction: ContactInteraction) -> None:
    db.delete(interaction)
    db.commit()
