from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.schemas._types import UuidStr, OptUuidStr


class CandidatureCreate(BaseModel):
    etablissement_id: str
    succursale_id: Optional[str] = None
    poste: str
    url_offre: Optional[str] = None
    description: Optional[str] = None
    statut: str = "brouillon"
    date_candidature: Optional[datetime] = None
    date_reponse: Optional[datetime] = None
    salaire_vise: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class CandidatureSchema(BaseModel):
    id: UuidStr
    user_id: UuidStr
    etablissement_id: UuidStr
    succursale_id: OptUuidStr
    poste: str
    url_offre: Optional[str]
    description: Optional[str]
    statut: str
    date_candidature: Optional[datetime]
    date_reponse: Optional[datetime]
    salaire_vise: Optional[int]
    source: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EventSchema(BaseModel):
    id: UuidStr
    type: str
    ancien_statut: Optional[str]
    nouveau_statut: Optional[str]
    contenu: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PaginatedCandidatures(BaseModel):
    items: list[CandidatureSchema]
    total: int
    page: int
    per_page: int


class StatItem(BaseModel):
    label: str
    value: float


class MeStatsResponse(BaseModel):
    total_candidatures: int
    pipeline_actif: int
    taux_refus: float
    temps_moyen_reponse: Optional[float]
    delai_moyen_reponse: Optional[float]
    taux_reponse: float
    relances_dues: int


class PipelineBucket(BaseModel):
    statut: str
    count: int


class RelanceSchema(BaseModel):
    id: UuidStr
    candidature_id: UuidStr
    user_id: UuidStr
    contact_id: OptUuidStr
    date_prevue: datetime
    date_effectuee: Optional[datetime]
    canal: Optional[str]
    contenu: Optional[str]
    statut: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
