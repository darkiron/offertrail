from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from src.schemas._types import UuidStr, OptUuidStr


class RelanceCreate(BaseModel):
    candidature_id: str
    contact_id: Optional[str] = None
    date_prevue: datetime
    canal: Optional[str] = None
    contenu: Optional[str] = None
    statut: str = "a_faire"


class RelanceUpdate(BaseModel):
    contact_id: Optional[str] = None
    date_prevue: Optional[datetime] = None
    date_effectuee: Optional[datetime] = None
    canal: Optional[str] = None
    contenu: Optional[str] = None
    statut: Optional[str] = None


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
