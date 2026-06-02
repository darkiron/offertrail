"""Tests pour src/auth.py — couverture des branches manquantes."""
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from src.auth import (
    _extract_profile_names,
    _load_supabase_jwks,
    _user_can_see_contact,
    get_visible_contacts,
    start_scheduler,
    _run_probite_recompute,
)
from src.database import SessionLocal
from src.models import Candidature, Contact, Etablissement, Profile
from tests.conftest import make_token


# ── _load_supabase_jwks ──────────────────────────────────────────────────────

def test_load_supabase_jwks_no_url(monkeypatch):
    import src.auth as auth_mod
    original = auth_mod.SUPABASE_URL
    auth_mod.SUPABASE_URL = ""
    try:
        result = _load_supabase_jwks()
        assert result == []
    finally:
        auth_mod.SUPABASE_URL = original


def test_load_supabase_jwks_with_url_success(monkeypatch):
    import src.auth as auth_mod
    original = auth_mod.SUPABASE_URL
    auth_mod.SUPABASE_URL = "https://example.supabase.co"
    try:
        mock_response = MagicMock()
        mock_response.json.return_value = {"keys": [{"alg": "ES256", "kid": "key1"}]}
        with patch("src.auth.httpx.get", return_value=mock_response):
            result = _load_supabase_jwks()
        assert len(result) == 1
        assert result[0]["alg"] == "ES256"
    finally:
        auth_mod.SUPABASE_URL = original


def test_load_supabase_jwks_with_url_error(monkeypatch):
    import src.auth as auth_mod
    original = auth_mod.SUPABASE_URL
    auth_mod.SUPABASE_URL = "https://example.supabase.co"
    try:
        with patch("src.auth.httpx.get", side_effect=Exception("connection error")):
            result = _load_supabase_jwks()
        assert result == []
    finally:
        auth_mod.SUPABASE_URL = original


def test_load_supabase_jwks_empty_keys(monkeypatch):
    import src.auth as auth_mod
    original = auth_mod.SUPABASE_URL
    auth_mod.SUPABASE_URL = "https://example.supabase.co"
    try:
        mock_response = MagicMock()
        mock_response.json.return_value = {"keys": []}
        with patch("src.auth.httpx.get", return_value=mock_response):
            result = _load_supabase_jwks()
        assert result == []
    finally:
        auth_mod.SUPABASE_URL = original


# ── _extract_profile_names ───────────────────────────────────────────────────

def test_extract_profile_names_from_top_level():
    payload = {"given_name": "Alice", "family_name": "Dupont"}
    prenom, nom = _extract_profile_names(payload)
    assert prenom == "Alice"
    assert nom == "Dupont"


def test_extract_profile_names_from_user_metadata():
    payload = {"user_metadata": {"prenom": "Bob", "nom": "Martin"}}
    prenom, nom = _extract_profile_names(payload)
    assert prenom == "Bob"
    assert nom == "Martin"


def test_extract_profile_names_empty():
    payload = {}
    prenom, nom = _extract_profile_names(payload)
    assert prenom is None
    assert nom is None


def test_extract_profile_names_first_name_last_name():
    payload = {"first_name": "Charlie", "last_name": "Brown"}
    prenom, nom = _extract_profile_names(payload)
    assert prenom == "Charlie"
    assert nom == "Brown"


# ── Auth endpoints — branches manquantes ────────────────────────────────────

def test_get_current_profile_inactive_user(client):
    user_id = str(uuid4())
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            subscription_status="active",
            is_active=False,
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    token = make_token(user_id)
    resp = client.get("/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


def test_get_active_profile_subscription_not_active(client):
    user_id = str(uuid4())
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            subscription_status="pending",
            is_active=True,
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    token = make_token(user_id)
    resp = client.get("/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 402


def test_get_current_profile_new_user_auto_created(client):
    user_id = str(uuid4())
    token = make_token(user_id, "newuser@example.com")
    resp = client.get(
        "/me/stats",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code in (200, 402)


def test_get_current_profile_updates_names(client):
    user_id = str(uuid4())
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            subscription_status="active",
            is_active=True,
            prenom=None,
            nom=None,
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    from jose import jwt as jose_jwt
    from tests.conftest import TEST_JWT_SECRET
    payload = {
        "sub": user_id,
        "email": "update@example.com",
        "given_name": "Updated",
        "family_name": "Name",
    }
    token = jose_jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")
    resp = client.get("/me/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200

    db2 = SessionLocal()
    try:
        updated_profile = db2.query(Profile).filter(Profile.id == user_id).first()
        assert updated_profile.prenom == "Updated"
        assert updated_profile.nom == "Name"
    finally:
        db2.close()


# ── _user_can_see_contact ────────────────────────────────────────────────────

def test_user_can_see_contact_via_succursale():
    from src.models import Succursale
    db = MagicMock()

    contact = MagicMock()
    contact.succursale_id = "succ-1"
    contact.etablissement_id = None
    contact.created_by = "other-user"

    cand = MagicMock()
    cand.etablissement_id = "ets-1"
    cand.succursale_id = "succ-1"

    db.query.return_value.filter.return_value.all.return_value = [cand]

    result = _user_can_see_contact(db, "user-1", contact)
    assert result is True


def test_user_can_see_contact_via_etablissement():
    db = MagicMock()

    contact = MagicMock()
    contact.succursale_id = None
    contact.etablissement_id = "ets-1"
    contact.created_by = "other-user"

    cand = MagicMock()
    cand.etablissement_id = "ets-1"
    cand.succursale_id = None

    db.query.return_value.filter.return_value.all.return_value = [cand]

    result = _user_can_see_contact(db, "user-1", contact)
    assert result is True


def test_user_can_see_contact_via_created_by():
    db = MagicMock()

    contact = MagicMock()
    contact.succursale_id = None
    contact.etablissement_id = None
    contact.created_by = "user-1"

    db.query.return_value.filter.return_value.all.return_value = []

    result = _user_can_see_contact(db, "user-1", contact)
    assert result is True


def test_user_cannot_see_contact():
    db = MagicMock()

    contact = MagicMock()
    contact.succursale_id = None
    contact.etablissement_id = None
    contact.created_by = "other-user"

    db.query.return_value.filter.return_value.all.return_value = []

    result = _user_can_see_contact(db, "user-1", contact)
    assert result is False


def test_user_can_see_contact_via_siege():
    db = MagicMock()

    contact = MagicMock()
    contact.succursale_id = None
    contact.etablissement_id = "ets-contact"
    contact.created_by = "other-user"

    cand = MagicMock()
    cand.etablissement_id = "ets-user"
    cand.succursale_id = None

    ets_contact = MagicMock()
    ets_contact.created_by = "other-user"
    ets_contact.siege_id = "siege-1"

    filiale = MagicMock()
    filiale.id = "ets-user"

    def query_side_effect(model):
        mock = MagicMock()
        if model == Candidature:
            mock.filter.return_value.all.return_value = [cand]
        elif model == Etablissement:
            filter_mock = MagicMock()

            def filter_side(*args, **kwargs):
                inner = MagicMock()
                inner.first.return_value = ets_contact
                inner.all.return_value = [filiale]
                return inner

            mock.filter.side_effect = filter_side
        return mock

    db.query.side_effect = query_side_effect

    result = _user_can_see_contact(db, "user-1", contact)
    assert result is True


# ── start_scheduler / _run_probite_recompute ────────────────────────────────

def test_start_scheduler_already_running():
    import src.auth as auth_mod
    with patch("src.auth.scheduler") as mock_sched:
        mock_sched.running = True
        start_scheduler.__wrapped__ = None
        import src.auth as a
        orig_sched = a.scheduler
        a.scheduler = mock_sched
        try:
            start_scheduler()
        finally:
            a.scheduler = orig_sched


def test_start_scheduler_not_running():
    import src.auth as a
    with patch("src.auth.scheduler") as mock_sched:
        mock_sched.running = False
        orig_sched = a.scheduler
        a.scheduler = mock_sched
        try:
            start_scheduler()
        finally:
            a.scheduler = orig_sched
        mock_sched.add_job.assert_called_once()
        mock_sched.start.assert_called_once()


def test_run_probite_recompute():
    with patch("src.auth.SessionLocal") as mock_session, \
         patch("src.services.probite.recompute_probite_scores") as mock_recompute:
        mock_db = MagicMock()
        mock_session.return_value = mock_db
        _run_probite_recompute()
        mock_db.close.assert_called_once()
