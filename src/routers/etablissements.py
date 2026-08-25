from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.auth import get_active_profile, get_active_user_id
from src.database import get_db
from src.enums import CandidatureStatut, STATUTS_REPONSE_POSITIVE
from src.models import Candidature, Etablissement, Profile
from src.repositories import etablissements as etablissements_repo
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
    responded = [cand for cand in candidatures if cand.date_reponse is not None or cand.statut in STATUTS_REPONSE_POSITIVE]
    positive = [cand for cand in candidatures if cand.statut in STATUTS_REPONSE_POSITIVE]
    ghosting = [cand for cand in candidatures if cand.statut == CandidatureStatut.REFUSEE]
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
    q: str | None = None,
    limit: int | None = Query(default=None, ge=1, le=50),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[EtablissementSchema]:
    etablissements = etablissements_repo.search(db, q, limit)
    candidatures = etablissements_repo.list_candidatures_for_user(db, user_id)
    candidatures_by_ets: dict[str, list[Candidature]] = {}
    for candidature in candidatures:
        effective_id = candidature.client_final_id or candidature.etablissement_id
        candidatures_by_ets.setdefault(effective_id, []).append(candidature)
    return [build_schema(ets, candidatures_by_ets.get(ets.id, [])) for ets in etablissements]


@router.get("/{etablissement_id}", response_model=EtablissementSchema)
def get_etablissement(
    etablissement_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> EtablissementSchema:
    etablissement = etablissements_repo.get_by_id(db, etablissement_id)
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    candidatures = etablissements_repo.list_candidatures_for_etablissement(db, user_id, etablissement_id)
    return build_schema(etablissement, candidatures)


@router.post("", response_model=EtablissementSchema, status_code=status.HTTP_201_CREATED)
def create_etablissement(
    payload: EtablissementCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> EtablissementSchema:
    etablissement = etablissements_repo.create(
        db,
        nom=payload.nom,
        type_value=to_model_type(payload.type),
        site_web=payload.site_web,
        description=payload.description,
        created_by=user_id,
    )
    return build_schema(etablissement, [])


@router.patch("/{etablissement_id}", response_model=EtablissementSchema)
def update_etablissement(
    etablissement_id: str,
    payload: EtablissementUpdate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> EtablissementSchema:
    etablissement = etablissements_repo.get_by_id(db, etablissement_id)
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    is_in_portfolio = etablissements_repo.is_in_user_portfolio(db, profile.id, etablissement_id)
    if etablissement.created_by != profile.id and profile.role != "admin" and not is_in_portfolio:
        raise HTTPException(status_code=403, detail="Modification non autorisee")

    updates: dict = {}
    if payload.nom is not None:
        updates["nom"] = payload.nom
    if payload.type is not None:
        updates["type"] = to_model_type(payload.type)
    if payload.site_web is not None:
        updates["site_web"] = payload.site_web
    if payload.description is not None:
        updates["description"] = payload.description

    etablissement = etablissements_repo.update(db, etablissement, updates)
    candidatures = etablissements_repo.list_candidatures_for_etablissement(db, profile.id, etablissement_id)
    return build_schema(etablissement, candidatures)


@router.delete("/{etablissement_id}")
def delete_etablissement(
    etablissement_id: str,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> dict[str, bool]:
    etablissement = etablissements_repo.get_by_id(db, etablissement_id)
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if etablissement.created_by != profile.id and profile.role != "admin":
        raise HTTPException(status_code=403, detail="Suppression non autorisee")

    if etablissements_repo.has_candidatures(db, etablissement_id):
        raise HTTPException(status_code=400, detail="Cannot delete organization with applications")

    etablissements_repo.delete(db, etablissement)
    return {"success": True}
