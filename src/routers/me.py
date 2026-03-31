from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from src.auth import get_current_user_id, own_candidature
from src.database import get_db
from src.models import Candidature, CandidatureEvent, Etablissement, Relance
from src.schemas.me import (
    CandidatureCreate,
    CandidatureSchema,
    EventSchema,
    MeStatsResponse,
    PaginatedCandidatures,
    PipelineBucket,
    RelanceSchema,
)

router = APIRouter()


@router.get("/candidatures", response_model=PaginatedCandidatures)
def list_my_candidatures(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PaginatedCandidatures:
    query = db.query(Candidature).filter(Candidature.user_id == user_id)
    total = query.count()
    items = (
        query.order_by(Candidature.updated_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return PaginatedCandidatures(
        items=[CandidatureSchema.model_validate(item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.post("/candidatures", response_model=CandidatureSchema, status_code=201)
def create_my_candidature(
    payload: CandidatureCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CandidatureSchema:
    etablissement = db.query(Etablissement).filter(Etablissement.id == payload.etablissement_id).first()
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")

    candidature = Candidature(
        **payload.model_dump(),
        user_id=user_id,
    )
    db.add(candidature)
    db.flush()
    db.add(
        CandidatureEvent(
            candidature_id=candidature.id,
            user_id=user_id,
            type="creation",
            nouveau_statut=candidature.statut,
            contenu="Candidature creee",
        )
    )
    db.commit()
    db.refresh(candidature)
    return CandidatureSchema.model_validate(candidature)


@router.get("/candidatures/{candidature_id}", response_model=CandidatureSchema)
def get_my_candidature(candidature: Candidature = Depends(own_candidature)) -> CandidatureSchema:
    return CandidatureSchema.model_validate(candidature)


@router.get("/candidatures/{candidature_id}/history", response_model=list[EventSchema])
def get_my_candidature_history(
    candidature: Candidature = Depends(own_candidature),
    db: Session = Depends(get_db),
) -> list[EventSchema]:
    events = (
        db.query(CandidatureEvent)
        .filter(CandidatureEvent.candidature_id == candidature.id)
        .order_by(CandidatureEvent.created_at.desc())
        .all()
    )
    return [EventSchema.model_validate(event) for event in events]


@router.get("/stats", response_model=MeStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> MeStatsResponse:
    candidatures = db.query(Candidature).filter(Candidature.user_id == user_id).all()
    total = len(candidatures)
    if total == 0:
        return MeStatsResponse(
            total_candidatures=0,
            taux_refus=0,
            delai_moyen_reponse=None,
            taux_reponse=0,
        )

    refus = [cand for cand in candidatures if cand.statut == "refusee"]
    repondues = [cand for cand in candidatures if cand.date_reponse is not None]
    delais = [
        (cand.date_reponse - cand.date_candidature).days
        for cand in repondues
        if cand.date_candidature is not None and cand.date_reponse is not None
    ]

    return MeStatsResponse(
        total_candidatures=total,
        taux_refus=round(len(refus) / total * 100, 2),
        delai_moyen_reponse=round(sum(delais) / len(delais), 2) if delais else None,
        taux_reponse=round(len(repondues) / total * 100, 2),
    )


@router.get("/relances/dues", response_model=list[RelanceSchema])
def get_due_relances(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[RelanceSchema]:
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)
    relances = (
        db.query(Relance)
        .filter(
            Relance.user_id == user_id,
            Relance.statut == "a_faire",
            Relance.date_prevue >= today_start,
            Relance.date_prevue <= today_end,
        )
        .order_by(Relance.date_prevue.asc())
        .all()
    )
    return [RelanceSchema.model_validate(relance) for relance in relances]


@router.get("/pipeline", response_model=list[PipelineBucket])
def get_pipeline(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[PipelineBucket]:
    rows = (
        db.query(Candidature.statut, func.count(Candidature.id))
        .filter(Candidature.user_id == user_id)
        .group_by(Candidature.statut)
        .all()
    )
    return [PipelineBucket(statut=statut, count=count) for statut, count in rows]
