"""Tests pour /admin — couverture complète du router admin."""
from uuid import uuid4

import pytest

from src.database import SessionLocal
from src.models import Profile
from tests.conftest import make_token


@pytest.fixture()
def admin_user(client):
    user_id = str(uuid4())
    email = f"admin-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            prenom="Admin",
            nom="User",
            subscription_status="active",
            is_active=True,
            role="admin",
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()
    token = make_token(user_id, email)
    return {
        "email": email,
        "token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def test_admin_stats(client, admin_user):
    resp = client.get("/admin/stats", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "mrr" in data
    assert "total_users" in data
    assert "active_users" in data


def test_admin_stats_forbidden_for_regular_user(client, user_a):
    resp = client.get("/admin/stats", headers=user_a["headers"])
    assert resp.status_code == 403


def test_admin_list_users(client, admin_user, user_a):
    resp = client.get("/admin/users", headers=admin_user["headers"])
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    user_ids = [u["id"] for u in resp.json()]
    assert admin_user["user_id"] in user_ids


def test_admin_list_users_forbidden(client, user_a):
    resp = client.get("/admin/users", headers=user_a["headers"])
    assert resp.status_code == 403


def test_admin_update_user_status_active(client, admin_user, user_a):
    resp = client.patch(
        f"/admin/users/{user_a['user_id']}/status",
        headers=admin_user["headers"],
        json={"subscription_status": "active"},
    )
    assert resp.status_code == 200
    assert resp.json()["subscription_status"] == "active"


def test_admin_update_user_status_cancelled(client, admin_user, user_a):
    resp = client.patch(
        f"/admin/users/{user_a['user_id']}/status",
        headers=admin_user["headers"],
        json={"subscription_status": "cancelled"},
    )
    assert resp.status_code == 200
    assert resp.json()["subscription_status"] == "cancelled"


def test_admin_update_user_status_pending(client, admin_user, user_a):
    resp = client.patch(
        f"/admin/users/{user_a['user_id']}/status",
        headers=admin_user["headers"],
        json={"subscription_status": "pending"},
    )
    assert resp.status_code == 200
    assert resp.json()["subscription_status"] == "pending"


def test_admin_update_user_status_invalid(client, admin_user, user_a):
    resp = client.patch(
        f"/admin/users/{user_a['user_id']}/status",
        headers=admin_user["headers"],
        json={"subscription_status": "invalid_status"},
    )
    assert resp.status_code == 400


def test_admin_update_user_status_not_found(client, admin_user):
    resp = client.patch(
        f"/admin/users/{uuid4()}/status",
        headers=admin_user["headers"],
        json={"subscription_status": "active"},
    )
    assert resp.status_code == 404


def test_admin_toggle_active(client, admin_user, user_a):
    resp = client.patch(
        f"/admin/users/{user_a['user_id']}/toggle-active",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "is_active" in data


def test_admin_toggle_active_self_forbidden(client, admin_user):
    resp = client.patch(
        f"/admin/users/{admin_user['user_id']}/toggle-active",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 400


def test_admin_toggle_active_not_found(client, admin_user):
    resp = client.patch(
        f"/admin/users/{uuid4()}/toggle-active",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 404


def test_admin_deactivate_user(client, admin_user, user_a):
    resp = client.delete(
        f"/admin/users/{user_a['user_id']}",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 200
    assert "désactivé" in resp.json()["message"]


def test_admin_deactivate_self_forbidden(client, admin_user):
    resp = client.delete(
        f"/admin/users/{admin_user['user_id']}",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 400


def test_admin_deactivate_not_found(client, admin_user):
    resp = client.delete(
        f"/admin/users/{uuid4()}",
        headers=admin_user["headers"],
    )
    assert resp.status_code == 404


def test_admin_activity(client, admin_user):
    resp = client.get("/admin/activity", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "new_users" in data
    assert "new_active" in data


def test_admin_export_users(client, admin_user):
    resp = client.get("/admin/export-users", headers=admin_user["headers"])
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")


def test_admin_recompute_probite(client, admin_user):
    resp = client.post("/admin/recompute-probite", headers=admin_user["headers"])
    assert resp.status_code == 200
    assert "updated" in resp.json()


def test_admin_mrr_history(client, admin_user):
    resp = client.get("/admin/analytics/mrr-history", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 12
    assert "month" in data[0]
    assert "mrr" in data[0]


def test_admin_signups_history(client, admin_user):
    resp = client.get("/admin/analytics/signups", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 31
    assert "date" in data[0]
    assert "signups" in data[0]


def test_admin_funnel(client, admin_user):
    resp = client.get("/admin/analytics/funnel", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "active" in data
    assert "churn_rate" in data


def test_admin_candidatures_evolution(client, admin_user):
    resp = client.get("/admin/analytics/candidatures-evolution", headers=admin_user["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) == 31
    assert "date" in data[0]
    assert "count" in data[0]
