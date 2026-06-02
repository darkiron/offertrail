from src.database import SessionLocal
from src.models import Candidature, Profile


class TestCandidatureIsolation:
    def test_list_empty_for_new_user(self, client, user_b):
        response = client.get("/candidatures", headers=user_b["headers"])

        assert response.status_code == 200
        assert response.json() == []

    def test_user_sees_own_candidatures(self, client, user_a, candidature_a):
        response = client.get("/candidatures", headers=user_a["headers"])

        assert response.status_code == 200
        ids = [item["id"] for item in response.json()]
        assert candidature_a["id"] in ids

    def test_user_b_cannot_see_user_a_candidature(self, client, user_b, candidature_a):
        response = client.get("/candidatures", headers=user_b["headers"])

        assert response.status_code == 200
        ids = [item["id"] for item in response.json()]
        assert candidature_a["id"] not in ids

    def test_user_b_cannot_get_user_a_candidature_by_id(self, client, user_b, candidature_a):
        response = client.get(
            f"/candidatures/{candidature_a['id']}",
            headers=user_b["headers"],
        )

        assert response.status_code == 404

    def test_user_b_cannot_update_user_a_candidature(self, client, user_b, candidature_a):
        response = client.patch(
            f"/candidatures/{candidature_a['id']}",
            headers=user_b["headers"],
            json={"statut": "refusee"},
        )

        assert response.status_code == 404

    def test_user_b_cannot_delete_user_a_candidature(self, client, user_b, candidature_a):
        response = client.delete(
            f"/candidatures/{candidature_a['id']}",
            headers=user_b["headers"],
        )

        assert response.status_code == 404

    def test_unauthenticated_cannot_list_candidatures(self, client):
        response = client.get("/candidatures")

        assert response.status_code == 401

    def test_user_id_from_token_not_body(self, client, user_a, user_b, ets):
        response = client.post(
            "/candidatures",
            headers=user_a["headers"],
            json={
                "etablissement_id": ets["id"],
                "poste": "Injection test",
                "statut": "envoyee",
                "user_id": user_b["user_id"],
            },
        )

        assert response.status_code == 201
        payload = response.json()
        assert payload["user_id"] == user_a["user_id"]
        assert payload["user_id"] != user_b["user_id"]


class TestEtablissementsAccess:
    def test_etablissements_visible_by_all_authenticated(self, client, user_a, user_b, ets):
        created = client.post(
            "/etablissements",
            headers=user_a["headers"],
            json={"nom": "Shared Corp", "type": "AUTRE"},
        )
        etablissement_id = created.json()["id"]

        response_a = client.get("/etablissements", headers=user_a["headers"])
        response_b = client.get("/etablissements", headers=user_b["headers"])

        assert response_a.status_code == 200
        assert response_b.status_code == 200
        ids_a = [item["id"] for item in response_a.json()]
        ids_b = [item["id"] for item in response_b.json()]
        assert etablissement_id in ids_a
        assert etablissement_id in ids_b

    def test_etablissements_require_auth(self, client):
        response = client.get("/etablissements")

        assert response.status_code == 401


class TestSubscriptionGate:
    def test_free_user_limited_to_five_candidatures(self, client, ets):
        """Modèle freemium : un utilisateur free (pending) peut créer jusqu'à 5
        candidatures ; la 6e est bloquée par 402 LIMIT_REACHED."""
        from uuid import uuid4
        from tests.conftest import make_token

        user_id = str(uuid4())
        email = f"free-{uuid4().hex}@example.com"
        db = SessionLocal()
        try:
            db.add(Profile(id=user_id, prenom="Free", nom="User",
                           subscription_status="pending", is_active=True))
            db.add_all([
                Candidature(
                    user_id=user_id,
                    etablissement_id=ets["id"],
                    poste=f"Poste {index}",
                    statut="envoyee",
                )
                for index in range(4)
            ])
            db.commit()
        finally:
            db.close()

        token = make_token(user_id, email)
        headers = {"Authorization": f"Bearer {token}"}
        payload = {
            "etablissement_id": ets["id"],
            "poste": "Poste limite",
            "statut": "envoyee",
        }

        # 5e candidature : encore dans la limite free → autorisée
        allowed = client.post("/candidatures", headers=headers, json=payload)
        assert allowed.status_code == 201

        # 6e candidature : limite free atteinte → bloquée
        blocked = client.post("/candidatures", headers=headers, json=payload)
        assert blocked.status_code == 402
        assert blocked.json()["detail"]["code"] == "LIMIT_REACHED"

    def test_active_user_can_create_unlimited_candidatures(self, client, user_a, ets):
        """Un utilisateur actif peut créer des candidatures sans limite."""
        db = SessionLocal()
        try:
            db.add_all(
                [
                    Candidature(
                        user_id=user_a["user_id"],
                        etablissement_id=ets["id"],
                        poste=f"Poste {index}",
                        statut="envoyee",
                    )
                    for index in range(30)
                ]
            )
            db.commit()
        finally:
            db.close()

        response = client.post(
            "/candidatures",
            headers=user_a["headers"],
            json={
                "etablissement_id": ets["id"],
                "poste": "Poste 31",
                "statut": "envoyee",
            },
        )

        assert response.status_code == 201
