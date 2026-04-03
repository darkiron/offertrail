from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CandidatureEventCreate(BaseModel):
    candidature_id: str
    type: str
    ancien_statut: Optional[str] = None
    nouveau_statut: Optional[str] = None
    contenu: Optional[str] = None


class CandidatureEventUpdate(BaseModel):
    type: Optional[str] = None
    ancien_statut: Optional[str] = None
    nouveau_statut: Optional[str] = None
    contenu: Optional[str] = None


class CandidatureEventSchema(BaseModel):
    id: str
    candidature_id: str
    user_id: str
    type: str
    ancien_statut: Optional[str]
    nouveau_statut: Optional[str]
    contenu: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
