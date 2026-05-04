"""Tests pour /relances — couverture complète du router."""
from datetime import datetime, timedelta
from uuid import uuid4


def _create_candidature(client, headers, ets_id: str) -> str:
    resp = client.post(
        "/candidatures",
        headers=headers,
        json={"etablissement_id": ets_id, "poste": "Dev Python", "statut": "envoyee"},
    )
    assert resp.status_code == 201
    return resp.json()["id"]


def test_list_relances_empty(client, user_a):
    resp = client.get("/relances", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_relance(client, user_a, ets):
    cand_id = _create_candidature(client, user_a["headers"], ets["id"])
    date_prevue = (datetime.now() + timedelta(days=7)).isoformat()

    resp = client.post(
        "/relances",
        headers=user_a["headers"],
        json={
            "candidature_id": cand_id,
            "date_prevue": date_prevue,
            "canal": "email",
            "contenu": "Suivi de candidature",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["candidature_id"] == cand_id
    assert data["canal"] == "email"
    assert data["user_id"] == user_a["user_id"]
    assert data["statut"] == "a_faire"


def test_create_relance_candidature_not_found(client, user_a):
    resp = client.post(
        "/relances",
        headers=user_a["headers"],
        json={
            "candidature_id": str(uuid4()),
            "date_prevue": datetime.now().isoformat(),
        },
    )
    assert resp.status_code == 404


def test_create_relance_not_own_candidature(client, user_a, user_b, ets):
    cand_id = _create_candidature(client, user_a["headers"], ets["id"])

    resp = client.post(
        "/relances",
        headers=user_b["headers"],
        json={"candidature_id": cand_id, "date_prevue": datetime.now().isoformat()},
    )
    assert resp.status_code == 404


def test_get_relance(client, user_a, ets):
    cand_id = _create_candidature(client, user_a["headers"], ets["id"])
    create_resp = client.post(
        "/relances",
        headers=user_a["headers"],
        json={"candidature_id": cand_id, "date_prevue": datetime.now().isoformat()},
    )
    relance_id = create_resp.json()["id"]

    get_resp = client.get(f"/relances/{relance_id}", headers=user_a["headers"])
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == relance_id


def test_get_relance_not_found(client, user_a):
    resp = client.get(f"/relances/{uuid4()}", headers=user_a["headers"])
    assert resp.status_code == 404


def test_update_relance(client, user_a, ets):
    cand_id = _create_candidature(client, user_a["headers"], ets["id"])
    create_resp = client.post(
        "/relances",
        headers=user_a["headers"],
        json={"candidature_id": cand_id, "date_prevue": datetime.now().isoformat()},
    )
    relance_id = create_resp.json()["id"]

    patch_resp = client.patch(
        f"/relances/{relance_id}",
        headers=user_a["headers"],
        json={"statut": "faite", "canal": "linkedin"},
    )
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["statut"] == "faite"
    assert data["canal"] == "linkedin"


def test_update_relance_not_found(client, user_a):
    resp = client.patch(
        f"/relances/{uuid4()}",
        headers=user_a["headers"],
        json={"statut": "faite"},
    )
    assert resp.status_code == 404


def test_delete_relance(client, user_a, ets):
    cand_id = _create_candidature(client, user_a["headers"], ets["id"])
    create_resp = client.post(
        "/relances",
        headers=user_a["headers"],
        json={"candidature_id": cand_id, "date_prevue": datetime.now().isoformat()},
    )
    relance_id = create_resp.json()["id"]

    del_resp = client.delete(f"/relances/{relance_id}", headers=user_a["headers"])
    assert del_resp.status_code == 204

    get_resp = client.get(f"/relances/{relance_id}", headers=user_a["headers"])
    assert get_resp.status_code == 404


def test_delete_relance_not_found(client, user_a):
    resp = client.delete(f"/relances/{uuid4()}", headers=user_a["headers"])
    assert resp.status_code == 404


def test_list_relances_only_own(client, user_a, user_b, ets):
    cand_id_a = _create_candidature(client, user_a["headers"], ets["id"])
    cand_id_b = _create_candidature(client, user_b["headers"], ets["id"])

    client.post(
        "/relances",
        headers=user_a["headers"],
        json={"candidature_id": cand_id_a, "date_prevue": datetime.now().isoformat()},
    )
    client.post(
        "/relances",
        headers=user_b["headers"],
        json={"candidature_id": cand_id_b, "date_prevue": datetime.now().isoformat()},
    )

    resp_a = client.get("/relances", headers=user_a["headers"])
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1
    assert resp_a.json()[0]["user_id"] == user_a["user_id"]
