def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={"email": "new@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    payload = response.json()
    assert "access_token" in payload
    assert payload["user"]["email"] == "new@example.com"


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    client.post("/auth/register", json=payload)

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409


def test_login_success(client):
    client.post(
        "/auth/register",
        json={"email": "login@example.com", "password": "password123"},
    )

    response = client.post(
        "/auth/login",
        data={"username": "login@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post(
        "/auth/register",
        json={"email": "wrong@example.com", "password": "password123"},
    )

    response = client.post(
        "/auth/login",
        data={"username": "wrong@example.com", "password": "wrongpass"},
    )

    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post(
        "/auth/login",
        data={"username": "ghost@example.com", "password": "password123"},
    )

    assert response.status_code == 401


def test_me_authenticated(client, user_a):
    register = client.post(
        "/auth/register",
        json={"email": "me@example.com", "password": "password123"},
    )
    token = register.json()["access_token"]
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"


def test_me_unauthenticated(client):
    response = client.get("/auth/me")

    assert response.status_code == 401


def test_update_me(client, user_a):
    register = client.post(
        "/auth/register",
        json={"email": "update@example.com", "password": "password123"},
    )
    token = register.json()["access_token"]
    response = client.patch(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"prenom": "Updated", "nom": "Name"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["prenom"] == "Updated"
    assert payload["nom"] == "Name"


def test_change_password_success(client, user_a):
    response = client.post(
        "/auth/change-password",
        headers=user_a["headers"],
        json={
            "current_password": "password123",
            "new_password": "newpassword123",
        },
    )

    assert response.status_code == 200

    login = client.post(
        "/auth/login",
        data={"username": user_a["email"], "password": "newpassword123"},
    )
    assert login.status_code == 200


def test_change_password_wrong_current_password(client, user_a):
    response = client.post(
        "/auth/change-password",
        headers=user_a["headers"],
        json={
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
        },
    )

    assert response.status_code == 400


def test_forgot_password_unknown_email_returns_200(client):
    response = client.post(
        "/auth/forgot-password",
        json={"email": "ghost@example.com"},
    )

    assert response.status_code == 200


def test_forgot_password_known_email_returns_200(client, user_a):
    response = client.post(
        "/auth/forgot-password",
        json={"email": user_a["email"]},
    )

    assert response.status_code == 200


def test_reset_password_invalid_token(client):
    response = client.post(
        "/auth/reset-password",
        json={"token": "fake-token", "new_password": "newpassword123"},
    )

    assert response.status_code == 400


def test_reset_password_flow(client, reset_token_factory):
    _, reset = reset_token_factory()

    response = client.post(
        "/auth/reset-password",
        json={"token": reset.token, "new_password": "newpassword123"},
    )
    assert response.status_code == 200

    second = client.post(
        "/auth/reset-password",
        json={"token": reset.token, "new_password": "anotherpassword"},
    )
    assert second.status_code == 400
