def test_get_etablissement(client, user_a, ets):
    response = client.get(
        f"/etablissements/{ets['id']}",
        headers=user_a["headers"],
    )

    assert response.status_code == 200
    assert response.json()["id"] == ets["id"]


def test_update_etablissement(client, user_a, ets):
    create = client.post(
        "/etablissements",
        headers=user_a["headers"],
        json={"nom": "To Update", "type": "AUTRE"},
    )
    etablissement_id = create.json()["id"]

    response = client.patch(
        f"/etablissements/{etablissement_id}",
        headers=user_a["headers"],
        json={
            "nom": "Test Corp Updated",
            "type": "ESN",
            "site_web": "https://example.com",
            "description": "Updated",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["nom"] == "Test Corp Updated"
    assert payload["type"] == "ESN"
    assert payload["site_web"] == "https://example.com"
    assert payload["description"] == "Updated"


def test_update_etablissement_linked_to_user_portfolio(client, user_a, user_b, ets):
    client.post(
        "/me/candidatures", headers=user_b["headers"],
        json={"etablissement_id": ets["id"], "poste": "Designer", "statut": "envoyee"},
    )

    response = client.patch(
        f"/etablissements/{ets['id']}", headers=user_b["headers"],
        json={"description": "Contexte personnel enrichi"},
    )

    assert response.status_code == 200
    assert response.json()["description"] == "Contexte personnel enrichi"


def test_update_unrelated_etablissement_is_forbidden(client, user_a, user_b):
    created = client.post(
        "/etablissements", headers=user_a["headers"],
        json={"nom": "Entreprise privee", "type": "AUTRE"},
    ).json()

    response = client.patch(
        f"/etablissements/{created['id']}", headers=user_b["headers"],
        json={"nom": "Modification interdite"},
    )

    assert response.status_code == 403


def test_delete_etablissement_without_candidature(client, user_a):
    create = client.post(
        "/etablissements",
        headers=user_a["headers"],
        json={"nom": "To Delete", "type": "AUTRE"},
    )
    etablissement_id = create.json()["id"]

    response = client.delete(
        f"/etablissements/{etablissement_id}",
        headers=user_a["headers"],
    )

    assert response.status_code == 200
    assert response.json() == {"success": True}


def test_delete_etablissement_with_candidature_returns_400(client, user_a, ets, candidature_a):
    response = client.delete(
        f"/etablissements/{ets['id']}",
        headers=user_a["headers"],
    )

    assert response.status_code == 400
