from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from src.auth import get_admin_user
from src.database import get_db
from src.models import Candidature, User

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Metriques globales du SaaS."""
    total_users = db.query(User).count()
    pro_users = db.query(User).filter(User.plan == "pro").count()
    total_cands = db.query(Candidature).count()
    mrr_estimate = round(pro_users * 9.99, 2)

    return {
        "total_users": total_users,
        "pro_users": pro_users,
        "starter_users": total_users - pro_users,
        "total_candidatures": total_cands,
        "mrr_estimate": mrr_estimate,
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Liste tous les users avec leurs metriques."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for user in users:
        nb_cands = db.query(Candidature).filter(Candidature.user_id == user.id).count()
        result.append({
            "id": user.id,
            "email": user.email,
            "prenom": user.prenom,
            "nom": user.nom,
            "plan": user.plan,
            "role": user.role,
            "is_active": user.is_active,
            "nb_candidatures": nb_cands,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "plan_started_at": user.plan_started_at.isoformat() if user.plan_started_at else None,
        })
    return result


@router.patch("/users/{user_id}/plan")
def update_user_plan(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    """Upgrade ou downgrade le plan d'un user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User introuvable")

    new_plan = body.get("plan")
    if new_plan not in ("starter", "pro"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    from src.services.subscription import _downgrade_to_starter, activate_pro

    if new_plan == "pro":
        activate_pro(db, user)
    else:
        _downgrade_to_starter(db, user)

    db.refresh(user)
    return {"id": user.id, "plan": user.plan}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """Desactive un user (soft delete)."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te desactiver toi-meme")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User introuvable")

    user.is_active = False
    db.commit()
    return {"message": "User desactive"}


@router.post("/recompute-probite")
def recompute(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    from src.services.probite import recompute_probite_scores

    updated = recompute_probite_scores(db)
    return {"updated": updated}
