from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_user_id
from src.database import get_db
from src.repositories import contact_interactions as contact_interactions_repo
from src.schemas.contact_interactions import (
    ContactInteractionCreate,
    ContactInteractionSchema,
    ContactInteractionUpdate,
)

router = APIRouter()


@router.get("", response_model=list[ContactInteractionSchema])
def list_contact_interactions(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[ContactInteractionSchema]:
    interactions = contact_interactions_repo.list_for_user(db, user_id)
    return [ContactInteractionSchema.model_validate(item) for item in interactions]


@router.post("", response_model=ContactInteractionSchema, status_code=status.HTTP_201_CREATED)
def create_contact_interaction(
    body: ContactInteractionCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> ContactInteractionSchema:
    contact = contact_interactions_repo.get_contact_by_id(db, body.contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact introuvable")

    interaction = contact_interactions_repo.create(
        db, body.model_dump(exclude={"user_id"}), user_id
    )
    return ContactInteractionSchema.model_validate(interaction)


@router.get("/{interaction_id}", response_model=ContactInteractionSchema)
def get_contact_interaction(
    interaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> ContactInteractionSchema:
    interaction = contact_interactions_repo.get_by_id_for_user(db, interaction_id, user_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")
    return ContactInteractionSchema.model_validate(interaction)


@router.patch("/{interaction_id}", response_model=ContactInteractionSchema)
def update_contact_interaction(
    interaction_id: str,
    body: ContactInteractionUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> ContactInteractionSchema:
    interaction = contact_interactions_repo.get_by_id_for_user(db, interaction_id, user_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")

    updates = {
        field: value
        for field, value in body.model_dump(exclude_unset=True).items()
        if field != "user_id"
    }
    interaction = contact_interactions_repo.update(db, interaction, updates)
    return ContactInteractionSchema.model_validate(interaction)


@router.delete("/{interaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact_interaction(
    interaction_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> Response:
    interaction = contact_interactions_repo.get_by_id_for_user(db, interaction_id, user_id)
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction introuvable")
    contact_interactions_repo.delete(db, interaction)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
