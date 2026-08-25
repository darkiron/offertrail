from datetime import datetime, timedelta

from src.database import SessionLocal
from src.models import Relance


def _application(client, headers, organization_id):
    response = client.post(
        "/candidatures", headers=headers,
        json={"etablissement_id": organization_id, "poste": "Product Designer", "statut": "entretien"},
    )
    assert response.status_code == 201
    return response.json()


def _followup(client, headers, application_id, due_at):
    response = client.post(
        "/relances", headers=headers,
        json={"candidature_id": application_id, "date_prevue": due_at.isoformat(), "canal": "email"},
    )
    assert response.status_code == 201
    return response.json()


def test_today_returns_enriched_owned_actions(client, user_a, user_b, ets):
    own = _application(client, user_a["headers"], ets["id"])
    other = _application(client, user_b["headers"], ets["id"])
    _followup(client, user_a["headers"], own["id"], datetime.now() - timedelta(days=2))
    _followup(client, user_b["headers"], other["id"], datetime.now() - timedelta(days=1))

    response = client.get("/me/today", headers=user_a["headers"])

    assert response.status_code == 200
    data = response.json()
    assert data["actions"]["due_count"] == 1
    assert data["actions"]["items"][0]["application"]["id"] == own["id"]
    assert data["actions"]["items"][0]["organization"]["name"] == ets["nom"]
    assert data["actions"]["items"][0]["urgency"] == "overdue"


def test_today_existing_account_without_followup_is_not_onboarding(client, user_a, ets):
    _application(client, user_a["headers"], ets["id"])

    response = client.get("/me/today", headers=user_a["headers"])

    assert response.status_code == 200
    data = response.json()
    assert data["activation"]["state"] == "active"
    assert data["activation"]["first_application_created"] is True
    assert data["activation"]["first_next_action_scheduled"] is False
    assert data["actions"]["due_count"] == 0


def test_today_accepts_database_date_values(client, user_a, ets, db_session):
    application = _application(client, user_a["headers"], ets["id"])
    from src.models import Relance
    db_session.add(Relance(
        candidature_id=application["id"],
        user_id=user_a["user_id"],
        date_prevue=datetime.now().date(),
        statut="a_faire",
    ))
    db_session.commit()

    today = client.get("/me/today", headers=user_a["headers"])
    listing = client.get("/me/candidatures", headers=user_a["headers"])

    assert today.status_code == 200
    assert listing.status_code == 200
    assert today.json()["actions"]["due_count"] == 1


def test_today_summary_uses_real_recent_activity(client, user_a, ets, db_session):
    application = _application(client, user_a["headers"], ets["id"])
    from src.models import Candidature, CandidatureEvent
    candidature = db_session.query(Candidature).filter(Candidature.id == application["id"]).one()
    candidature.date_reponse = datetime.now() - timedelta(days=2)
    db_session.add(CandidatureEvent(
        candidature_id=application["id"], user_id=user_a["user_id"],
        type="entretien_planifie", contenu="Entretien demain",
    ))
    db_session.commit()

    response = client.get("/me/today", headers=user_a["headers"])

    assert response.status_code == 200
    assert response.json()["summary"]["responses_30d"] == 1
    assert response.json()["summary"]["interviews_30d"] == 1


def test_today_counts_status_transition_to_interview_once(client, user_a, ets, db_session):
    application = _application(client, user_a["headers"], ets["id"])
    from src.models import CandidatureEvent
    db_session.add_all([
        CandidatureEvent(candidature_id=application["id"], user_id=user_a["user_id"], type="statut_change", nouveau_statut="entretien"),
        CandidatureEvent(candidature_id=application["id"], user_id=user_a["user_id"], type="entretien_planifie"),
    ])
    db_session.commit()

    response = client.get("/me/today", headers=user_a["headers"])

    assert response.status_code == 200
    assert response.json()["summary"]["interviews_30d"] == 1


def test_complete_action_is_atomic_and_creates_next(client, user_a, ets):
    application = _application(client, user_a["headers"], ets["id"])
    action = _followup(client, user_a["headers"], application["id"], datetime.now() - timedelta(days=1))
    next_due = datetime.now() + timedelta(days=3)

    response = client.post(
        f"/me/actions/{action['id']}/complete", headers=user_a["headers"],
        json={"outcome": "no_response", "note": "Message envoyé", "next_action": {"due_at": next_due.isoformat(), "channel": "email"}},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["completed_action"]["status"] == "done"
    assert data["next_action"] is not None
    assert data["today"]["remaining_due_count"] == 0
    history = client.get(f"/candidatures/{application['id']}/events", headers=user_a["headers"]).json()
    assert any(event["type"] == "relance_envoyee" and event["contenu"] == "Message envoyé" for event in history)


def test_complete_action_cannot_bypass_followup_quota(client, user_a, ets):
    from tests.test_plan_entitlements import _set_plan

    _set_plan(user_a["user_id"], "free", "pending")
    application = _application(client, user_a["headers"], ets["id"])
    action = _followup(client, user_a["headers"], application["id"], datetime.now())
    db = SessionLocal()
    try:
        db.add(Relance(
            candidature_id=application["id"],
            user_id=user_a["user_id"],
            date_prevue=datetime.now() + timedelta(days=1),
            statut="a_faire",
        ))
        db.commit()
    finally:
        db.close()

    response = client.post(
        f"/me/actions/{action['id']}/complete",
        headers=user_a["headers"],
        json={
            "outcome": "no_response",
            "next_action": {"due_at": (datetime.now() + timedelta(days=3)).isoformat()},
        },
    )

    assert response.status_code == 402
    assert response.json()["detail"]["code"] == "RELANCE_LIMIT"
    db = SessionLocal()
    try:
        unchanged = db.query(Relance).filter(Relance.id == action["id"]).one()
        assert unchanged.statut == "a_faire"
    finally:
        db.close()


def test_complete_action_cannot_cross_users(client, user_a, user_b, ets):
    application = _application(client, user_a["headers"], ets["id"])
    action = _followup(client, user_a["headers"], application["id"], datetime.now())

    response = client.post(
        f"/me/actions/{action['id']}/complete", headers=user_b["headers"], json={"outcome": "other"},
    )

    assert response.status_code == 404


def test_complete_action_rejects_duplicate(client, user_a, ets):
    application = _application(client, user_a["headers"], ets["id"])
    action = _followup(client, user_a["headers"], application["id"], datetime.now())
    url = f"/me/actions/{action['id']}/complete"
    assert client.post(url, headers=user_a["headers"], json={"outcome": "other"}).status_code == 200
    assert client.post(url, headers=user_a["headers"], json={"outcome": "other"}).status_code == 409


def test_canonical_list_filters_before_pagination_and_enriches(client, user_a, ets):
    matching = _application(client, user_a["headers"], ets["id"])
    client.post("/candidatures", headers=user_a["headers"], json={"etablissement_id": ets["id"], "poste": "Backend Engineer", "statut": "envoyee"})
    _followup(client, user_a["headers"], matching["id"], datetime.now() - timedelta(days=1))

    response = client.get("/me/candidatures", headers=user_a["headers"], params={"q": "Product", "due": "overdue", "per_page": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["pages"] == 1
    assert data["items"][0]["organization"]["name"] == ets["nom"]
    assert data["items"][0]["next_action"]["urgency"] == "overdue"


def test_workspace_uses_real_organization_data(client, user_a, ets):
    application = _application(client, user_a["headers"], ets["id"])

    response = client.get(f"/me/candidatures/{application['id']}/workspace", headers=user_a["headers"])

    assert response.status_code == 200
    organization = response.json()["organization"]
    assert organization["id"] == ets["id"]
    assert organization["name"] == ets["nom"]
    assert organization["type"] == ets["type"].lower()
    assert "probity_level" not in organization


def test_schedule_action_and_refuse_cancel_open_actions(client, user_a, ets):
    application = _application(client, user_a["headers"], ets["id"])
    due_at = datetime.now() + timedelta(days=2)
    scheduled = client.post(
        f"/me/candidatures/{application['id']}/actions",
        headers=user_a["headers"],
        json={"due_at": due_at.isoformat(), "channel": "email", "note": "Demander un retour"},
    )
    assert scheduled.status_code == 201

    refused = client.patch(
        f"/me/candidatures/{application['id']}/status",
        headers=user_a["headers"],
        json={"status": "refusee"},
    )
    assert refused.status_code == 200
    assert refused.json()["cancelled_actions"] == 1
    workspace = client.get(f"/me/candidatures/{application['id']}/workspace", headers=user_a["headers"]).json()
    assert workspace["next_action"] is None


def test_workspace_mutations_cannot_cross_users(client, user_a, user_b, ets):
    application = _application(client, user_a["headers"], ets["id"])
    status_response = client.patch(
        f"/me/candidatures/{application['id']}/status",
        headers=user_b["headers"],
        json={"status": "refusee"},
    )
    action_response = client.post(
        f"/me/candidatures/{application['id']}/actions",
        headers=user_b["headers"],
        json={"due_at": (datetime.now() + timedelta(days=1)).isoformat()},
    )
    assert status_response.status_code == 404
    assert action_response.status_code == 404


def test_organization_portfolio_is_private_and_paginated(client, user_a, user_b, ets):
    _application(client, user_a["headers"], ets["id"])

    own = client.get("/me/etablissements", headers=user_a["headers"], params={"per_page": 1})
    other = client.get("/me/etablissements", headers=user_b["headers"])

    assert own.status_code == 200
    assert own.json()["total"] == 1
    assert own.json()["pages"] == 1
    assert own.json()["items"][0]["id"] == ets["id"]
    assert other.status_code == 200
    assert other.json()["total"] == 0


def test_organization_portfolio_returns_distinct_pages(client, user_a):
    ids = []
    for index in range(16):
        organization = client.post(
            "/etablissements", headers=user_a["headers"],
            json={"nom": f"Entreprise {index:02d}", "type": "PME"},
        ).json()
        ids.append(organization["id"])
        _application(client, user_a["headers"], organization["id"])

    first = client.get(
        "/me/etablissements", headers=user_a["headers"],
        params={"page": 1, "per_page": 15, "sort": "name"},
    ).json()
    second = client.get(
        "/me/etablissements", headers=user_a["headers"],
        params={"page": 2, "per_page": 15, "sort": "name"},
    ).json()

    assert first["page"] == 1
    assert second["page"] == 2
    assert first["pages"] == 2
    assert len(first["items"]) == 15
    assert len(second["items"]) == 1
    assert first["items"][0]["id"] != second["items"][0]["id"]


def test_client_final_is_created_as_a_relationship_role(client, user_a, ets):
    final_customer = client.post(
        "/etablissements", headers=user_a["headers"],
        json={"nom": "Client final", "type": "PME"},
    ).json()
    application = client.post(
        "/me/candidatures", headers=user_a["headers"],
        json={
            "etablissement_id": ets["id"],
            "client_final_id": final_customer["id"],
            "poste": "Consultant",
            "statut": "envoyee",
        },
    )

    assert application.status_code == 201
    client_final_view = client.get(
        "/me/etablissements", headers=user_a["headers"],
        params={"relationship_role": "client_final"},
    ).json()
    intermediary_view = client.get(
        "/me/etablissements", headers=user_a["headers"],
        params={"relationship_role": "intermediary"},
    ).json()
    assert [item["id"] for item in client_final_view["items"]] == [final_customer["id"]]
    assert [item["id"] for item in intermediary_view["items"]] == [ets["id"]]
    workspace = client.get(
        f"/me/etablissements/{final_customer['id']}/workspace",
        headers=user_a["headers"],
    )
    assert workspace.status_code == 200
    assert workspace.json()["applications"][0]["title"] == "Consultant"


def test_contacts_listing_uses_private_paginated_contract(client, user_a, user_b, ets):
    created = client.post(
        "/contacts", headers=user_a["headers"],
        json={"organization_id": ets["id"], "first_name": "Alice", "last_name": "Martin", "role": "Recruteuse"},
    )
    assert created.status_code == 201

    own = client.get("/me/contacts", headers=user_a["headers"], params={"q": "Alice", "page": 1, "per_page": 15})
    other = client.get("/me/contacts", headers=user_b["headers"], params={"q": "Alice"})

    assert own.status_code == 200
    assert own.json()["total"] == 1
    assert own.json()["items"][0]["organization"]["id"] == ets["id"]
    assert own.json()["items"][0]["is_recruiter"] is True
    assert other.status_code == 200
    assert other.json()["total"] == 0


def test_visible_contact_can_be_updated_without_exposing_private_interactions(client, user_a, user_b, ets):
    created = client.post(
        "/contacts", headers=user_a["headers"],
        json={"organization_id": ets["id"], "first_name": "Alice", "last_name": "Martin"},
    )
    contact_id = created.json()["id"]
    client.post(
        "/me/candidatures", headers=user_b["headers"],
        json={"etablissement_id": ets["id"], "poste": "Designer", "statut": "envoyee"},
    )

    updated = client.patch(
        f"/contacts/{contact_id}", headers=user_b["headers"],
        json={"role": "Responsable recrutement", "phone": "01 02 03 04 05", "notes": "Échange privé B"},
    )
    owner_view = client.get(f"/contacts/{contact_id}", headers=user_a["headers"]).json()
    editor_view = client.get(f"/contacts/{contact_id}", headers=user_b["headers"]).json()

    assert updated.status_code == 200
    assert owner_view["role"] == "Responsable recrutement"
    assert owner_view["phone"] is None
    assert owner_view["notes"] is None
    assert editor_view["phone"] == "01 02 03 04 05"
    assert editor_view["notes"] == "Échange privé B"


def test_visible_contact_can_only_be_deleted_by_its_creator(client, user_a, user_b, ets):
    created = client.post(
        "/contacts", headers=user_a["headers"],
        json={"organization_id": ets["id"], "first_name": "Alice", "last_name": "Martin"},
    )
    contact_id = created.json()["id"]
    client.post(
        "/me/candidatures", headers=user_b["headers"],
        json={"etablissement_id": ets["id"], "poste": "Designer", "statut": "envoyee"},
    )

    forbidden = client.delete(f"/contacts/{contact_id}", headers=user_b["headers"])

    assert forbidden.status_code == 403
    assert client.get(f"/contacts/{contact_id}", headers=user_a["headers"]).status_code == 200
