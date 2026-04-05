import os
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

TEST_DB_PATH = Path("test_runtime_offertrail.db").resolve()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["OFFERTAIL_DB_PATH"] = TEST_DB_PATH.as_posix()

import sqlite3

import src.legacy_database as legacy_database
import src.main as main_module
from src.auth import create_access_token, hash_password
from src.database import init_db as init_saas_db, engine, SessionLocal
from src.main import app
from src.models import Candidature, Etablissement, PasswordResetToken, User
from src.routers.auth import limiter

legacy_database.DB_PATH = TEST_DB_PATH
main_module.start_scheduler = lambda: None

init_saas_db()
legacy_database.init_db()


@pytest.fixture(autouse=True)
def reset_databases():
    limiter._storage.reset()
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
    email = f"a-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        user = User(
            email=email,
            hashed_password=hash_password("password123"),
            prenom="User",
            nom="A",
            plan="starter",
            is_active=True,
        )
        db.add(user)
        db.flush()
        user_id = user.id
        db.commit()
    finally:
        db.close()

    token = create_access_token(user_id, email)
    return {
        "email": email,
        "token": token,
        "user_id": user_id,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture()
def user_b(client):
    email = f"b-{uuid4().hex}@example.com"
    db = SessionLocal()
    try:
        user = User(
            email=email,
            hashed_password=hash_password("password123"),
            prenom="User",
            nom="B",
            plan="starter",
            is_active=True,
        )
        db.add(user)
        db.flush()
        user_id = user.id
        db.commit()
    finally:
        db.close()

    token = create_access_token(user_id, email)
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


@pytest.fixture()
def reset_token_factory(db_session):
    def factory(email: str | None = None, token: str = "valid-reset-token-123"):
        from datetime import datetime, timedelta

        if email is None:
            email = f"reset-{uuid4().hex}@example.com"

        user = User(
            email=email,
            hashed_password=hash_password("oldpassword123"),
            plan="starter",
            is_active=True,
        )
        db_session.add(user)
        db_session.flush()

        reset = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )
        db_session.add(reset)
        db_session.commit()
        return user, reset

    return factory
