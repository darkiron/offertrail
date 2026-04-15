from datetime import datetime

from pydantic import BaseModel, ConfigDict

from src.schemas._types import UuidStr, OptUuidStr


class EtablissementCreate(BaseModel):
    nom: str
    type: str = "AUTRE"
    site_web: str | None = None
    description: str | None = None


class EtablissementUpdate(BaseModel):
    nom: str | None = None
    type: str | None = None
    site_web: str | None = None
    description: str | None = None


class EtablissementSchema(BaseModel):
    id: UuidStr
    nom: str
    type: str
    site_web: str | None
    description: str | None
    created_at: datetime
    updated_at: datetime
    total_applications: int = 0
    total_responses: int = 0
    response_rate: float = 0
    avg_response_days: float | None = None
    ghosting_count: int = 0
    positive_count: int = 0
    positive_rate: float = 0
    probity_score: float | None = None
    probity_level: str = "insuffisant"
    city: str | None = None
    linkedin_url: str | None = None
    notes: str | None = None
    model_config = ConfigDict(from_attributes=True)
