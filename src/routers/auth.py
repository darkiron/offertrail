# src/routers/auth.py — version Supabase
# Register/login/forgot-password/reset-password sont gérés par Supabase Auth.
# Ce router expose uniquement les endpoints de profil utilisateur.
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.auth import get_current_profile, get_db
from src.models import Profile

router = APIRouter()


class ProfileUpdate(BaseModel):
    prenom: Optional[str] = None
    nom: Optional[str] = None


class ProfileSchema(BaseModel):
    id: str
    prenom: Optional[str]
    nom: Optional[str]
    subscription_status: str
    role: str
    plan_started_at: Optional[str] = None
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_profile(cls, profile: Profile) -> "ProfileSchema":
        return cls(
            id=profile.id,
            prenom=profile.prenom,
            nom=profile.nom,
            subscription_status=profile.subscription_status,
            role=profile.role,
            plan_started_at=profile.plan_started_at.isoformat() if profile.plan_started_at else None,
            created_at=profile.created_at.isoformat() if profile.created_at else None,
        )


@router.get("/me")
def get_me(profile: Profile = Depends(get_current_profile)) -> dict:
    return ProfileSchema.from_orm_profile(profile).model_dump()


@router.patch("/me")
def update_me(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_current_profile),
) -> dict:
    if body.prenom is not None:
        profile.prenom = body.prenom
    if body.nom is not None:
        profile.nom = body.nom
    db.commit()
    db.refresh(profile)
    return ProfileSchema.from_orm_profile(profile).model_dump()
