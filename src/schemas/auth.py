from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProfileUpdate(BaseModel):
    prenom: Optional[str] = None
    nom: Optional[str] = None


class ProfileSchema(BaseModel):
    id: str
    prenom: Optional[str]
    nom: Optional[str]
    plan: str
    role: str
    plan_started_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
