def test_get_subscription_starter(client, user_a):
    response = client.get("/subscription/me", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan"] == "starter"
    assert payload["is_pro"] is False
    assert payload["candidatures_max"] == 25


def test_upgrade_to_pro(client, user_a):
    response = client.post("/subscription/upgrade", headers=user_a["headers"])

    assert response.status_code == 200
    payload = response.json()
    assert payload["plan"] == "pro"
    assert payload["is_pro"] is True
    assert payload["candidatures_max"] == 0


def test_subscription_requires_auth(client):
    response = client.get("/subscription/me")

    assert response.status_code == 401
