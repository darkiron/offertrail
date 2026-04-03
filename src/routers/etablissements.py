from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from src.auth import get_current_user_id
from src.database import get_db
from src.models import Candidature, Etablissement
from src.schemas.etablissements import (
    EtablissementCreate,
    EtablissementSchema,
    EtablissementUpdate,
)

router = APIRouter()


TYPE_MAP = {
    "CLIENT_FINAL": "client_final",
    "ESN": "esn",
    "CABINET_RECRUTEMENT": "cabinet_recrutement",
    "STARTUP": "startup",
    "PME": "pme",
    "GRAND_COMPTE": "grand_compte",
    "PORTAGE": "portage",
    "AUTRE": "autre",
}

TYPE_REVERSE_MAP = {value: key for key, value in TYPE_MAP.items()}


def to_front_type(value: str | None) -> str:
    return TYPE_REVERSE_MAP.get((value or "").strip().lower(), "AUTRE")


def to_model_type(value: str | None) -> str:
    return TYPE_MAP.get((value or "AUTRE").strip().upper(), "autre")


def build_schema(etablissement: Etablissement, candidatures: list[Candidature]) -> EtablissementSchema:
    total = len(candidatures)
    responded = [cand for cand in candidatures if cand.date_reponse is not None or cand.statut in {"refusee", "entretien", "offre_recue", "acceptee"}]
    positive = [cand for cand in candidatures if cand.statut in {"entretien", "offre_recue", "acceptee"}]
    ghosting = [cand for cand in candidatures if cand.statut == "ghosting"]
    delays = [
        (cand.date_reponse - cand.date_candidature).days
        for cand in candidatures
        if cand.date_reponse is not None and cand.date_candidature is not None
    ]
    response_rate = round((len(responded) / total) * 100, 2) if total else 0
    positive_rate = round((len(positive) / total) * 100, 2) if total else 0

    return EtablissementSchema(
        id=etablissement.id,
        nom=etablissement.nom,
        type=to_front_type(etablissement.type),
        site_web=etablissement.site_web,
        description=etablissement.description,
        created_at=etablissement.created_at or datetime.utcnow(),
        updated_at=etablissement.updated_at or datetime.utcnow(),
        total_applications=total,
        total_responses=len(responded),
        response_rate=response_rate,
        avg_response_days=round(sum(delays) / len(delays), 2) if delays else None,
        ghosting_count=len(ghosting),
        positive_count=len(positive),
        positive_rate=positive_rate,
        probity_score=None,
        probity_level="insuffisant",
        city=None,
        linkedin_url=None,
        notes=etablissement.description,
    )


@router.get("", response_model=list[EtablissementSchema])
def list_etablissements(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> list[EtablissementSchema]:
    etablissements = db.query(Etablissement).order_by(Etablissement.nom.asc()).all()
    candidatures = db.query(Candidature).filter(Candidature.user_id == user_id).all()
    candidatures_by_ets: dict[str, list[Candidature]] = {}
    for candidature in candidatures:
        effective_id = candidature.client_final_id or candidature.etablissement_id
        candidatures_by_ets.setdefault(effective_id, []).append(candidature)
    return [build_schema(ets, candidatures_by_ets.get(ets.id, [])) for ets in etablissements]


@router.get("/{etablissement_id}", response_model=EtablissementSchema)
def get_etablissement(
    etablissement_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> EtablissementSchema:
    etablissement = db.query(Etablissement).filter(Etablissement.id == etablissement_id).first()
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    candidatures = db.query(Candidature).filter(
        Candidature.user_id == user_id,
        or_(
            Candidature.client_final_id == etablissement_id,
            and_(Candidature.client_final_id.is_(None), Candidature.etablissement_id == etablissement_id),
        ),
    ).all()
    return build_schema(etablissement, candidatures)


@router.post("", response_model=EtablissementSchema, status_code=status.HTTP_201_CREATED)
def create_etablissement(
    payload: EtablissementCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> EtablissementSchema:
    etablissement = Etablissement(
        nom=payload.nom,
        type=to_model_type(payload.type),
        site_web=payload.site_web,
        description=payload.description,
        created_by=user_id,
    )
    db.add(etablissement)
    db.commit()
    db.refresh(etablissement)
    return build_schema(etablissement, [])


@router.patch("/{etablissement_id}", response_model=EtablissementSchema)
def update_etablissement(
    etablissement_id: str,
    payload: EtablissementUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> EtablissementSchema:
    etablissement = db.query(Etablissement).filter(Etablissement.id == etablissement_id).first()
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")

    if payload.nom is not None:
        etablissement.nom = payload.nom
    if payload.type is not None:
        etablissement.type = to_model_type(payload.type)
    if payload.site_web is not None:
        etablissement.site_web = payload.site_web
    if payload.description is not None:
        etablissement.description = payload.description

    db.commit()
    db.refresh(etablissement)
    candidatures = db.query(Candidature).filter(
        Candidature.user_id == user_id,
        or_(
            Candidature.client_final_id == etablissement_id,
            and_(Candidature.client_final_id.is_(None), Candidature.etablissement_id == etablissement_id),
        ),
    ).all()
    return build_schema(etablissement, candidatures)


@router.delete("/{etablissement_id}")
def delete_etablissement(
    etablissement_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> dict[str, bool]:
    etablissement = db.query(Etablissement).filter(Etablissement.id == etablissement_id).first()
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")

    has_candidatures = db.query(Candidature).filter(Candidature.etablissement_id == etablissement_id).first()
    if has_candidatures:
        raise HTTPException(status_code=400, detail="Cannot delete organization with applications")

    db.delete(etablissement)
    db.commit()
    return {"success": True}
