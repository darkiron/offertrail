"""Tests supplémentaires pour subscription.py — couverture des branches manquantes."""
import json
from unittest.mock import MagicMock, patch
from uuid import uuid4

import stripe

from src.database import SessionLocal
from src.models import Profile
from src.routers.subscription import _find_profile_for_subscription_event, _s
from tests.conftest import make_token


# ── _s helper ────────────────────────────────────────────────────────────────

def test_s_with_none():
    assert _s(None, "key") is None


def test_s_with_dict():
    assert _s({"key": "value"}, "key") == "value"
    assert _s({"key": "val"}, "other", "default") == "default"


def test_s_with_object():
    obj = MagicMock()
    obj.key = "value"
    assert _s(obj, "key") == "value"


def test_s_with_missing_attribute():
    obj = MagicMock(spec=[])
    result = _s(obj, "missing_key", "default")
    assert result == "default"


# ── _find_profile_for_subscription_event ─────────────────────────────────────

def test_find_profile_by_user_id(user_a):
    db = SessionLocal()
    try:
        sub_data = {"metadata": {"user_id": user_a["user_id"]}, "customer": None}
        profile = _find_profile_for_subscription_event(db, sub_data)
        assert profile is not None
        assert profile.id == user_a["user_id"]
    finally:
        db.close()


def test_find_profile_by_customer_id(user_a):
    db = SessionLocal()
    try:
        profile_db = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        profile_db.stripe_customer_id = "cus_test123"
        db.commit()

        sub_data = {"metadata": {}, "customer": "cus_test123"}
        profile = _find_profile_for_subscription_event(db, sub_data)
        assert profile is not None
        assert profile.id == user_a["user_id"]
    finally:
        db.close()


def test_find_profile_not_found():
    db = SessionLocal()
    try:
        sub_data = {"metadata": {}, "customer": None}
        profile = _find_profile_for_subscription_event(db, sub_data)
        assert profile is None
    finally:
        db.close()


# ── /subscription/checkout ───────────────────────────────────────────────────

def test_checkout_simulated_no_stripe(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=False):
        resp = client.post("/subscription/checkout", headers=user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["mode"] == "simulated"


def test_checkout_with_stripe_no_email(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=True):
        from jose import jwt as jose_jwt
        from tests.conftest import TEST_JWT_SECRET
        payload = {"sub": user_a["user_id"]}
        token = jose_jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
        resp = client.post(
            "/subscription/checkout",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code in (400, 402, 403)


def test_checkout_with_stripe_success(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=True), \
         patch("src.routers.subscription.create_checkout_session", return_value="https://stripe.com/pay"):
        from jose import jwt as jose_jwt
        from tests.conftest import TEST_JWT_SECRET
        payload = {"sub": user_a["user_id"], "email": "test@example.com"}
        token = jose_jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
        resp = client.post(
            "/subscription/checkout",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 200
    assert resp.json()["mode"] == "stripe"
    assert resp.json()["checkout_url"] == "https://stripe.com/pay"


def test_checkout_with_stripe_error(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=True), \
         patch("src.routers.subscription.create_checkout_session", side_effect=stripe.StripeError("err")):
        from jose import jwt as jose_jwt
        from tests.conftest import TEST_JWT_SECRET
        payload = {"sub": user_a["user_id"], "email": "test@example.com"}
        token = jose_jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
        resp = client.post(
            "/subscription/checkout",
            headers={"Authorization": f"Bearer {token}"},
        )
    assert resp.status_code == 502


# ── /subscription/portal ─────────────────────────────────────────────────────

def test_portal_stripe_not_configured(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=False):
        resp = client.post("/subscription/portal", headers=user_a["headers"])
    assert resp.status_code == 400


def test_portal_no_customer_id(client, user_a):
    with patch("src.routers.subscription.is_configured", return_value=True):
        resp = client.post("/subscription/portal", headers=user_a["headers"])
    assert resp.status_code == 400


def test_portal_success(client, user_a):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        profile.stripe_customer_id = "cus_portal123"
        db.commit()
    finally:
        db.close()

    mock_session = MagicMock()
    mock_session.url = "https://billing.stripe.com/portal"
    with patch("src.routers.subscription.is_configured", return_value=True), \
         patch("stripe.billing_portal.Session.create", return_value=mock_session):
        resp = client.post("/subscription/portal", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json()["portal_url"] == "https://billing.stripe.com/portal"


def test_portal_stripe_error(client, user_a):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        profile.stripe_customer_id = "cus_portal_error"
        db.commit()
    finally:
        db.close()

    err = stripe.error.StripeError("Card declined")
    with patch("src.routers.subscription.is_configured", return_value=True), \
         patch("stripe.billing_portal.Session.create", side_effect=err):
        resp = client.post("/subscription/portal", headers=user_a["headers"])
    assert resp.status_code == 502


# ── /subscription/webhook ────────────────────────────────────────────────────

def _post_webhook(client, event_data: dict):
    event_str = json.dumps(event_data)
    with patch("src.routers.subscription.verify_webhook_signature", return_value=event_data):
        resp = client.post(
            "/subscription/webhook",
            content=event_str.encode(),
            headers={"content-type": "application/json", "stripe-signature": "fake"},
        )
    return resp


def test_webhook_invalid_signature(client):
    with patch("src.routers.subscription.verify_webhook_signature", side_effect=stripe.StripeError("bad sig")):
        resp = client.post(
            "/subscription/webhook",
            content=b"{}",
            headers={"content-type": "application/json", "stripe-signature": "bad"},
        )
    assert resp.status_code == 400


def test_webhook_subscription_created_active(client, user_a):
    event = {
        "type": "customer.subscription.created",
        "data": {
            "object": {
                "metadata": {"user_id": user_a["user_id"]},
                "customer": "cus_new",
                "id": "sub_new",
                "status": "active",
            }
        },
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_webhook_subscription_updated_cancelled(client, user_a):
    event = {
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "metadata": {"user_id": user_a["user_id"]},
                "customer": "cus_upd",
                "id": "sub_upd",
                "status": "past_due",
            }
        },
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200


def test_webhook_subscription_deleted(client, user_a):
    event = {
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "metadata": {"user_id": user_a["user_id"]},
                "customer": "cus_del",
            }
        },
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200


def test_webhook_invoice_payment_failed(client, user_a):
    event = {
        "type": "invoice.payment_failed",
        "data": {
            "object": {
                "metadata": {"user_id": user_a["user_id"]},
                "customer": "cus_fail",
            }
        },
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200


def test_webhook_unknown_event(client):
    event = {
        "type": "unknown.event",
        "data": {"object": {}},
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200


def test_webhook_checkout_completed_no_user(client):
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "metadata": {},
                "client_reference_id": None,
                "customer": None,
                "subscription": None,
            }
        },
    }
    resp = _post_webhook(client, event)
    assert resp.status_code == 200
