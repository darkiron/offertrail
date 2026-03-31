from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ContactInteractionCreate(BaseModel):
    contact_id: str
    appreciation: Optional[str] = None
    notes: Optional[str] = None
    email_perso: Optional[str] = None
    telephone: Optional[str] = None
    derniere_interaction: Optional[datetime] = None


class ContactInteractionUpdate(BaseModel):
    appreciation: Optional[str] = None
    notes: Optional[str] = None
    email_perso: Optional[str] = None
    telephone: Optional[str] = None
    derniere_interaction: Optional[datetime] = None


class ContactInteractionSchema(BaseModel):
    id: str
    contact_id: str
    user_id: str
    appreciation: Optional[str]
    notes: Optional[str]
    email_perso: Optional[str]
    telephone: Optional[str]
    derniere_interaction: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
