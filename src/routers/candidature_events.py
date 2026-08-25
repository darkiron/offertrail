from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_user_id
from src.database import get_db
from src.repositories import candidature_events as candidature_events_repo
from src.schemas.candidature_events import (
    CandidatureEventCreate,
    CandidatureEventSchema,
    CandidatureEventUpdate,
)

router = APIRouter()


@router.get("", response_model=list[CandidatureEventSchema])
def list_candidature_events(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[CandidatureEventSchema]:
    events = candidature_events_repo.list_for_user(db, user_id)
    return [CandidatureEventSchema.model_validate(item) for item in events]


@router.post("", response_model=CandidatureEventSchema, status_code=status.HTTP_201_CREATED)
def create_candidature_event(
    body: CandidatureEventCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> CandidatureEventSchema:
    candidature = candidature_events_repo.get_candidature_by_id_for_user(db, body.candidature_id, user_id)
    if not candidature:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    event = candidature_events_repo.create(db, body.model_dump(exclude={"user_id"}), user_id)
    return CandidatureEventSchema.model_validate(event)


@router.get("/{event_id}", response_model=CandidatureEventSchema)
def get_candidature_event(
    event_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> CandidatureEventSchema:
    event = candidature_events_repo.get_by_id_for_user(db, event_id, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")
    return CandidatureEventSchema.model_validate(event)


@router.patch("/{event_id}", response_model=CandidatureEventSchema)
def update_candidature_event(
    event_id: str,
    body: CandidatureEventUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> CandidatureEventSchema:
    event = candidature_events_repo.get_by_id_for_user(db, event_id, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")

    updates = {
        field: value
        for field, value in body.model_dump(exclude_unset=True).items()
        if field != "user_id"
    }
    event = candidature_events_repo.update(db, event, updates)
    return CandidatureEventSchema.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidature_event(
    event_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> Response:
    event = candidature_events_repo.get_by_id_for_user(db, event_id, user_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")
    candidature_events_repo.delete(db, event)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
