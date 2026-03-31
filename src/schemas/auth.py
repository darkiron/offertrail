from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    prenom: Optional[str] = None
    nom: Optional[str] = None


class UserUpdate(BaseModel):
    prenom: Optional[str] = None
    nom: Optional[str] = None


class UserSchema(BaseModel):
    id: str
    email: str
    prenom: Optional[str]
    nom: Optional[str]
    plan: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserSchema
