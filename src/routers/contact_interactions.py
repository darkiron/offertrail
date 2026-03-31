from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_current_user_id
from src.database import get_db
from src.models import Contact, ContactInteraction
from src.schemas.contact_interactions import (
    ContactInteractionCreate,
    ContactInteractionSchema,
    ContactInteractionUpdate,
)

router = APIRouter()


@router.get("", response_model=list[ContactInteractionSchema])
def list_contact_interactions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[ContactInteractionSchema]:
    interactions = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.user_id == user_id)
        .order_by(ContactInteraction.updated_at.desc())
        .all()
    )
    return [ContactInteractionSchema.model_validate(item) for item in interactions]


@router.post("", response_model=ContactInteractionSchema, status_code=status.HTTP_201_CREATED)
def create_contact_interaction(
    body: ContactInteractionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ContactInteractionSchema:
    contact = db.query(Contact).filter(Contact.id == body.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact introuvable")

    interaction = ContactInteraction(
        **body.model_dump(exclude={"user_id"}),
        user_id=user_id,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return ContactInteractionSchema.model_validate(interaction)


@router.get("/{interaction_id}", response_model=ContactInteractionSchema)
def get_contact_interaction(
    interaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ContactInteractionSchema:
    interaction = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.id == interaction_id, ContactInteraction.user_id == user_id)
        .first()
    )
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")
    return ContactInteractionSchema.model_validate(interaction)


@router.patch("/{interaction_id}", response_model=ContactInteractionSchema)
def update_contact_interaction(
    interaction_id: str,
    body: ContactInteractionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ContactInteractionSchema:
    interaction = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.id == interaction_id, ContactInteraction.user_id == user_id)
        .first()
    )
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "user_id":
            continue
        setattr(interaction, field, value)

    db.commit()
    db.refresh(interaction)
    return ContactInteractionSchema.model_validate(interaction)


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact_interaction(
    interaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> Response:
    interaction = (
        db.query(ContactInteraction)
        .filter(ContactInteraction.id == interaction_id, ContactInteraction.user_id == user_id)
        .first()
    )
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")
    db.delete(interaction)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
