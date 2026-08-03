import pytest
from fastapi.testclient import TestClient
from src.main import DEFAULT_ALLOWED_ORIGINS, app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "version": "0.1.0"}


def test_default_cors_origins_support_localhost_and_ipv4_loopback():
    assert "http://localhost:5173" in DEFAULT_ALLOWED_ORIGINS
    assert "http://127.0.0.1:5173" in DEFAULT_ALLOWED_ORIGINS
    assert "https://offertrail.local" in DEFAULT_ALLOWED_ORIGINS


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/dashboard"),
        ("get", "/api/insights/monthly-applications"),
        ("get", "/api/applications"),
        ("post", "/api/applications"),
        ("get", "/api/organizations"),
        ("post", "/api/organizations"),
        ("get", "/api/contacts"),
        ("post", "/api/contacts"),
        ("get", "/api/companies"),
    ],
)
def test_unused_legacy_routes_are_not_exposed(method, path):
    with TestClient(app) as client:
        response = client.request(method, path)
    assert response.status_code == 404
