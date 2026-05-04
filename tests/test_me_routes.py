"""Tests pour /me/* — couverture des endpoints non couverts."""
from datetime import datetime, timedelta


def _create_candidature(client, headers, ets_id: str, statut: str = "envoyee") -> dict:
    resp = client.post(
        "/candidatures",
        headers=headers,
        json={"etablissement_id": ets_id, "poste": "Dev", "statut": statut},
    )
    assert resp.status_code == 201
    return resp.json()


def _create_relance(client, headers, cand_id: str, date_prevue: str, statut: str = "a_faire") -> dict:
    resp = client.post(
        "/relances",
        headers=headers,
        json={"candidature_id": cand_id, "date_prevue": date_prevue, "statut": statut},
    )
    assert resp.status_code == 201
    return resp.json()


# ── /me/candidatures ────────────────────────────────────────────────────────

def test_me_list_candidatures_empty(client, user_a):
    resp = client.get("/me/candidatures", headers=user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_me_list_candidatures_pagination(client, user_a, ets):
    for i in range(3):
        _create_candidature(client, user_a["headers"], ets["id"])

    resp = client.get("/me/candidatures", headers=user_a["headers"], params={"page": 1, "per_page": 2})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["per_page"] == 2


def test_me_create_candidature(client, user_a, ets):
    resp = client.post(
        "/me/candidatures",
        headers=user_a["headers"],
        json={"etablissement_id": ets["id"], "poste": "Dev Python"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["poste"] == "Dev Python"
    assert data["user_id"] == user_a["user_id"]


def test_me_create_candidature_ets_not_found(client, user_a):
    from uuid import uuid4
    resp = client.post(
        "/me/candidatures",
        headers=user_a["headers"],
        json={"etablissement_id": str(uuid4()), "poste": "Dev"},
    )
    assert resp.status_code == 404


def test_me_get_candidature(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    resp = client.get(f"/me/candidatures/{cand['id']}", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json()["id"] == cand["id"]


def test_me_get_candidature_history(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    resp = client.get(f"/me/candidatures/{cand['id']}/history", headers=user_a["headers"])
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


# ── /me/stats ───────────────────────────────────────────────────────────────

def test_me_stats_empty(client, user_a):
    resp = client.get("/me/stats", headers=user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_candidatures"] == 0
    assert data["taux_reponse"] == 0
    assert data["relances_dues"] == 0


def test_me_stats_with_candidatures(client, user_a, ets):
    _create_candidature(client, user_a["headers"], ets["id"], "envoyee")
    _create_candidature(client, user_a["headers"], ets["id"], "entretien")

    resp = client.get("/me/stats", headers=user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_candidatures"] == 2
    assert data["taux_reponse"] == 50.0


def test_me_stats_with_due_relances(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    past_date = (datetime.now() - timedelta(days=1)).isoformat()
    _create_relance(client, user_a["headers"], cand["id"], past_date, "a_faire")

    resp = client.get("/me/stats", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json()["relances_dues"] == 1


# ── /me/relances/dues ───────────────────────────────────────────────────────

def test_me_due_relances_empty(client, user_a):
    resp = client.get("/me/relances/dues", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_me_due_relances_returns_past(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    past_date = (datetime.now() - timedelta(hours=1)).isoformat()
    _create_relance(client, user_a["headers"], cand["id"], past_date)

    resp = client.get("/me/relances/dues", headers=user_a["headers"])
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_me_due_relances_excludes_future(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    future_date = (datetime.now() + timedelta(days=10)).isoformat()
    _create_relance(client, user_a["headers"], cand["id"], future_date)

    resp = client.get("/me/relances/dues", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_me_due_relances_excludes_done(client, user_a, ets):
    cand = _create_candidature(client, user_a["headers"], ets["id"])
    past_date = (datetime.now() - timedelta(hours=1)).isoformat()
    _create_relance(client, user_a["headers"], cand["id"], past_date, "faite")

    resp = client.get("/me/relances/dues", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


# ── /me/pipeline ────────────────────────────────────────────────────────────

def test_me_pipeline_empty(client, user_a):
    resp = client.get("/me/pipeline", headers=user_a["headers"])
    assert resp.status_code == 200
    assert resp.json() == []


def test_me_pipeline_with_candidatures(client, user_a, ets):
    _create_candidature(client, user_a["headers"], ets["id"], "envoyee")
    _create_candidature(client, user_a["headers"], ets["id"], "envoyee")
    _create_candidature(client, user_a["headers"], ets["id"], "entretien")

    resp = client.get("/me/pipeline", headers=user_a["headers"])
    assert resp.status_code == 200
    buckets = {b["statut"]: b["count"] for b in resp.json()}
    assert buckets.get("envoyee") == 2
    assert buckets.get("entretien") == 1
