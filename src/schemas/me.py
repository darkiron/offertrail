from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.schemas._types import UuidStr, OptUuidStr


class CandidatureCreate(BaseModel):
    etablissement_id: str
    client_final_id: Optional[str] = None
    succursale_id: Optional[str] = None
    poste: str
    url_offre: Optional[str] = None
    description: Optional[str] = None
    type_contrat: Optional[str] = None
    statut: str = "brouillon"
    date_candidature: Optional[datetime] = None
    date_reponse: Optional[datetime] = None
    salaire_vise: Optional[int] = None
    tjm_vise: Optional[int] = None
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
    type_contrat: Optional[str]
    statut: str
    date_candidature: Optional[datetime]
    date_reponse: Optional[datetime]
    salaire_vise: Optional[int]
    tjm_vise: Optional[int]
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
    items: list[dict]
    total: int
    page: int
    per_page: int
    pages: int = 0


class PaginatedEtablissements(BaseModel):
    items: list[dict]
    total: int
    page: int
    per_page: int
    pages: int = 0


class PaginatedContacts(BaseModel):
    items: list[dict]
    total: int
    page: int
    per_page: int
    pages: int = 0


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


class ActionApplication(BaseModel):
    id: UuidStr
    title: str
    status: str


class ActionOrganization(BaseModel):
    id: UuidStr
    name: str


class TodayAction(BaseModel):
    id: UuidStr
    kind: str = "followup"
    due_at: datetime
    urgency: str
    application: ActionApplication
    organization: ActionOrganization
    contact: dict | None = None
    context: dict | None = None


class TodayResponse(BaseModel):
    generated_at: datetime
    timezone: str
    activation: dict
    actions: dict
    summary: dict
    recent_activity: list[dict]


class CompleteActionPayload(BaseModel):
    completed_at: datetime | None = None
    outcome: str
    note: str | None = None
    next_action: dict | None = None


class CandidatureStatusUpdate(BaseModel):
    status: str


class NextActionCreate(BaseModel):
    due_at: datetime
    channel: str | None = None
    note: str | None = None


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
