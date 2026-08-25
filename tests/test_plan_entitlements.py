"""Vérifie que les capacités payantes suivent le catalogue des plans."""

from src.database import SessionLocal
import pytest

from src.models import Profile
from src.services.subscription import get_effective_plan


def _set_plan(user_id: str, plan: str, status: str) -> None:
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_id).one()
        profile.plan = plan
        profile.subscription_status = status
        db.commit()
    finally:
        db.close()


def test_import_is_restricted_to_paid_plans(client, user_a):
    _set_plan(user_a["user_id"], "free", "pending")

    response = client.post(
        "/api/import",
        headers=user_a["headers"],
        json={"tsv": "Entreprise\tPoste\nAcme\tDesigner"},
    )

    assert response.status_code == 402
    assert response.json()["detail"]["code"] == "FEATURE_NOT_INCLUDED"
    assert response.json()["detail"]["feature"] == "import_csv"


def test_pro_timeline_is_not_exposed_when_not_included(client, user_a, ets):
    _set_plan(user_a["user_id"], "pro", "active")
    created = client.post(
        "/candidatures",
        headers=user_a["headers"],
        json={"etablissement_id": ets["id"], "poste": "Designer"},
    )
    assert created.status_code == 201

    response = client.get(
        f"/me/candidatures/{created.json()['id']}/workspace",
        headers=user_a["headers"],
    )

    assert response.status_code == 200
    assert response.json()["capabilities"]["timeline"] is False
    assert response.json()["timeline"]["items"] == []


@pytest.mark.parametrize("status", ["pending", "cancelled", "past_due", "unpaid", "incomplete"])
@pytest.mark.parametrize("stored_plan", ["pro", "ultimate"])
def test_paid_plan_is_not_effective_for_ineligible_status(status, stored_plan):
    profile = Profile(plan=stored_plan, subscription_status=status)

    assert get_effective_plan(profile) == "free"


@pytest.mark.parametrize("status", ["active", "trialing"])
def test_paid_plan_is_effective_for_eligible_status(status):
    profile = Profile(plan="ultimate", subscription_status=status)

    assert get_effective_plan(profile) == "ultimate"
