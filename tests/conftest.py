import os
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from jose import jwt

TEST_DB_PATH = Path("test_runtime_offertrail.db").resolve()
TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["OFFERTAIL_DB_PATH"] = TEST_DB_PATH.as_posix()
os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET

import sqlite3

import src.legacy_database as legacy_database
import src.main as main_module
from src.database import init_db as init_saas_db, engine, SessionLocal
from src.main import app
from src.models import Candidature, Etablissement, Profile

legacy_database.DB_PATH = TEST_DB_PATH
main_module.start_scheduler = lambda: None

init_saas_db()
legacy_database.init_db()


def make_token(user_id: str, email: str = "test@example.com") -> str:
    """Crée un JWT Supabase-compatible signé avec le secret de test."""
    return jwt.encode({"sub": user_id, "email": email}, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture(autouse=True)
def reset_databases():
    engine.dispose()
    with sqlite3.connect(TEST_DB_PATH) as conn:
        tables = [
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'"
            ).fetchall()
        ]
        conn.execute("PRAGMA foreign_keys = OFF")
        for table_name in tables:
            conn.execute(f"DELETE FROM {table_name}")
        conn.execute("DELETE FROM sqlite_sequence")
        conn.execute("PRAGMA foreign_keys = ON")
        conn.commit()
    yield
    engine.dispose()


@pytest.fixture()
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def user_a(client):
    user_id = str(uuid4())
    email = f"a-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            prenom="User",
            nom="A",
            plan="starter",
            is_active=True,
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    token = make_token(user_id, email)
    return {
        "email": email,
        "token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def user_b(client):
    user_id = str(uuid4())
    email = f"b-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        profile = Profile(
            id=user_id,
            prenom="User",
            nom="B",
            plan="starter",
            is_active=True,
        )
        db.add(profile)
        db.commit()
    finally:
        db.close()

    token = make_token(user_id, email)
    return {
        "email": email,
        "token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def ets(client, user_a):
    db = SessionLocal()
    try:
        etablissement = Etablissement(
            nom="Test Corp",
            type="autre",
            created_by=user_a["user_id"],
        )
        db.add(etablissement)
        db.flush()
        etablissement_id = etablissement.id
        db.commit()
        return {
            "id": etablissement_id,
            "nom": "Test Corp",
            "type": "AUTRE",
        }
    finally:
        db.close()


@pytest.fixture()
def candidature_a(client, user_a, ets):
    db = SessionLocal()
    try:
        candidature = Candidature(
            user_id=user_a["user_id"],
            etablissement_id=ets["id"],
            poste="Dev PHP",
            statut="envoyee",
        )
        db.add(candidature)
        db.flush()
        candidature_id = candidature.id
        db.commit()
        return {
            "id": candidature_id,
            "user_id": user_a["user_id"],
            "etablissement_id": ets["id"],
            "poste": "Dev PHP",
            "statut": "envoyee",
        }
    finally:
        db.close()
