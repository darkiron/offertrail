import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from src.auth import get_admin_profile
from src.database import get_db
from src.models import Candidature, Etablissement, Profile, Relance

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    today = datetime.utcnow()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    total_users    = db.query(Profile).count()
    active_users   = db.query(Profile).filter(Profile.subscription_status == "active").count()
    pending_users  = db.query(Profile).filter(Profile.subscription_status == "pending").count()
    cancelled_users = db.query(Profile).filter(Profile.subscription_status == "cancelled").count()

    mrr = round(active_users * 14.99, 2)
    arr = round(mrr * 12, 2)

    new_users_7d  = db.query(Profile).filter(Profile.created_at >= week_ago).count()
    new_users_30d = db.query(Profile).filter(Profile.created_at >= month_ago).count()
    new_active_30d = db.query(Profile).filter(
        Profile.subscription_status == "active",
        Profile.plan_started_at >= month_ago,
    ).count()

    activation_rate = round((active_users / total_users * 100), 1) if total_users > 0 else 0
    churn_rate = round((cancelled_users / (cancelled_users + active_users) * 100), 1) if (cancelled_users + active_users) > 0 else 0

    total_cands         = db.query(func.count(Candidature.id)).scalar()
    avg_cands_per_user  = round(total_cands / total_users, 1) if total_users > 0 else 0
    total_relances      = db.query(func.count(Relance.id)).scalar()
    total_etablissements = db.query(func.count(Etablissement.id)).scalar()

    active_users_7d = db.query(func.count(func.distinct(Candidature.user_id))).filter(
        Candidature.created_at >= week_ago,
    ).scalar()

    return {
        "mrr": mrr,
        "arr": arr,
        "total_users": total_users,
        "active_users": active_users,
        "pending_users": pending_users,
        "cancelled_users": cancelled_users,
        "new_users_7d": new_users_7d,
        "new_users_30d": new_users_30d,
        "new_active_30d": new_active_30d,
        "activation_rate": activation_rate,
        "churn_rate": churn_rate,
        "total_candidatures": total_cands,
        "avg_cands_per_user": avg_cands_per_user,
        "total_relances": total_relances,
        "total_etablissements": total_etablissements,
        "active_users_7d": active_users_7d,
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    profiles = db.query(Profile).order_by(Profile.created_at.desc()).all()
    result = []
    for profile in profiles:
        nb_cands = db.query(func.count(Candidature.id)).filter(
            Candidature.user_id == profile.id
        ).scalar()
        result.append({
            "id":                  profile.id,
            "email":               getattr(profile, "email", ""),
            "prenom":              profile.prenom,
            "nom":                 profile.nom,
            "subscription_status": profile.subscription_status,
            "role":                profile.role,
            "is_active":           profile.is_active,
            "nb_candidatures":     nb_cands,
            "created_at":          profile.created_at.isoformat() if profile.created_at else None,
            "plan_started_at":     profile.plan_started_at.isoformat() if profile.plan_started_at else None,
        })
    return result


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    body: dict,
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    new_status = body.get("subscription_status")
    if new_status not in ("pending", "active", "cancelled"):
        raise HTTPException(status_code=400, detail="Statut invalide")

    from src.services.subscription import activate_pro, _set_cancelled
    if new_status == "active":
        activate_pro(db, profile)
    elif new_status == "cancelled":
        _set_cancelled(db, profile)
    else:
        profile.subscription_status = "pending"
        db.commit()

    db.refresh(profile)
    return {"id": profile.id, "subscription_status": profile.subscription_status}


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Profile = Depends(get_admin_profile),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te modifier toi-même")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    profile.is_active = not profile.is_active
    db.commit()
    return {"id": profile.id, "is_active": profile.is_active}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Profile = Depends(get_admin_profile),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te désactiver toi-même")
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    profile.is_active = False
    db.commit()
    return {"message": "User désactivé"}


@router.get("/activity")
def recent_activity(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    new_users = db.query(Profile).order_by(Profile.created_at.desc()).limit(5).all()
    new_active = (
        db.query(Profile)
        .filter(Profile.subscription_status == "active", Profile.plan_started_at.isnot(None))
        .order_by(Profile.plan_started_at.desc())
        .limit(5)
        .all()
    )
    return {
        "new_users": [
            {
                "email": getattr(p, "email", None),
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in new_users
        ],
        "new_active": [
            {
                "email": getattr(p, "email", None),
                "plan_started_at": p.plan_started_at.isoformat() if p.plan_started_at else None,
            }
            for p in new_active
        ],
    }


@router.get("/export-users")
def export_users(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    profiles = db.query(Profile).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "subscription_status", "role", "is_active", "created_at", "plan_started_at"])
    for p in profiles:
        writer.writerow([
            p.id,
            getattr(p, "email", ""),
            p.subscription_status, p.role, p.is_active,
            p.created_at, p.plan_started_at,
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=offertrail-users.csv"},
    )


@router.post("/recompute-probite")
def recompute(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    from src.services.probite import recompute_probite_scores
    updated = recompute_probite_scores(db)
    return {"updated": updated}


# ── Analytics endpoints ──────────────────────────────────────────────────────

@router.get("/analytics/mrr-history")
def mrr_history(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """MRR des 12 derniers mois."""
    result = []
    today = datetime.utcnow()
    for i in range(11, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        active_count = db.query(Profile).filter(
            Profile.subscription_status == "active",
            Profile.plan_started_at < month_end,
        ).count()
        result.append({
            "month":        month_start.strftime("%Y-%m"),
            "mrr":          round(active_count * 14.99, 2),
            "active_users": active_count,
        })
    return result


@router.get("/analytics/signups")
def signups_history(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Inscriptions et activations par jour sur 30 jours."""
    today = datetime.utcnow()
    result = []
    for i in range(30, -1, -1):
        day       = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(Profile).filter(
            and_(Profile.created_at >= day_start, Profile.created_at < day_end)
        ).count()
        paid = db.query(Profile).filter(
            and_(Profile.plan_started_at >= day_start, Profile.plan_started_at < day_end)
        ).count()
        result.append({"date": day.strftime("%d/%m"), "signups": count, "paid": paid})
    return result


@router.get("/analytics/funnel")
def funnel(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Entonnoir d'acquisition."""
    total     = db.query(Profile).count()
    pending   = db.query(Profile).filter(Profile.subscription_status == "pending").count()
    active    = db.query(Profile).filter(Profile.subscription_status == "active").count()
    cancelled = db.query(Profile).filter(Profile.subscription_status == "cancelled").count()
    churn_rate = round((cancelled / (cancelled + active) * 100), 1) if (cancelled + active) > 0 else 0
    return {
        "total":           total,
        "pending":         pending,
        "active":          active,
        "cancelled":       cancelled,
        "churn_rate":      churn_rate,
        "activation_rate": round((active / total * 100), 1) if total > 0 else 0,
    }


@router.get("/analytics/candidatures-evolution")
def candidatures_evolution(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Candidatures créées par jour sur 30 jours."""
    today = datetime.utcnow()
    result = []
    for i in range(30, -1, -1):
        day       = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = db.query(Candidature).filter(
            and_(Candidature.created_at >= day_start, Candidature.created_at < day_end)
        ).count()
        result.append({"date": day.strftime("%d/%m"), "count": count})
    return result
