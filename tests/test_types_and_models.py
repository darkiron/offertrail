"""Tests pour src/schemas/_types.py et src/models.py — couverture des branches manquantes."""
from uuid import UUID, uuid4

from pydantic import BaseModel

from src.schemas._types import (
    NullableUuidStr,
    OptUuidStr,
    UuidStr,
    _empty_str_to_none,
    _uuid_to_str,
)


# ── _uuid_to_str ─────────────────────────────────────────────────────────────

def test_uuid_to_str_with_none():
    assert _uuid_to_str(None) is None


def test_uuid_to_str_with_str():
    uid = str(uuid4())
    assert _uuid_to_str(uid) == uid


def test_uuid_to_str_with_uuid_object():
    uid = uuid4()
    assert _uuid_to_str(uid) == str(uid)


# ── _empty_str_to_none ───────────────────────────────────────────────────────

def test_empty_str_to_none_with_empty_string():
    assert _empty_str_to_none("") is None


def test_empty_str_to_none_with_none():
    assert _empty_str_to_none(None) is None


def test_empty_str_to_none_with_valid_uuid():
    uid = str(uuid4())
    assert _empty_str_to_none(uid) == uid


# ── Annotated types via Pydantic ─────────────────────────────────────────────

class _TestModel(BaseModel):
    uuid_str: UuidStr
    opt_uuid: OptUuidStr
    nullable_uuid: NullableUuidStr


def test_uuid_str_coerces_uuid_object():
    uid = uuid4()
    m = _TestModel(uuid_str=uid, opt_uuid=None, nullable_uuid=None)
    assert isinstance(m.uuid_str, str)
    assert m.uuid_str == str(uid)


def test_opt_uuid_str_with_none():
    uid = str(uuid4())
    m = _TestModel(uuid_str=uid, opt_uuid=None, nullable_uuid=None)
    assert m.opt_uuid is None


def test_opt_uuid_str_with_uuid_object():
    uid = uuid4()
    m = _TestModel(uuid_str=str(uid), opt_uuid=uid, nullable_uuid=None)
    assert m.opt_uuid == str(uid)


def test_nullable_uuid_str_with_empty_string():
    uid = str(uuid4())
    m = _TestModel(uuid_str=uid, opt_uuid=None, nullable_uuid="")
    assert m.nullable_uuid is None


def test_nullable_uuid_str_with_valid_uuid():
    uid = str(uuid4())
    m = _TestModel(uuid_str=uid, opt_uuid=None, nullable_uuid=uid)
    assert m.nullable_uuid == uid


# ── src/models.py — ProbiteScore.fiable ────────────────────────────────────

def test_probite_score_fiable_true(client, user_a, ets):
    """Déclenche le log_statut_change event via une update de candidature."""
    headers = user_a["headers"]
    cand_resp = client.post(
        "/candidatures",
        headers=headers,
        json={"etablissement_id": ets["id"], "poste": "Dev", "statut": "envoyee"},
    )
    cand_id = cand_resp.json()["id"]

    patch_resp = client.patch(
        f"/candidatures/{cand_id}",
        headers=headers,
        json={"statut": "entretien"},
    )
    assert patch_resp.status_code == 200

    events_resp = client.get(f"/candidatures/{cand_id}/events", headers=headers)
    event_types = [e["type"] for e in events_resp.json()]
    assert "statut_change" in event_types


def test_probite_fiable_property():
    """Teste la property fiable de ProbiteScore via la DB."""
    from src.database import SessionLocal
    from src.models import ProbiteScore, Etablissement

    db = SessionLocal()
    try:
        ets1 = Etablissement(nom="ETS Probite Fiable")
        ets2 = Etablissement(nom="ETS Probite Non Fiable")
        db.add(ets1)
        db.add(ets2)
        db.flush()

        score_fiable = ProbiteScore(
            etablissement_id=ets1.id,
            nb_candidatures=5,
            score_global=80.0,
            taux_reponse=70.0,
            ghosting_rate=10.0,
        )
        db.add(score_fiable)
        db.flush()
        assert score_fiable.fiable is True

        score_non_fiable = ProbiteScore(
            etablissement_id=ets2.id,
            nb_candidatures=2,
            score_global=60.0,
            taux_reponse=50.0,
            ghosting_rate=20.0,
        )
        db.add(score_non_fiable)
        db.flush()
        assert score_non_fiable.fiable is False
    finally:
        db.rollback()
        db.close()
