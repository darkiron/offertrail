"""
Tests auth — Supabase Auth gère register/login/reset.
Ce router expose uniquement /auth/me (GET + PATCH).
"""


def test_me_authenticated(client, user_a):
    response = client.get("/auth/me", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == user_a["user_id"]
    assert payload["plan"] == "starter"


def test_me_unauthenticated(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_update_me(client, user_a):
    response = client.patch(
        "/auth/me",
        headers=user_a["headers"],
        json={"prenom": "Updated", "nom": "Name"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["prenom"] == "Updated"
    assert payload["nom"] == "Name"


def test_update_me_partial(client, user_a):
    response = client.patch(
        "/auth/me",
        headers=user_a["headers"],
        json={"prenom": "OnlyPrenom"},
    )

    assert response.status_code == 200
    assert response.json()["prenom"] == "OnlyPrenom"
