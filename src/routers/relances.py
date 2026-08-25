from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_profile, get_active_user_id
from src.database import get_db
from src.models import Profile
from src.repositories import relances as relances_repo
from src.schemas.relances import RelanceCreate, RelanceSchema, RelanceUpdate
from src.services.subscription import check_can_create_relance

router = APIRouter()


@router.get("", response_model=list[RelanceSchema])
def list_relances(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[RelanceSchema]:
    relances = relances_repo.list_for_user(db, user_id)
    return [RelanceSchema.model_validate(item) for item in relances]


@router.post("", response_model=RelanceSchema, status_code=status.HTTP_201_CREATED)
def create_relance(
    body: RelanceCreate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> RelanceSchema:
    user_id = profile.id
    check_can_create_relance(db, profile)

    candidature = relances_repo.get_candidature_by_id_for_user(db, body.candidature_id, user_id)
    if not candidature:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    relance = relances_repo.create(db, body.model_dump(exclude={"user_id"}), user_id)
    return RelanceSchema.model_validate(relance)


@router.get("/{relance_id}", response_model=RelanceSchema)
def get_relance(
    relance_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> RelanceSchema:
    relance = relances_repo.get_by_id_for_user(db, relance_id, user_id)
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
    relance = relances_repo.get_by_id_for_user(db, relance_id, user_id)
    if not relance:
        raise HTTPException(status_code=404, detail="Relance introuvable")

    updates = {
        field: value
        for field, value in body.model_dump(exclude_unset=True).items()
        if field != "user_id"
    }
    relance = relances_repo.update(db, relance, updates)
    return RelanceSchema.model_validate(relance)


@router.delete("/{relance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_relance(
    relance_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> Response:
    relance = relances_repo.get_by_id_for_user(db, relance_id, user_id)
    if not relance:
        raise HTTPException(status_code=404, detail="Relance introuvable")
    relances_repo.delete(db, relance)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
