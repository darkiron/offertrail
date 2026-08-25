import csv
import io
from datetime import datetime, timedelta, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.auth import get_admin_profile
from src.database import get_db
from src.models import Profile
from src.repositories import admin as admin_repo
from src.services.stripe_service import is_configured

router = APIRouter(prefix="/admin", tags=["admin"])


PLAN_PRICES = {
    ("pro", "monthly"): 9.99,
    ("pro", "yearly"): 99 / 12,
    ("ultimate", "monthly"): 14.99,
    ("ultimate", "yearly"): 149 / 12,
}


def _profile_mrr(profile: Profile) -> float:
    if profile.plan not in ("pro", "ultimate"):
        return 0
    return PLAN_PRICES.get((profile.plan, profile.billing_period or "monthly"), 0)


@router.get("/stats")
def global_stats(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    profiles = admin_repo.list_all_profiles(db)
    total_users = len(profiles)
    free_users = sum(1 for p in profiles if (p.plan or "free") == "free")
    pro_users = sum(1 for p in profiles if p.plan == "pro")
    ultimate_users = sum(1 for p in profiles if p.plan == "ultimate")
    active_users = pro_users + ultimate_users

    mrr = round(sum(_profile_mrr(p) for p in profiles), 2)
    arr = round(mrr * 12, 2)

    new_users_7d  = admin_repo.count_profiles_created_since(db, week_ago)
    new_users_30d = admin_repo.count_profiles_created_since(db, month_ago)
    conversion_rate = round((active_users / total_users * 100), 1) if total_users > 0 else 0

    total_cands         = admin_repo.count_candidatures(db)
    avg_cands_per_user  = round(total_cands / total_users, 1) if total_users > 0 else 0
    total_relances      = admin_repo.count_relances(db)
    total_etablissements = admin_repo.count_etablissements(db)

    active_users_7d = admin_repo.count_active_users_since(db, week_ago)

    return {
        "mrr": mrr,
        "arr": arr,
        "total_users": total_users,
        "free_users": free_users,
        "pro_users": pro_users,
        "ultimate_users": ultimate_users,
        "active_users": active_users,
        "new_users_7d": new_users_7d,
        "new_users_30d": new_users_30d,
        "conversion_rate": conversion_rate,
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
    profiles = admin_repo.list_profiles_ordered_by_created_at(db)
    result = []
    for profile in profiles:
        nb_cands = admin_repo.count_candidatures_for_user(db, profile.id)
        result.append({
            "id":                  profile.id,
            "email":               getattr(profile, "email", ""),
            "prenom":              profile.prenom,
            "nom":                 profile.nom,
            "subscription_status": profile.subscription_status,
            "plan":                profile.plan or "free",
            "billing_period":      profile.billing_period,
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
    profile = admin_repo.get_profile_by_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")

    new_status = body.get("subscription_status")
    new_plan = body.get("plan")
    billing_period = body.get("billing_period") or "monthly"

    from src.services.subscription import _set_cancelled, activate_plan
    if new_plan:
        if new_plan not in ("free", "pro", "ultimate"):
            raise HTTPException(status_code=400, detail="Plan invalide")
        if new_plan == "free":
            _set_cancelled(db, profile)
        else:
            activate_plan(db, profile, new_plan, billing_period)
    elif new_status == "active":
        activate_plan(db, profile, "pro", billing_period)
    elif new_status == "cancelled":
        _set_cancelled(db, profile)
    elif new_status == "pending":
        admin_repo.set_pending(db, profile)
    else:
        raise HTTPException(status_code=400, detail="Statut invalide")

    db.refresh(profile)
    return {
        "id": profile.id,
        "subscription_status": profile.subscription_status,
        "plan": profile.plan,
        "billing_period": profile.billing_period,
    }


@router.patch("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Profile = Depends(get_admin_profile),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te modifier toi-même")
    profile = admin_repo.get_profile_by_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    is_active = admin_repo.toggle_active(db, profile)
    return {"id": profile.id, "is_active": is_active}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: Profile = Depends(get_admin_profile),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te désactiver toi-même")
    profile = admin_repo.get_profile_by_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    admin_repo.deactivate(db, profile)
    return {"message": "User désactivé"}


@router.get("/activity")
def recent_activity(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    new_users = admin_repo.list_recent_signups(db, limit=5)
    new_active = admin_repo.list_recent_activations(db, limit=5)
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


@router.get("/promos")
def list_promos(_: Profile = Depends(get_admin_profile)):
    if not is_configured():
        return {"promos": []}
    coupons = stripe.Coupon.list(limit=20)
    return {"promos": [{
        "id": c.id,
        "name": c.name,
        "percent_off": c.percent_off,
        "amount_off": c.amount_off,
        "duration": c.duration,
        "times_redeemed": c.times_redeemed,
        "valid": c.valid,
    } for c in coupons.data]}


@router.get("/export-users")
def export_users(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    profiles = admin_repo.list_all_profiles(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "email", "plan", "billing_period", "subscription_status", "role", "is_active", "created_at", "plan_started_at"])
    for p in profiles:
        writer.writerow([
            p.id,
            getattr(p, "email", ""),
            p.plan or "free", p.billing_period,
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
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    for i in range(11, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        month_end   = (month_start + timedelta(days=32)).replace(day=1)
        active_profiles = admin_repo.list_active_plan_profiles_before(db, month_end)
        result.append({
            "month":        month_start.strftime("%Y-%m"),
            "mrr":          round(sum(_profile_mrr(p) for p in active_profiles), 2),
            "active_users": len(active_profiles),
        })
    return result


@router.get("/analytics/signups")
def signups_history(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Inscriptions et activations par jour sur 30 jours."""
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    result = []
    for i in range(30, -1, -1):
        day       = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = admin_repo.count_profiles_created_between(db, day_start, day_end)
        upgrades = admin_repo.count_plan_upgrades_between(db, day_start, day_end)
        result.append({"date": day.strftime("%d/%m"), "signups": count, "upgrades": upgrades})
    return result


@router.get("/analytics/plan-distribution")
def plan_distribution(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    return [
        {"name": "Free", "plan": "free", "value": admin_repo.count_profiles_by_plan(db, "free")},
        {"name": "Pro", "plan": "pro", "value": admin_repo.count_profiles_by_plan(db, "pro")},
        {"name": "Ultimate", "plan": "ultimate", "value": admin_repo.count_profiles_by_plan(db, "ultimate")},
    ]


@router.get("/analytics/funnel")
def funnel(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    """Entonnoir d'acquisition."""
    total     = admin_repo.count_all_profiles(db)
    pending   = admin_repo.count_profiles_by_subscription_status(db, "pending")
    active    = admin_repo.count_profiles_by_subscription_status(db, "active")
    cancelled = admin_repo.count_profiles_by_subscription_status(db, "cancelled")
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
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    result = []
    for i in range(30, -1, -1):
        day       = today - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end   = day_start + timedelta(days=1)
        count = admin_repo.count_candidatures_created_between(db, day_start, day_end)
        result.append({"date": day.strftime("%d/%m"), "count": count})
    return result


@router.get("/analytics/candidatures-daily")
def candidatures_daily(
    db: Session = Depends(get_db),
    _: Profile = Depends(get_admin_profile),
):
    return candidatures_evolution(db, _)
