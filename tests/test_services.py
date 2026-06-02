"""Tests pour les services email, probite et les schemas auth."""
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from src.schemas.auth import ProfileSchema, ProfileUpdate
from src.services.email import send_password_reset
from src.services.probite import (
    _compute_score,
    get_probite_for_ets,
    recompute_probite_scores,
)


# ── schemas/auth.py ─────────────────────────────────────────────────────────

def test_profile_update_schema_all_none():
    schema = ProfileUpdate()
    assert schema.prenom is None
    assert schema.nom is None


def test_profile_update_schema_with_values():
    schema = ProfileUpdate(prenom="Alice", nom="Dupont")
    assert schema.prenom == "Alice"
    assert schema.nom == "Dupont"


def test_profile_schema_creation():
    now = datetime.now()
    schema = ProfileSchema(
        id="some-uuid",
        prenom="Alice",
        nom="Dupont",
        plan="free",
        role="user",
        plan_started_at=now,
        created_at=now,
    )
    assert schema.id == "some-uuid"
    assert schema.plan == "free"
    assert schema.role == "user"


def test_profile_schema_optional_fields():
    schema = ProfileSchema(id="some-uuid", prenom=None, nom=None, plan="free", role="user")
    assert schema.prenom is None
    assert schema.nom is None
    assert schema.plan_started_at is None
    assert schema.created_at is None


# ── services/email.py ───────────────────────────────────────────────────────

def test_send_password_reset_no_api_key(caplog):
    """Sans RESEND_API_KEY, la fonction simule et retourne True."""
    import src.services.email as email_mod
    original = email_mod.resend.api_key
    email_mod.resend.api_key = ""
    try:
        with caplog.at_level("INFO"):
            result = send_password_reset("test@example.com", "https://example.com/reset")
        assert result is True
        assert "test@example.com" in caplog.text
    finally:
        email_mod.resend.api_key = original


def test_send_password_reset_with_api_key_success():
    """Avec RESEND_API_KEY, appelle resend.Emails.send et retourne True."""
    import src.services.email as email_mod
    original = email_mod.resend.api_key
    email_mod.resend.api_key = "fake-key"
    try:
        with patch("src.services.email.resend.Emails.send") as mock_send:
            mock_send.return_value = {"id": "email-id"}
            result = send_password_reset("test@example.com", "https://example.com/reset")
        assert result is True
        mock_send.assert_called_once()
    finally:
        email_mod.resend.api_key = original


def test_send_password_reset_with_api_key_failure():
    """Si resend.Emails.send lève une exception, retourne False."""
    import src.services.email as email_mod
    original = email_mod.resend.api_key
    email_mod.resend.api_key = "fake-key"
    try:
        with patch("src.services.email.resend.Emails.send", side_effect=Exception("API error")):
            result = send_password_reset("test@example.com", "https://example.com/reset")
        assert result is False
    finally:
        email_mod.resend.api_key = original


# ── services/probite.py ─────────────────────────────────────────────────────

def _make_candidature(statut, date_candidature=None, date_reponse=None, user_id="u1", ets_id="e1"):
    c = MagicMock()
    c.statut = statut
    c.date_candidature = date_candidature
    c.date_reponse = date_reponse
    c.user_id = user_id
    c.etablissement_id = ets_id
    c.client_final_id = None
    return c


def test_compute_score_basic():
    from src.enums import CandidatureStatut
    base_date = datetime(2024, 1, 1)
    cands = [
        _make_candidature(CandidatureStatut.ENVOYEE, base_date, base_date + timedelta(days=5)),
        _make_candidature(CandidatureStatut.ENVOYEE, base_date),
        _make_candidature(CandidatureStatut.REFUSEE, base_date),
    ]
    result = _compute_score(cands)
    assert "score_global" in result
    assert "taux_reponse" in result
    assert "ghosting_rate" in result
    assert result["nb_candidatures"] == 3
    assert result["nb_users_uniques"] == 1


def test_compute_score_no_response():
    from src.enums import CandidatureStatut
    cands = [_make_candidature(CandidatureStatut.ENVOYEE)]
    result = _compute_score(cands)
    assert result["taux_reponse"] == 0.0
    assert result["delai_moyen_reponse"] is None


def test_compute_score_delay_over_max():
    from src.enums import CandidatureStatut
    base_date = datetime(2024, 1, 1)
    cands = [
        _make_candidature(CandidatureStatut.ENVOYEE, base_date, base_date + timedelta(days=60)),
    ]
    result = _compute_score(cands)
    assert result["score_global"] >= 0


def test_recompute_probite_scores_empty_db():
    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = []
    result = recompute_probite_scores(db)
    assert result == 0


def test_recompute_probite_scores_creates_new():
    from src.enums import CandidatureStatut
    from src.models import ProbiteScore
    base_date = datetime(2024, 1, 1)
    cand = _make_candidature(CandidatureStatut.ENVOYEE, base_date, base_date + timedelta(days=3))
    cand.etablissement_id = "ets-1"
    cand.client_final_id = None

    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = [cand]
    db.query.return_value.filter.return_value.first.return_value = None

    result = recompute_probite_scores(db)
    assert result == 1
    db.add.assert_called_once()
    db.commit.assert_called_once()


def test_recompute_probite_scores_updates_existing():
    from src.enums import CandidatureStatut
    base_date = datetime(2024, 1, 1)
    cand = _make_candidature(CandidatureStatut.ENVOYEE, base_date, base_date + timedelta(days=3))
    cand.etablissement_id = "ets-1"
    cand.client_final_id = None

    existing = MagicMock()
    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = [cand]
    db.query.return_value.filter.return_value.first.return_value = existing

    result = recompute_probite_scores(db)
    assert result == 1
    assert existing.score_global is not None
    db.commit.assert_called_once()


def test_recompute_probite_uses_client_final_id():
    from src.enums import CandidatureStatut
    base_date = datetime(2024, 1, 1)
    cand = _make_candidature(CandidatureStatut.ENVOYEE, base_date, base_date + timedelta(days=3))
    cand.client_final_id = "client-final-1"
    cand.etablissement_id = "ets-1"

    db = MagicMock()
    db.query.return_value.filter.return_value.all.return_value = [cand]
    db.query.return_value.filter.return_value.first.return_value = None

    recompute_probite_scores(db)
    added_score = db.add.call_args[0][0]
    assert added_score.etablissement_id == "client-final-1"


def test_get_probite_for_ets_not_found():
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = None
    result = get_probite_for_ets(db, "ets-1")
    assert result is None


def test_get_probite_for_ets_not_fiable():
    db = MagicMock()
    score = MagicMock()
    score.fiable = False
    score.nb_candidatures = 1
    db.query.return_value.filter.return_value.first.return_value = score
    result = get_probite_for_ets(db, "ets-1")
    assert result is not None
    assert result["fiable"] is False
    assert "message" in result


def test_get_probite_for_ets_fiable():
    db = MagicMock()
    score = MagicMock()
    score.fiable = True
    score.score_global = 85.0
    score.taux_reponse = 70.0
    score.delai_moyen_reponse = 5.0
    score.ghosting_rate = 10.0
    score.nb_candidatures = 5
    score.nb_users_uniques = 3
    score.last_computed_at = datetime(2024, 6, 1, 12, 0, 0)
    db.query.return_value.filter.return_value.first.return_value = score
    result = get_probite_for_ets(db, "ets-1")
    assert result["fiable"] is True
    assert result["score_global"] == 85.0
    assert result["last_computed_at"] == "2024-06-01T12:00:00"
