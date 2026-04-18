from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_user_id
from src.database import get_db
from src.models import Candidature, Relance
from src.schemas.relances import RelanceCreate, RelanceSchema, RelanceUpdate

router = APIRouter()


@router.get("", response_model=list[RelanceSchema])
def list_relances(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[RelanceSchema]:
    relances = db.query(Relance).filter(Relance.user_id == user_id).order_by(Relance.date_prevue.asc()).all()
    return [RelanceSchema.model_validate(item) for item in relances]


@router.post("", response_model=RelanceSchema, status_code=status.HTTP_201_CREATED)
def create_relance(
    body: RelanceCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> RelanceSchema:
    candidature = (
        db.query(Candidature)
        .filter(Candidature.id == body.candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not candidature:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    relance = Relance(
        **body.model_dump(exclude={"user_id"}),
        user_id=user_id,
    )
    db.add(relance)
    db.commit()
    db.refresh(relance)
    return RelanceSchema.model_validate(relance)


@router.get("/{relance_id}", response_model=RelanceSchema)
def get_relance(
    relance_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> RelanceSchema:
    relance = db.query(Relance).filter(Relance.id == relance_id, Relance.user_id == user_id).first()
    if not relance:
        raise HTTPException(status_code=404, detail="Relance introuvable")
    return RelanceSchema.model_validate(relance)


@router.patch("/{relance_id}", response_model=RelanceSchema)
def update_relance(
    relance_id: str,
    body: RelanceUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> RelanceSchema:
    relance = db.query(Relance).filter(Relance.id == relance_id, Relance.user_id == user_id).first()
    if not relance:
        raise HTTPException(status_code=404, detail="Relance introuvable")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "user_id":
            continue
        setattr(relance, field, value)

    db.commit()
    db.refresh(relance)
    return RelanceSchema.model_validate(relance)


@router.delete("/{relance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relance(
    relance_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> Response:
    relance = db.query(Relance).filter(Relance.id == relance_id, Relance.user_id == user_id).first()
    if not relance:
        raise HTTPException(status_code=404, detail="Relance introuvable")
    db.delete(relance)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
