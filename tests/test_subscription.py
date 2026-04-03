from fastapi.testclient import TestClient

from src.auth import create_access_token, hash_password
from src.database import SessionLocal, engine, init_db
from src.main import app
from src.models import Base, Candidature, Etablissement, User


def _bootstrap_user_context():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    init_db()

    db = SessionLocal()
    user = User(
        id="user-subscription",
        email="subscription@example.com",
        hashed_password=hash_password("password123"),
        prenom="Test",
        nom="Subscription",
        plan="starter",
        is_active=True,
    )
    organization = Etablissement(
        id="org-subscription",
        nom="OfferTrail Test Org",
        type="autre",
        created_by=user.id,
    )
    db.add_all([user, organization])
    db.commit()
    user_id = user.id
    user_email = user.email
    organization_id = organization.id
    db.close()

    token = create_access_token(user_id, user_email)
    headers = {"Authorization": f"Bearer {token}"}
    return headers, user_id, organization_id


def test_subscription_me_reports_starter_usage():
    headers, user_id, organization_id = _bootstrap_user_context()
    db = SessionLocal()
    db.add(
        Candidature(
            id="cand-subscription-1",
            user_id=user_id,
            etablissement_id=organization_id,
            poste="Backend Engineer",
            statut="envoyee",
        )
    )
    db.commit()
    db.close()

    with TestClient(app) as client:
        response = client.get("/subscription/me", headers=headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan"] == "starter"
    assert payload["is_pro"] is False
    assert payload["candidatures_count"] == 1
    assert payload["candidatures_max"] == 25


def test_candidature_limit_then_upgrade_to_pro():
    headers, user_id, organization_id = _bootstrap_user_context()
    db = SessionLocal()
    db.add_all(
        [
            Candidature(
                id=f"cand-limit-{index}",
                user_id=user_id,
                etablissement_id=organization_id,
                poste=f"Role {index}",
                statut="envoyee",
            )
            for index in range(25)
        ]
    )
    db.commit()
    db.close()

    payload = {
        "etablissement_id": organization_id,
        "poste": "26th role",
        "statut": "envoyee",
    }

    with TestClient(app) as client:
        blocked = client.post("/candidatures", json=payload, headers=headers)
        assert blocked.status_code == 402
        assert blocked.json()["detail"]["code"] == "LIMIT_REACHED"

        upgraded = client.post("/subscription/upgrade", headers=headers)
        assert upgraded.status_code == 200
        assert upgraded.json()["is_pro"] is True

        allowed = client.post("/candidatures", json=payload, headers=headers)
        assert allowed.status_code == 201
        assert allowed.json()["poste"] == "26th role"
