from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.schemas._types import UuidStr, OptUuidStr


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
    created_at: Optional[datetime] = None


class CandidatureEventSchema(BaseModel):
    id: UuidStr
    candidature_id: UuidStr
    user_id: UuidStr
    type: str
    ancien_statut: Optional[str]
    nouveau_statut: Optional[str]
    contenu: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
