from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


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


class CandidatureUpdate(BaseModel):
    etablissement_id: Optional[str] = None
    succursale_id: Optional[str] = None
    poste: Optional[str] = None
    url_offre: Optional[str] = None
    description: Optional[str] = None
    statut: Optional[str] = None
    date_candidature: Optional[datetime] = None
    date_reponse: Optional[datetime] = None
    salaire_vise: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None


class CandidatureSchema(BaseModel):
    id: str
    user_id: str
    etablissement_id: str
    succursale_id: Optional[str]
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
