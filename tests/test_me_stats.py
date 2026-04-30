"""Tests pour /me/stats — régression issue #98.

Un refus sans date_reponse ne doit PAS être compté comme réponse.
Le taux de réponse ne doit pas monter artificiellement à 100%.
"""
from datetime import datetime


def _create_cand(client, headers, etablissement_id, poste, statut, date_reponse=None):
    payload = {"etablissement_id": etablissement_id, "poste": poste, "statut": statut}
    if date_reponse:
        payload["date_reponse"] = date_reponse
    resp = client.post("/candidatures", headers=headers, json=payload)
    assert resp.status_code == 201
    return resp.json()


def test_stats_refusee_sans_date_reponse_exclue(client, user_a, ets):
    """refusee sans date_reponse ne compte pas dans taux_reponse (issue #98)."""
    headers = user_a["headers"]
    _create_cand(client, headers, ets["id"], "Poste A", "envoyee")
    _create_cand(client, headers, ets["id"], "Poste B", "refusee")

    resp = client.get("/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_candidatures"] == 2
    assert data["taux_reponse"] == 0.0


def test_stats_entretien_compte_comme_reponse(client, user_a, ets):
    """entretien est compté dans taux_reponse."""
    headers = user_a["headers"]
    _create_cand(client, headers, ets["id"], "Poste A", "envoyee")
    _create_cand(client, headers, ets["id"], "Poste B", "entretien")

    resp = client.get("/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["taux_reponse"] == 50.0


def test_stats_offre_recue_compte_comme_reponse(client, user_a, ets):
    """offre_recue est compté dans taux_reponse."""
    headers = user_a["headers"]
    _create_cand(client, headers, ets["id"], "Poste A", "envoyee")
    _create_cand(client, headers, ets["id"], "Poste B", "offre_recue")

    resp = client.get("/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["taux_reponse"] == 50.0


def test_stats_refusee_avec_date_reponse_comptee(client, user_a, ets):
    """refusee AVEC date_reponse est comptée (la réponse a eu lieu, même négative)."""
    headers = user_a["headers"]
    _create_cand(client, headers, ets["id"], "Poste A", "envoyee")
    _create_cand(
        client, headers, ets["id"], "Poste B", "refusee",
        date_reponse="2024-03-01T00:00:00",
    )

    resp = client.get("/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["taux_reponse"] == 50.0


def test_stats_zero_candidatures(client, user_a):
    """Stats vides sans candidatures."""
    resp = client.get("/me/stats", headers=user_a["headers"])
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_candidatures"] == 0
    assert data["taux_reponse"] == 0
    assert data["taux_refus"] == 0
    assert data["pipeline_actif"] == 0


def test_stats_pas_100_pourcent_avec_refus_et_ghosting(client, user_a, ets):
    """Régression directe issue #98 : refus multiples ne montent pas taux à 100%."""
    headers = user_a["headers"]
    for i in range(5):
        _create_cand(client, headers, ets["id"], f"Poste envoyee {i}", "envoyee")
    for i in range(3):
        _create_cand(client, headers, ets["id"], f"Poste refusee {i}", "refusee")

    resp = client.get("/me/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["taux_reponse"] == 0.0
    assert data["taux_reponse"] < 100.0
