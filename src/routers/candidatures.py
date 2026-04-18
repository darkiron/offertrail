from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import get_active_user_id
from src.database import get_db
from src.models import Candidature, CandidatureEvent, Etablissement
from src.schemas.candidature_events import CandidatureEventSchema
from src.schemas.candidatures import CandidatureCreate, CandidatureSchema, CandidatureUpdate

router = APIRouter()


@router.get("", response_model=list[CandidatureSchema])
def list_candidatures(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
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
    user_id: str = Depends(get_active_user_id),
) -> CandidatureSchema:
    if not body.etablissement_id:
        raise HTTPException(status_code=422, detail="etablissement_id requis")

    try:
        etablissement = db.query(Etablissement).filter(Etablissement.id == body.etablissement_id).first()
    except Exception:
        raise HTTPException(status_code=422, detail="etablissement_id invalide")
    if not etablissement:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if body.client_final_id:
        client_final = db.query(Etablissement).filter(Etablissement.id == body.client_final_id).first()
        if not client_final:
            raise HTTPException(status_code=404, detail="Client final introuvable")

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
    cand = db.query(Candidature).filter(Candidature.id == cand.id).first()
    return CandidatureSchema.model_validate(cand)


@router.get("/{candidature_id}", response_model=CandidatureSchema)
def get_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
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
    user_id: str = Depends(get_active_user_id),
) -> CandidatureSchema:
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    if body.etablissement_id:
        etablissement = db.query(Etablissement).filter(Etablissement.id == body.etablissement_id).first()
        if not etablissement:
            raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if body.client_final_id:
        client_final = db.query(Etablissement).filter(Etablissement.id == body.client_final_id).first()
        if not client_final:
            raise HTTPException(status_code=404, detail="Client final introuvable")

    updates = {
        field: value
        for field, value in body.model_dump(exclude_unset=True).items()
        if field != "user_id"
    }
    old_status = cand.statut
    if updates:
        db.query(Candidature).filter(
            Candidature.id == candidature_id,
            Candidature.user_id == user_id,
        ).update(updates)
        new_status = updates.get("statut")
        if new_status and new_status != old_status:
            db.add(
                CandidatureEvent(
                    candidature_id=candidature_id,
                    user_id=user_id,
                    type="statut_change",
                    ancien_statut=old_status,
                    nouveau_statut=new_status,
                )
            )
    db.commit()
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    return CandidatureSchema.model_validate(cand)


@router.get("/{candidature_id}/events", response_model=list[CandidatureEventSchema])
def get_candidature_events(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[CandidatureEventSchema]:
    cand = (
        db.query(Candidature)
        .filter(Candidature.id == candidature_id, Candidature.user_id == user_id)
        .first()
    )
    if not cand:
        raise HTTPException(status_code=404, detail="Candidature introuvable")

    events = (
        db.query(CandidatureEvent)
        .filter(
            CandidatureEvent.candidature_id == candidature_id,
            CandidatureEvent.user_id == user_id,
        )
        .order_by(CandidatureEvent.created_at.desc())
        .all()
    )
    return [CandidatureEventSchema.model_validate(event) for event in events]


@router.delete("/{candidature_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidature(
    candidature_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
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
