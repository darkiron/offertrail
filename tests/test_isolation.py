from src.database import SessionLocal
from src.models import Candidature, User


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


class TestSubscriptionLimits:
    def test_starter_limit_at_25(self, client, user_a, ets):
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
                    for index in range(25)
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
                "poste": "Poste limite",
                "statut": "envoyee",
            },
        )

        assert response.status_code == 402
        assert response.json()["detail"]["code"] == "LIMIT_REACHED"

    def test_pro_user_has_no_limit(self, client, user_a, ets):
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_a["user_id"]).first()
            user.plan = "pro"
            db.add_all(
                [
                    Candidature(
                        user_id=user_a["user_id"],
                        etablissement_id=ets["id"],
                        poste=f"Poste {index}",
                        statut="envoyee",
                    )
                    for index in range(25)
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
                "poste": "Poste 26",
                "statut": "envoyee",
            },
        )

        assert response.status_code == 201
