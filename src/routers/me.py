from datetime import date, datetime, time, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.auth import get_active_profile, get_active_user_id, own_candidature, get_visible_contacts
from src.database import get_db
from src.enums import CandidatureStatut, STATUTS_REPONSE_POSITIVE, STATUTS_CLOS, STATUTS_ACTIFS
from src.models import Candidature, Etablissement, Profile
from src.repositories import candidatures as candidatures_repo
from src.repositories import etablissements as etablissements_repo
from src.repositories import me as me_repo
from src.repositories import relances as relances_repo
from src.schemas.me import (
    CandidatureCreate,
    CandidatureSchema,
    EventSchema,
    MeStatsResponse,
    PaginatedCandidatures,
    PaginatedEtablissements,
    PaginatedContacts,
    PipelineBucket,
    RelanceSchema,
    TodayResponse,
    CompleteActionPayload,
    CandidatureStatusUpdate,
    NextActionCreate,
)
from src.services.subscription import (
    check_can_create_candidature,
    check_can_create_relance,
    has_plan_feature,
    history_cutoff,
)

router = APIRouter()


def _organization_summary(organization: Etablissement, candidatures: list[Candidature]) -> dict:
    responses = [item for item in candidatures if item.date_reponse is not None]
    positives = [item for item in candidatures if item.statut in STATUTS_REPONSE_POSITIVE]
    return {
        "id": organization.id,
        "name": organization.nom,
        "type": organization.type,
        "website": organization.site_web,
        "description": organization.description,
        "created_at": organization.created_at,
        "updated_at": max(
            [organization.updated_at, *[item.updated_at for item in candidatures]]
        ),
        "applications_count": len(candidatures),
        "responses_count": len(responses),
        "positive_count": len(positives),
        "response_rate": round(len(responses) / len(candidatures) * 100) if candidatures else 0,
    }


def _date_value(value: date | datetime) -> date:
    return value.date() if isinstance(value, datetime) else value


def _urgency(due_at: date | datetime, now: datetime) -> str:
    due_date = _date_value(due_at)
    if due_date < now.date():
        return "overdue"
    if due_date == now.date():
        return "today"
    return "upcoming"


@router.get("/today", response_model=TodayResponse)
def get_today(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> TodayResponse:
    now = datetime.now()
    relances = me_repo.list_open_relances(db, user_id)
    due = [item for item in relances if _date_value(item.date_prevue) <= now.date()]
    active = me_repo.count_candidatures_by_status(
        db, user_id, [status.value for status in STATUTS_ACTIFS]
    )
    period_start = now - timedelta(days=30)
    responses_30d = me_repo.count_responses_since(db, user_id, period_start)
    interviews_30d = me_repo.count_interview_events_since(
        db, user_id, CandidatureStatut.ENTRETIEN.value, period_start
    )
    actions = []
    for relance in due[:5]:
        candidature = relance.candidature
        organization = candidature.etablissement
        actions.append({
            "id": relance.id,
            "kind": "followup",
            "due_at": relance.date_prevue,
            "urgency": _urgency(relance.date_prevue, now),
            "application": {"id": candidature.id, "title": candidature.poste, "status": candidature.statut},
            "organization": {"id": organization.id, "name": organization.nom},
            "contact": None,
            "context": None,
        })
    total = me_repo.count_candidatures(db, user_id)
    return TodayResponse(
        generated_at=datetime.now(timezone.utc), timezone="Europe/Paris",
        activation={"state": "active" if total > 0 else "onboarding", "first_application_created": total > 0, "first_next_action_scheduled": bool(relances)},
        actions={"due_count": len(due), "items": actions, "next_due_at": relances[0].date_prevue if relances else None},
        summary={"active_applications": active, "responses_30d": responses_30d, "interviews_30d": interviews_30d},
        recent_activity=[],
    )


@router.post("/actions/{action_id}/complete")
def complete_action(
    action_id: str,
    payload: CompleteActionPayload,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
):
    relance = relances_repo.get_by_id_for_user(db, action_id, user_id)
    if relance is None:
        raise HTTPException(status_code=404, detail="Action introuvable")
    if relance.statut == "faite":
        raise HTTPException(status_code=409, detail="Action déjà réalisée")
    completed_at = payload.completed_at or datetime.now()
    event, created_next = me_repo.complete_relance(
        db, relance, completed_at, payload.note or payload.outcome, payload.next_action
    )
    remaining = me_repo.count_due_relances(db, user_id, datetime.combine(date.today(), time.max))
    return {"completed_action": {"id": relance.id, "status": "done"}, "created_event": {"id": event.id, "kind": "followup_completed"}, "next_action": ({"id": created_next.id, "due_at": created_next.date_prevue} if created_next else None), "today": {"remaining_due_count": remaining}}


@router.get("/etablissements", response_model=PaginatedEtablissements)
def list_my_etablissements(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=15, ge=1, le=50),
    q: str | None = None,
    relationship_role: str | None = None,
    sort: str = "recent",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> PaginatedEtablissements:
    organizations = me_repo.search_my_etablissements(db, user_id, q, relationship_role)
    rows = []
    for organization in organizations:
        candidatures = me_repo.list_candidatures_for_organization(db, user_id, organization.id)
        rows.append(_organization_summary(organization, candidatures))
    if sort == "name":
        rows.sort(key=lambda item: item["name"].casefold())
    elif sort == "applications":
        rows.sort(key=lambda item: (item["applications_count"], item["updated_at"]), reverse=True)
    else:
        rows.sort(key=lambda item: item["updated_at"], reverse=True)
    total = len(rows)
    return PaginatedEtablissements(
        items=rows[(page - 1) * per_page:page * per_page], total=total, page=page,
        per_page=per_page, pages=(total + per_page - 1) // per_page,
    )


@router.get("/contacts", response_model=PaginatedContacts)
def list_my_contacts(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=15, ge=1, le=50),
    q: str | None = None,
    view: str = "all",
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> PaginatedContacts:
    contacts = get_visible_contacts(db, user_id)
    needle = q.strip().casefold() if q and q.strip() else ""
    rows = []
    for contact in contacts:
        organization = contact.etablissement
        if needle and not any(needle in str(value or "").casefold() for value in (
            contact.prenom, contact.nom, contact.poste, contact.email_pro, organization.nom if organization else None,
        )):
            continue
        if view == "recruiters" and "recrut" not in (contact.poste or "").casefold():
            continue
        if view == "linked" and organization is None:
            continue
        if view == "unlinked" and organization is not None:
            continue
        rows.append({
            "id": contact.id,
            "first_name": contact.prenom,
            "last_name": contact.nom,
            "role": contact.poste,
            "email": contact.email_pro,
            "phone": None,
            "is_recruiter": "recrut" in (contact.poste or "").casefold(),
            "updated_at": contact.updated_at,
            "organization": ({"id": organization.id, "name": organization.nom, "type": organization.type} if organization else None),
        })
    rows.sort(key=lambda item: (item["updated_at"], item["last_name"]), reverse=True)
    total = len(rows)
    return PaginatedContacts(
        items=rows[(page - 1) * per_page:page * per_page], total=total, page=page,
        per_page=per_page, pages=(total + per_page - 1) // per_page,
    )
@router.get("/etablissements/{etablissement_id}/workspace")
def get_my_etablissement_workspace(
    etablissement_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
):
    organization = etablissements_repo.get_by_id(db, etablissement_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    candidatures = me_repo.list_candidatures_for_organization(db, user_id, etablissement_id)
    if not candidatures and organization.created_by != user_id:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    contacts = get_visible_contacts(db, user_id, etablissement_id=organization.id)
    events = (
        me_repo.list_recent_events_for_candidatures(
            db, user_id, [item.id for item in candidatures], limit=30
        )
        if candidatures else []
    )
    summary = _organization_summary(organization, candidatures)
    return {
        "organization": summary,
        "applications": [{
            "id": item.id,
            "title": item.poste,
            "status": item.statut,
            "applied_at": item.date_candidature,
            "updated_at": item.updated_at,
            "source": item.source,
        } for item in candidatures],
        "contacts": [{
            "id": item.id,
            "first_name": item.prenom,
            "last_name": item.nom,
            "role": item.poste,
            "email": item.email_pro,
            "linkedin_url": item.linkedin_url,
        } for item in contacts],
        "activity": [{
            "id": item.id,
            "application_id": item.candidature_id,
            "type": item.type,
            "content": item.contenu,
            "created_at": item.created_at,
        } for item in events],
        "capabilities": {"can_edit": organization.created_by == user_id or bool(candidatures)},
    }


@router.get("/candidatures", response_model=PaginatedCandidatures)
def list_my_candidatures(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    q: str | None = None,
    status: str | None = None,
    due: str | None = None,
    sort: str = "priority",
    include_closed: bool = False,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> PaginatedCandidatures:
    statuses = [item.strip() for item in status.split(",") if item.strip()] if status else None
    candidates = me_repo.search_my_candidatures(
        db,
        user_id,
        include_closed,
        [item.value for item in STATUTS_CLOS],
        statuses,
        q,
    )
    open_relances = me_repo.list_open_relances(db, user_id)
    next_by_candidate = {}
    for relance in open_relances:
        next_by_candidate.setdefault(relance.candidature_id, relance)
    today = date.today()
    if due:
        def matches(item):
            action = next_by_candidate.get(item.id)
            if due == "none": return action is None
            if action is None: return False
            action_date = _date_value(action.date_prevue)
            if due == "overdue": return action_date < today
            if due == "today": return action_date == today
            if due == "week": return today <= action_date <= today.fromordinal(today.toordinal() + 7)
            return True
        candidates = [item for item in candidates if matches(item)]
    if sort == "priority":
        candidates.sort(key=lambda item: (_date_value(next_by_candidate[item.id].date_prevue) if item.id in next_by_candidate else date.max, item.updated_at), reverse=False)
    elif sort == "applied_at":
        candidates.sort(key=lambda item: item.date_candidature or datetime.min, reverse=True)
    elif sort == "created_at":
        candidates.sort(key=lambda item: item.created_at, reverse=True)
    else:
        candidates.sort(key=lambda item: item.updated_at, reverse=True)
    total = len(candidates)
    items = candidates[(page - 1) * per_page:page * per_page]
    mapped = []
    for item in items:
        action = next_by_candidate.get(item.id)
        last_event = item.events[-1] if item.events else None
        mapped.append({
            **CandidatureSchema.model_validate(item).model_dump(),
            "organization": {"id": item.etablissement.id, "name": item.etablissement.nom},
            "next_action": ({"id": action.id, "kind": "followup", "due_at": action.date_prevue, "urgency": _urgency(action.date_prevue, datetime.now())} if action else None),
            "last_event": ({"kind": last_event.type, "occurred_at": last_event.created_at} if last_event else None),
        })
    return PaginatedCandidatures(
        items=mapped,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page,
    )


@router.get("/candidatures/{candidature_id}/workspace")
def get_candidature_workspace(
    candidature: Candidature = Depends(own_candidature),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
    profile: Profile = Depends(get_active_profile),
):
    organization = candidature.etablissement
    final_customer = candidature.client_final
    related = me_repo.list_related_candidatures(db, user_id, organization.id)
    contacts = get_visible_contacts(db, user_id, etablissement_id=organization.id)
    actions = me_repo.list_open_relances_for_candidature(db, user_id, candidature.id)
    timeline_enabled = has_plan_feature(profile, "timeline")
    cutoff = history_cutoff(profile)
    timeline_events = [
        event for event in reversed(candidature.events)
        if cutoff is None or event.created_at >= cutoff
    ] if timeline_enabled else []
    return {
        "application": CandidatureSchema.model_validate(candidature).model_dump(),
        "organization": {
            "id": organization.id, "name": organization.nom, "type": organization.type,
            "website": organization.site_web, "description": organization.description,
            "relationship_summary": {"applications": len(related), "responses": len([item for item in related if item.date_reponse is not None])},
        },
        "final_customer": ({"id": final_customer.id, "name": final_customer.nom} if final_customer else None),
        "contacts": [{"id": item.id, "first_name": item.prenom, "last_name": item.nom, "role": item.poste, "email": item.email_pro, "linkedin_url": item.linkedin_url} for item in contacts],
        "next_action": ({"id": actions[0].id, "kind": "followup", "due_at": actions[0].date_prevue, "channel": actions[0].canal} if actions else None),
        "future_actions": [{"id": item.id, "due_at": item.date_prevue, "channel": item.canal} for item in actions[1:]],
        "timeline": {"items": [EventSchema.model_validate(item).model_dump() for item in timeline_events], "next_cursor": None},
        "capabilities": {"can_update": True, "can_delete": True, "can_create_followup": True, "timeline": timeline_enabled},
    }


@router.patch("/candidatures/{candidature_id}/status")
def update_candidature_status(
    payload: CandidatureStatusUpdate,
    candidature: Candidature = Depends(own_candidature),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
):
    allowed = {item.value for item in CandidatureStatut}
    if payload.status not in allowed:
        raise HTTPException(status_code=422, detail="Statut invalide")
    old_status = candidature.statut
    if old_status == payload.status:
        return {"id": candidature.id, "status": candidature.statut, "cancelled_actions": 0}
    candidature.statut = payload.status
    cancelled = 0
    if payload.status in {item.value for item in STATUTS_CLOS}:
        cancelled = me_repo.cancel_open_actions_for_candidature(db, user_id, candidature.id)
    me_repo.record_status_change(
        db, candidature.id, user_id, old_status, payload.status,
        f"Statut : {old_status} → {payload.status}",
    )
    return {"id": candidature.id, "status": candidature.statut, "cancelled_actions": cancelled}


@router.post("/candidatures/{candidature_id}/actions", status_code=201)
def schedule_candidature_action(
    payload: NextActionCreate,
    candidature: Candidature = Depends(own_candidature),
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
):
    check_can_create_relance(db, profile)
    if candidature.statut in {item.value for item in STATUTS_CLOS}:
        raise HTTPException(status_code=409, detail="Une candidature refusée ne peut pas recevoir de nouvelle action")
    action = me_repo.schedule_action(
        db, candidature.id, profile.id, payload.due_at, payload.channel, payload.note
    )
    return {"id": action.id, "due_at": action.date_prevue, "channel": action.canal, "status": action.statut}


@router.post("/candidatures", response_model=CandidatureSchema, status_code=201)
def create_my_candidature(
    payload: CandidatureCreate,
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> CandidatureSchema:
    user_id = profile.id
    check_can_create_candidature(db, profile)

    etablissement = etablissements_repo.get_by_id(db, payload.etablissement_id)
    if etablissement is None:
        raise HTTPException(status_code=404, detail="Etablissement introuvable")
    if payload.client_final_id:
        client_final = etablissements_repo.get_by_id(db, payload.client_final_id)
        if client_final is None:
            raise HTTPException(status_code=404, detail="Client final introuvable")
        if client_final.id == etablissement.id:
            raise HTTPException(status_code=422, detail="Le recruteur et le client final doivent être distincts")

    candidature = me_repo.create_candidature(db, payload.model_dump(), user_id)
    return CandidatureSchema.model_validate(candidature)


@router.get("/candidatures/{candidature_id}", response_model=CandidatureSchema)
def get_my_candidature(candidature: Candidature = Depends(own_candidature)) -> CandidatureSchema:
    return CandidatureSchema.model_validate(candidature)


@router.get("/candidatures/{candidature_id}/history", response_model=list[EventSchema])
def get_my_candidature_history(
    candidature: Candidature = Depends(own_candidature),
    db: Session = Depends(get_db),
    profile: Profile = Depends(get_active_profile),
) -> list[EventSchema]:
    cutoff = history_cutoff(profile)
    events = me_repo.list_candidature_history(db, candidature.id, cutoff)
    return [EventSchema.model_validate(event) for event in events]


@router.get("/stats", response_model=MeStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> MeStatsResponse:
    candidatures = candidatures_repo.list_for_user(db, user_id)
    total = len(candidatures)
    due_relances = me_repo.count_due_relances(db, user_id, datetime.combine(date.today(), time.max))
    if total == 0:
        return MeStatsResponse(
            total_candidatures=0,
            pipeline_actif=0,
            taux_refus=0,
            temps_moyen_reponse=None,
            delai_moyen_reponse=None,
            taux_reponse=0,
            relances_dues=0,
        )

    envoyees = [cand for cand in candidatures if cand.statut != CandidatureStatut.EN_ATTENTE or cand.date_candidature is not None]
    total_envoyees = len(envoyees)
    refus = [cand for cand in candidatures if cand.statut == CandidatureStatut.REFUSEE]
    repondues = [
        cand
        for cand in candidatures
        if cand.date_reponse is not None or cand.statut in STATUTS_REPONSE_POSITIVE
    ]
    pipeline_actif = len([cand for cand in candidatures if cand.statut in STATUTS_ACTIFS])
    delais = [
        (cand.date_reponse - cand.date_candidature).days
        for cand in repondues
        if cand.date_candidature is not None and cand.date_reponse is not None
    ]
    avg_response = round(sum(delais) / len(delais), 2) if delais else None

    return MeStatsResponse(
        total_candidatures=total,
        pipeline_actif=pipeline_actif,
        taux_refus=round(len(refus) / total_envoyees * 100, 2) if total_envoyees else 0,
        temps_moyen_reponse=avg_response,
        delai_moyen_reponse=avg_response,
        taux_reponse=round(len(repondues) / total_envoyees * 100, 2) if total_envoyees else 0,
        relances_dues=due_relances,
    )


@router.get("/relances/dues", response_model=list[RelanceSchema])
def get_due_relances(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[RelanceSchema]:
    today_end = datetime.combine(date.today(), time.max)
    relances = me_repo.list_due_relances(db, user_id, today_end)
    return [RelanceSchema.model_validate(relance) for relance in relances]


@router.get("/pipeline", response_model=list[PipelineBucket])
def get_pipeline(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_active_user_id),
) -> list[PipelineBucket]:
    rows = me_repo.pipeline_counts(db, user_id)
    return [PipelineBucket(statut=statut, count=count) for statut, count in rows]
