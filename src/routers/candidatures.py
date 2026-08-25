from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_profile, get_active_user_id
from src.database import get_db
from src.models import Profile
from src.repositories import candidatures as candidatures_repo
from src.schemas.candidature_events import CandidatureEventSchema
from src.schemas.candidatures import CandidatureCreate, CandidatureSchema, CandidatureUpdate
from src.services.subscription import check_can_create_candidature

router = APIRouter()


@router.get("", response_model=list[CandidatureSchema])
def list_candidatures(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[CandidatureSchema]:
    candidatures = candidatures_repo.list_for_user(db, user_id)
    return [CandidatureSchema.model_validate(item) for item in candidatures]


@router.post("", response_model=CandidatureSchema, status_code=status.HTTP_201_CREATED)
def create_candidature(
    body: CandidatureCreate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> CandidatureSchema:
    user_id = profile.id
    check_can_create_candidature(db, profile)

    if not body.etablissement_id:
        raise HTTPException(status_code=422, detail="etablissement_id requis")

    try:
        etablissement = candidatures_repo.get_etablissement_by_id(db, body.etablissement_id)
    except Exception:
        raise HTTPException(status_code=422, detail="etablissement_id invalide")
    if not etablissement:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if body.client_final_id:
        client_final = candidatures_repo.get_etablissement_by_id(db, body.client_final_id)
        if not client_final:
            raise HTTPException(status_code=404, detail="Client final introuvable")

    cand = candidatures_repo.create(db, body.model_dump(exclude={"user_id"}), user_id)
    return CandidatureSchema.model_validate(cand)


@router.get("/{candidature_id}", response_model=CandidatureSchema)
def get_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> CandidatureSchema:
    cand = candidatures_repo.get_by_id_for_user(db, candidature_id, user_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    return CandidatureSchema.model_validate(cand)


@router.patch("/{candidature_id}", response_model=CandidatureSchema)
def update_candidature(
    candidature_id: str,
    body: CandidatureUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> CandidatureSchema:
    cand = candidatures_repo.get_by_id_for_user(db, candidature_id, user_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    if body.etablissement_id:
        etablissement = candidatures_repo.get_etablissement_by_id(db, body.etablissement_id)
        if not etablissement:
            raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if body.client_final_id:
        client_final = candidatures_repo.get_etablissement_by_id(db, body.client_final_id)
        if not client_final:
            raise HTTPException(status_code=404, detail="Client final introuvable")

    # Skip None for NOT NULL columns — frontend may send "" for unchanged UUID fields
    _not_nullable = {"etablissement_id", "poste"}
    updates = {
        field: value
        for field, value in body.model_dump(exclude_unset=True).items()
        if field != "user_id" and not (field in _not_nullable and value is None)
    }
    old_status = cand.statut
    cand = candidatures_repo.update(db, candidature_id, user_id, updates, old_status)
    return CandidatureSchema.model_validate(cand)


@router.get("/{candidature_id}/events", response_model=list[CandidatureEventSchema])
def get_candidature_events(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[CandidatureEventSchema]:
    cand = candidatures_repo.get_by_id_for_user(db, candidature_id, user_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    events = candidatures_repo.list_events_for_candidature(db, candidature_id, user_id)
    return [CandidatureEventSchema.model_validate(event) for event in events]


@router.delete("/{candidature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> Response:
    cand = candidatures_repo.get_by_id_for_user(db, candidature_id, user_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    candidatures_repo.delete(db, cand)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
