import stripe

from src.auth import get_current_profile
from src.database import SessionLocal
from src.models import Profile


def test_get_subscription_me(client, user_a):
    response = client.get("/subscription/me", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["subscription_status"] == "active"
    assert payload["is_active"] is True


def test_get_subscription_pending_user(client):
    """Un utilisateur pending peut lire son statut mais est bloqué ailleurs."""
    from uuid import uuid4
    from tests.conftest import make_token

    user_id = str(uuid4())
    email = f"pending-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        profile = Profile(id=user_id, prenom="Pending", nom="User",
                          subscription_status="pending", is_active=True)
        db.add(profile)
        db.commit()
    finally:
        db.close()

    token = make_token(user_id, email)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.get("/subscription/me", headers=headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["subscription_status"] == "pending"
    assert payload["is_active"] is False


def test_upgrade_to_pro(client, user_a, monkeypatch):
    # Force subscription_status à pending pour tester l'upgrade
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        profile.subscription_status = "pending"
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr("src.routers.subscription.is_configured", lambda: False)
    response = client.post("/subscription/checkout", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "simulated"

    me = client.get("/subscription/me", headers=user_a["headers"])
    assert me.json()["subscription_status"] == "active"
    assert me.json()["is_active"] is True


def test_checkout_returns_stripe_url_when_configured(client, user_a, monkeypatch):
    monkeypatch.setattr("src.routers.subscription.is_configured", lambda: True)
    monkeypatch.setattr(
        "src.routers.subscription.create_checkout_session",
        lambda user_id, user_email, stripe_customer_id=None: "https://checkout.stripe.test/session",
    )

    response = client.post("/subscription/checkout", headers=user_a["headers"])

    assert response.status_code == 200
    assert response.json() == {
        "mode": "stripe",
        "checkout_url": "https://checkout.stripe.test/session",
    }


def test_portal_returns_stripe_error_as_http_response(client, user_a, monkeypatch):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        profile.stripe_customer_id = "cus_test_123"
        db.commit()
    finally:
        db.close()

    def raise_stripe_error(**kwargs):
        raise stripe.error.InvalidRequestError("No configuration provided", param=None)

    monkeypatch.setattr("src.routers.subscription.is_configured", lambda: True)
    monkeypatch.setattr(
        "src.routers.subscription.stripe.billing_portal.Session.create",
        raise_stripe_error,
    )

    response = client.post(
        "/subscription/portal",
        headers={**user_a["headers"], "Origin": "http://localhost:5173"},
    )

    assert response.status_code == 502
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response.json() == {
        "detail": "Impossible d'ouvrir le portail Stripe pour le moment",
    }


def test_webhook_checkout_completion_activates_profile(client, user_a, monkeypatch):
    monkeypatch.setattr(
        "src.routers.subscription.verify_webhook_signature",
        lambda body, sig_header: {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {"user_id": user_a["user_id"]},
                    "customer": "cus_test_123",
                    "subscription": "sub_test_123",
                },
            },
        },
    )

    response = client.post(
        "/subscription/webhook",
        content=b"{}",
        headers={"stripe-signature": "sig_test"},
    )

    assert response.status_code == 200

    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        assert profile is not None
        assert profile.subscription_status == "active"
        assert profile.stripe_customer_id == "cus_test_123"
        assert profile.stripe_subscription_id == "sub_test_123"
    finally:
        db.close()


def test_webhook_subscription_deleted_cancels_profile(client, user_a, monkeypatch):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        assert profile is not None
        profile.subscription_status = "active"
        profile.stripe_customer_id = "cus_test_123"
        profile.stripe_subscription_id = "sub_test_123"
        db.commit()
    finally:
        db.close()

    monkeypatch.setattr(
        "src.routers.subscription.verify_webhook_signature",
        lambda body, sig_header: {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_test_123",
                    "customer": "cus_test_123",
                },
            },
        },
    )

    response = client.post(
        "/subscription/webhook",
        content=b"{}",
        headers={"stripe-signature": "sig_test"},
    )

    assert response.status_code == 200

    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        assert profile is not None
        assert profile.subscription_status == "cancelled"
        assert profile.stripe_subscription_id is None
    finally:
        db.close()


def test_subscription_requires_auth(client):
    response = client.get("/subscription/me")

    assert response.status_code == 401


def test_current_profile_creates_profile_from_jwt_metadata(db_session):
    payload = {
        "sub": "jwt-user-1",
        "user_metadata": {
            "prenom": "Jane",
            "nom": "Doe",
        },
    }

    profile = get_current_profile(payload=payload, db=db_session)

    assert profile.id == "jwt-user-1"
    assert profile.prenom == "Jane"
    assert profile.nom == "Doe"
