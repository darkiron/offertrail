"""Tests pour /contact-interactions — couverture complète du router."""
from uuid import uuid4

from src.database import SessionLocal
from src.models import Contact, Etablissement


def _create_contact(user_id: str) -> str:
    db = SessionLocal()
    try:
        ets = Etablissement(nom="Corp Contact", created_by=user_id)
        db.add(ets)
        db.flush()
        contact = Contact(
            etablissement_id=ets.id,
            prenom="Alice",
            nom="Dupont",
            created_by=user_id,
        )
        db.add(contact)
        db.commit()
        return contact.id
    finally:
        db.close()


def test_list_contact_interactions_empty(client, user_a):
    resp = client.get("/contact-interactions", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_create_contact_interaction(client, user_a):
    contact_id = _create_contact(user_a["user_id"])
    resp = client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": contact_id, "appreciation": "positif", "notes": "bonne impression"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["contact_id"] == contact_id
    assert data["appreciation"] == "positif"
    assert data["user_id"] == user_a["user_id"]


def test_create_contact_interaction_contact_not_found(client, user_a):
    resp = client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": str(uuid4())},
    )
    assert resp.status_code == 404


def test_get_contact_interaction(client, user_a):
    contact_id = _create_contact(user_a["user_id"])
    create_resp = client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": contact_id, "notes": "note de test"},
    )
    interaction_id = create_resp.json()["id"]

    get_resp = client.get(f"/contact-interactions/{interaction_id}", headers=user_a["headers"])
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == interaction_id


def test_get_contact_interaction_not_found(client, user_a):
    resp = client.get(f"/contact-interactions/{uuid4()}", headers=user_a["headers"])
    assert resp.status_code == 404


def test_update_contact_interaction(client, user_a):
    contact_id = _create_contact(user_a["user_id"])
    create_resp = client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": contact_id, "notes": "ancienne note"},
    )
    interaction_id = create_resp.json()["id"]

    patch_resp = client.patch(
        f"/contact-interactions/{interaction_id}",
        headers=user_a["headers"],
        json={"notes": "nouvelle note", "appreciation": "neutre"},
    )
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["notes"] == "nouvelle note"
    assert data["appreciation"] == "neutre"


def test_update_contact_interaction_not_found(client, user_a):
    resp = client.patch(
        f"/contact-interactions/{uuid4()}",
        headers=user_a["headers"],
        json={"notes": "test"},
    )
    assert resp.status_code == 404


def test_delete_contact_interaction(client, user_a):
    contact_id = _create_contact(user_a["user_id"])
    create_resp = client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": contact_id},
    )
    interaction_id = create_resp.json()["id"]

    del_resp = client.delete(f"/contact-interactions/{interaction_id}", headers=user_a["headers"])
    assert del_resp.status_code == 204

    get_resp = client.get(f"/contact-interactions/{interaction_id}", headers=user_a["headers"])
    assert get_resp.status_code == 404


def test_delete_contact_interaction_not_found(client, user_a):
    resp = client.delete(f"/contact-interactions/{uuid4()}", headers=user_a["headers"])
    assert resp.status_code == 404


def test_list_contact_interactions_only_own(client, user_a, user_b):
    contact_id_a = _create_contact(user_a["user_id"])
    contact_id_b = _create_contact(user_b["user_id"])

    client.post(
        "/contact-interactions",
        headers=user_a["headers"],
        json={"contact_id": contact_id_a, "notes": "note user a"},
    )
    client.post(
        "/contact-interactions",
        headers=user_b["headers"],
        json={"contact_id": contact_id_b, "notes": "note user b"},
    )

    resp_a = client.get("/contact-interactions", headers=user_a["headers"])
    assert resp_a.status_code == 200
    assert len(resp_a.json()) == 1
    assert resp_a.json()[0]["user_id"] == user_a["user_id"]
