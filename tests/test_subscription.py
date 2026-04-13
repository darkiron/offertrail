from src.auth import get_current_profile
from src.database import SessionLocal
from src.models import Profile


def test_get_subscription_starter(client, user_a):
    response = client.get("/subscription/me", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan"] == "starter"
    assert payload["is_pro"] is False
    assert payload["candidatures_max"] == 25


def test_upgrade_to_pro(client, user_a):
    # Sans Stripe configuré → upgrade simulé directement
    response = client.post("/subscription/checkout", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["mode"] == "simulated"

    # Vérifier que l'upgrade a bien eu lieu
    me = client.get("/subscription/me", headers=user_a["headers"])
    assert me.json()["plan"] == "pro"
    assert me.json()["is_pro"] is True


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
        assert profile.plan == "pro"
        assert profile.stripe_customer_id == "cus_test_123"
        assert profile.stripe_subscription_id == "sub_test_123"
    finally:
        db.close()


def test_webhook_subscription_deleted_downgrades_profile(client, user_a, monkeypatch):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == user_a["user_id"]).first()
        assert profile is not None
        profile.plan = "pro"
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
        assert profile.plan == "starter"
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
