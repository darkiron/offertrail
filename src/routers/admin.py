import csv
import io
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func
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

    total_users = db.query(Profile).count()
    pro_users = db.query(Profile).filter(Profile.plan == "pro").count()
    free_users = total_users - pro_users

    mrr = round(pro_users * 14.99, 2)
    arr = round(mrr * 12, 2)

    new_users_7d = db.query(Profile).filter(Profile.created_at >= week_ago).count()
    new_users_30d = db.query(Profile).filter(Profile.created_at >= month_ago).count()
    new_pro_30d = db.query(Profile).filter(
        Profile.plan == "pro",
        Profile.plan_started_at >= month_ago,
    ).count()

    conversion_rate = round((pro_users / total_users * 100), 1) if total_users > 0 else 0

    total_cands = db.query(func.count(Candidature.id)).scalar()
    avg_cands_per_user = round(total_cands / total_users, 1) if total_users > 0 else 0
    total_relances = db.query(func.count(Relance.id)).scalar()
    total_etablissements = db.query(func.count(Etablissement.id)).scalar()

    active_users_7d = db.query(func.count(func.distinct(Candidature.user_id))).filter(
        Candidature.created_at >= week_ago,
    ).scalar()

    churn_rate_30d = 0.0

    return {
        "mrr": mrr,
        "arr": arr,
        "total_users": total_users,
        "pro_users": pro_users,
        "free_users": free_users,
        "new_users_7d": new_users_7d,
        "new_users_30d": new_users_30d,
        "new_pro_30d": new_pro_30d,
        "conversion_rate": conversion_rate,
        "churn_rate_30d": churn_rate_30d,
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
            "id":              profile.id,
            "email":           getattr(profile, "email", ""),
            "prenom":          profile.prenom,
            "nom":             profile.nom,
            "plan":            profile.plan,
            "role":            profile.role,
            "is_active":       profile.is_active,
            "nb_candidatures": nb_cands,
            "created_at":      profile.created_at.isoformat() if profile.created_at else None,
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
    profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    new_plan = body.get("plan")
    if new_plan not in ("free", "pro"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    from src.services.subscription import activate_plan
    activate_plan(db, profile, new_plan)
    db.refresh(profile)
    return {"id": profile.id, "plan": profile.plan}


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
    new_pro = (
        db.query(Profile)
        .filter(Profile.plan == "pro", Profile.plan_started_at.isnot(None))
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
        "new_pro": [
            {
                "email": getattr(p, "email", None),
                "plan_started_at": p.plan_started_at.isoformat() if p.plan_started_at else None,
            }
            for p in new_pro
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
    writer.writerow(["id", "email", "plan", "role", "is_active", "created_at", "plan_started_at"])
    for p in profiles:
        writer.writerow([
            p.id,
            getattr(p, "email", ""),
            p.plan, p.role, p.is_active,
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


@router.get("/chart/mrr-evolution")
def mrr_evolution(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    today = datetime.utcnow().date()
    result = []
    for i in range(90, -1, -1):
        day = today - timedelta(days=i)
        cutoff = datetime.combine(day, datetime.max.time())
        pro_count = db.query(Profile).filter(
            Profile.plan == "pro",
            Profile.plan_started_at <= cutoff,
        ).count()
        result.append({"date": day.isoformat(), "mrr": round(pro_count * 14.99, 2)})
    return result


@router.get("/chart/users-growth")
def users_growth(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    today = datetime.utcnow().date()
    result = []
    for i in range(30, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(Profile).filter(
            Profile.created_at >= day_start,
            Profile.created_at <= day_end,
        ).count()
        result.append({"date": day.isoformat(), "signups": count})
    return result


@router.get("/chart/candidatures-activity")
def candidatures_activity(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    today = datetime.utcnow().date()
    result = []
    for i in range(30, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        count = db.query(Candidature).filter(
            Candidature.created_at >= day_start,
            Candidature.created_at <= day_end,
        ).count()
        result.append({"date": day.isoformat(), "candidatures": count})
    return result


@router.get("/chart/plan-distribution")
def plan_distribution(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    free = db.query(Profile).filter(Profile.plan == "free").count()
    pro = db.query(Profile).filter(Profile.plan == "pro").count()
    return [
        {"plan": "Gratuit", "count": free, "color": "#868e96"},
        {"plan": "Pro", "count": pro, "color": "#12b886"},
    ]


@router.get("/top-etablissements")
def top_etablissements(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    results = db.query(
        Etablissement.nom,
        func.count(Candidature.id).label("total"),
    ).join(
        Candidature, Candidature.etablissement_id == Etablissement.id,
    ).group_by(Etablissement.id, Etablissement.nom).order_by(
        func.count(Candidature.id).desc(),
    ).limit(10).all()
    return [{"nom": r[0], "total": r[1]} for r in results]
