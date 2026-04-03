from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_current_user_id
from src.database import get_db
from src.models import Candidature, CandidatureEvent
from src.schemas.candidature_events import (
    CandidatureEventCreate,
    CandidatureEventSchema,
    CandidatureEventUpdate,
)

router = APIRouter()


@router.get("", response_model=list[CandidatureEventSchema])
def list_candidature_events(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[CandidatureEventSchema]:
    events = (
        db.query(CandidatureEvent)
        .filter(CandidatureEvent.user_id == user_id)
        .order_by(CandidatureEvent.created_at.desc())
        .all()
    )
    return [CandidatureEventSchema.model_validate(item) for item in events]


@router.post("", response_model=CandidatureEventSchema, status_code=status.HTTP_201_CREATED)
def create_candidature_event(
    body: CandidatureEventCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureEventSchema:
    candidature = (
        db.query(Candidature)
        .filter(Candidature.id == body.candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not candidature:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    event = CandidatureEvent(
        **body.model_dump(exclude={"user_id"}),
        user_id=user_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return CandidatureEventSchema.model_validate(event)


@router.get("/{event_id}", response_model=CandidatureEventSchema)
def get_candidature_event(
    event_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureEventSchema:
    event = db.query(CandidatureEvent).filter(CandidatureEvent.id == event_id, CandidatureEvent.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")
    return CandidatureEventSchema.model_validate(event)


@router.patch("/{event_id}", response_model=CandidatureEventSchema)
def update_candidature_event(
    event_id: str,
    body: CandidatureEventUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureEventSchema:
    event = db.query(CandidatureEvent).filter(CandidatureEvent.id == event_id, CandidatureEvent.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "user_id":
            continue
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return CandidatureEventSchema.model_validate(event)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidature_event(
    event_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> Response:
    event = db.query(CandidatureEvent).filter(CandidatureEvent.id == event_id, CandidatureEvent.user_id == user_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event introuvable")
    db.delete(event)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
