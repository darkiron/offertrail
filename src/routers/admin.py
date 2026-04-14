from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth import get_admin_profile
from src.database import get_db
from src.models import Candidature, Profile

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Métriques globales du SaaS."""
    total_profiles = db.query(Profile).count()
    pro_profiles   = db.query(Profile).filter(Profile.plan == "pro").count()
    total_cands    = db.query(Candidature).count()
    mrr_estimate   = round(pro_profiles * 14.99, 2)

    return {
        "total_users":       total_profiles,
        "pro_users":         pro_profiles,
        "starter_users":     total_profiles - pro_profiles,
        "total_candidatures": total_cands,
        "mrr_estimate":      mrr_estimate,
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Liste tous les profils avec leurs métriques."""
    profiles = db.query(Profile).order_by(Profile.created_at.desc()).all()
    result = []
    for profile in profiles:
        nb_cands = db.query(Candidature).filter(Candidature.user_id == profile.id).count()
        result.append({
            "id":             profile.id,
            "prenom":         profile.prenom,
            "nom":            profile.nom,
            "plan":           profile.plan,
            "role":           profile.role,
            "is_active":      profile.is_active,
            "nb_candidatures": nb_cands,
            "created_at":     profile.created_at.isoformat() if profile.created_at else None,
            "plan_started_at": profile.plan_started_at.isoformat() if profile.plan_started_at else None,
        })
    return result


@router.patch("/users/{user_id}/plan")
def update_user_plan(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Upgrade ou downgrade le plan d'un user."""
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    new_plan = body.get("plan")
    if new_plan not in ("starter", "pro"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    from src.services.subscription import activate_plan

    activate_plan(db, profile, new_plan)

    db.refresh(profile)
    return {"id": profile.id, "plan": profile.plan}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Profile = Depends(get_admin_profile),
):
    """Désactive un user (soft delete)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te désactiver toi-même")

    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    profile.is_active = False
    db.commit()
    return {"message": "User désactivé"}


@router.post("/recompute-probite")
def recompute(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    from src.services.probite import recompute_probite_scores

    updated = recompute_probite_scores(db)
    return {"updated": updated}
