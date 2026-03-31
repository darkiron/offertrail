from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_current_user_id
from src.database import get_db
from src.models import Candidature, CandidatureEvent, Etablissement
from src.schemas.candidatures import CandidatureCreate, CandidatureSchema, CandidatureUpdate

router = APIRouter()


@router.get("", response_model=list[CandidatureSchema])
def list_candidatures(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[CandidatureSchema]:
    candidatures = (
        db.query(Candidature)
        .filter(Candidature.user_id == user_id)
        .order_by(Candidature.updated_at.desc())
        .all()
    )
    return [CandidatureSchema.model_validate(item) for item in candidatures]


@router.post("", response_model=CandidatureSchema, status_code=status.HTTP_201_CREATED)
def create_candidature(
    body: CandidatureCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureSchema:
    etablissement = db.query(Etablissement).filter(Etablissement.id == body.etablissement_id).first()
    if not etablissement:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")

    cand = Candidature(
        **body.model_dump(exclude={"user_id"}),
        user_id=user_id,
    )
    db.add(cand)
    db.flush()
    db.add(
        CandidatureEvent(
            candidature_id=cand.id,
            user_id=user_id,
            type="creation",
            nouveau_statut=cand.statut,
            contenu="Candidature creee",
        )
    )
    db.commit()
    db.refresh(cand)
    return CandidatureSchema.model_validate(cand)


@router.get("/{candidature_id}", response_model=CandidatureSchema)
def get_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureSchema:
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    return CandidatureSchema.model_validate(cand)


@router.patch("/{candidature_id}", response_model=CandidatureSchema)
def update_candidature(
    candidature_id: str,
    body: CandidatureUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureSchema:
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "user_id":
            continue
        setattr(cand, field, value)

    db.commit()
    db.refresh(cand)
    return CandidatureSchema.model_validate(cand)


@router.delete("/{candidature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> Response:
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")
    db.delete(cand)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
