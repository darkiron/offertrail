def test_create_candidature(client, user_a, ets):
    response = client.post(
        "/candidatures",
        headers=user_a["headers"],
        json={
            "etablissement_id": ets["id"],
            "poste": "Dev Symfony",
            "statut": "envoyee",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["poste"] == "Dev Symfony"
    assert payload["user_id"] == user_a["user_id"]


def test_create_candidature_invalid_ets(client, user_a):
    response = client.post(
        "/candidatures",
        headers=user_a["headers"],
        json={
            "etablissement_id": "00000000-0000-0000-0000-000000000000",
            "poste": "Dev Symfony",
            "statut": "envoyee",
        },
    )

    assert response.status_code == 404


def test_list_candidatures(client, user_a, candidature_a):
    response = client.get("/candidatures", headers=user_a["headers"])

    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_get_candidature(client, user_a, candidature_a):
    response = client.get(
        f"/candidatures/{candidature_a['id']}",
        headers=user_a["headers"],
    )

    assert response.status_code == 200
    assert response.json()["id"] == candidature_a["id"]


def test_update_candidature_statut(client, user_a, candidature_a):
    response = client.patch(
        f"/candidatures/{candidature_a['id']}",
        headers=user_a["headers"],
        json={"statut": "entretien"},
    )

    assert response.status_code == 200
    assert response.json()["statut"] == "entretien"


def test_update_cannot_change_user_id(client, user_a, user_b, candidature_a):
    response = client.patch(
        f"/candidatures/{candidature_a['id']}",
        headers=user_a["headers"],
        json={"user_id": user_b["user_id"], "statut": "refusee"},
    )

    assert response.status_code == 200
    assert response.json()["user_id"] == user_a["user_id"]


def test_delete_candidature(client, user_a, candidature_a):
    created = client.post(
        "/candidatures",
        headers=user_a["headers"],
        json={
            "etablissement_id": candidature_a["etablissement_id"],
            "poste": "A supprimer",
            "statut": "envoyee",
        },
    )
    candidature_id = created.json()["id"]
    response = client.delete(
        f"/candidatures/{candidature_id}",
        headers=user_a["headers"],
    )
    assert response.status_code == 204

    deleted = client.get(
        f"/candidatures/{candidature_id}",
        headers=user_a["headers"],
    )
    assert deleted.status_code == 404


def test_statut_event_created_on_update(client, user_a, candidature_a):
    created = client.post(
        "/candidatures",
        headers=user_a["headers"],
        json={
            "etablissement_id": candidature_a["etablissement_id"],
            "poste": "Avec event",
            "statut": "envoyee",
        },
    )
    candidature_id = created.json()["id"]

    client.patch(
        f"/candidatures/{candidature_id}",
        headers=user_a["headers"],
        json={"statut": "entretien"},
    )

    response = client.get(
        f"/candidatures/{candidature_id}/events",
        headers=user_a["headers"],
    )

    assert response.status_code == 200
    events = response.json()
    statut_events = [event for event in events if event["type"] == "statut_change"]
    assert len(statut_events) >= 1
    assert statut_events[0]["nouveau_statut"] == "entretien"
