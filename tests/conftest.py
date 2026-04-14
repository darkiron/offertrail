import os
import asyncio
import json
from pathlib import Path
from typing import Any
from urllib.parse import urlencode, urlsplit
from uuid import uuid4

import pytest
import httpx
from jose import jwt

TEST_DB_PATH = Path("test_runtime_offertrail.db").resolve()
TEST_JWT_SECRET = "test-jwt-secret-for-testing-only"

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["OFFERTAIL_DB_PATH"] = TEST_DB_PATH.as_posix()
os.environ["SUPABASE_JWT_SECRET"] = TEST_JWT_SECRET

import sqlite3

import fastapi.dependencies.utils
import fastapi.concurrency
import fastapi.routing
import fastapi.testclient
import starlette.concurrency
import anyio.to_thread
import src.legacy_database as legacy_database
import src.main as main_module
from src.database import init_db as init_saas_db, engine, SessionLocal
from src.main import app
from src.models import Candidature, Etablissement, Profile
from contextlib import asynccontextmanager

legacy_database.DB_PATH = TEST_DB_PATH
main_module.start_scheduler = lambda: None


async def _run_sync_inline(func, *args, **kwargs):
    return func(*args, **kwargs)


async def _run_sync_inline_anyio(func, *args, **kwargs):
    kwargs.pop("limiter", None)
    return func(*args, **kwargs)


@asynccontextmanager
async def _contextmanager_inline(cm):
    value = cm.__enter__()
    try:
        yield value
    except Exception as exc:
        suppress = cm.__exit__(type(exc), exc, None)
        if not suppress:
            raise
    else:
        cm.__exit__(None, None, None)


# Le threadpool anyio bloque dans cet environnement de test.
# On exécute donc les handlers sync inline pour garder TestClient utilisable.
fastapi.routing.run_in_threadpool = _run_sync_inline
fastapi.dependencies.utils.run_in_threadpool = _run_sync_inline
fastapi.concurrency.contextmanager_in_threadpool = _contextmanager_inline
starlette.concurrency.run_in_threadpool = _run_sync_inline
anyio.to_thread.run_sync = _run_sync_inline_anyio


class PatchedTestClient:
    def __init__(self, app, base_url: str = "http://testserver"):
        self.app = app
        self.base_url = base_url.rstrip("/")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def close(self):
        return None

    def get(self, url: str, **kwargs):
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs):
        return self.request("POST", url, **kwargs)

    def patch(self, url: str, **kwargs):
        return self.request("PATCH", url, **kwargs)

    def delete(self, url: str, **kwargs):
        return self.request("DELETE", url, **kwargs)

    def request(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str] | None = None,
        json: Any = None,
        data: Any = None,
        content: bytes | str | None = None,
        params: dict[str, Any] | None = None,
        follow_redirects: bool = True,
    ) -> httpx.Response:
        return asyncio.run(
            self._request(
                method,
                url,
                headers=headers,
                json=json,
                data=data,
                content=content,
                params=params,
                follow_redirects=follow_redirects,
            )
        )

    async def _request(
        self,
        method: str,
        url: str,
        *,
        headers: dict[str, str] | None,
        json: Any,
        data: Any,
        content: bytes | str | None,
        params: dict[str, Any] | None,
        follow_redirects: bool,
    ) -> httpx.Response:
        split = urlsplit(url)
        path = split.path or "/"
        query = split.query
        if params:
            encoded = urlencode(params, doseq=True)
            query = f"{query}&{encoded}" if query else encoded

        body = b""
        request_headers = {k.lower(): v for k, v in (headers or {}).items()}

        if json is not None:
            body = __import__("json").dumps(json).encode("utf-8")
            request_headers.setdefault("content-type", "application/json")
        elif data is not None:
            if isinstance(data, dict):
                body = urlencode(data, doseq=True).encode("utf-8")
                request_headers.setdefault("content-type", "application/x-www-form-urlencoded")
            elif isinstance(data, bytes):
                body = data
            else:
                body = str(data).encode("utf-8")
        elif content is not None:
            body = content.encode("utf-8") if isinstance(content, str) else content

        if body:
            request_headers.setdefault("content-length", str(len(body)))

        sent_request = False

        async def receive():
            nonlocal sent_request
            if sent_request:
                return {"type": "http.disconnect"}
            sent_request = True
            return {"type": "http.request", "body": body, "more_body": False}

        messages: list[dict[str, Any]] = []

        async def send(message):
            messages.append(message)

        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": method.upper(),
            "scheme": "http",
            "path": path,
            "raw_path": path.encode("utf-8"),
            "query_string": query.encode("utf-8"),
            "headers": [(k.encode("latin-1"), v.encode("latin-1")) for k, v in request_headers.items()],
            "client": ("127.0.0.1", 123),
            "server": ("testserver", 80),
            "root_path": "",
        }

        await self.app(scope, receive, send)

        start = next(message for message in messages if message["type"] == "http.response.start")
        response_body = b"".join(
            message.get("body", b"")
            for message in messages
            if message["type"] == "http.response.body"
        )
        response_headers = {
            key.decode("latin-1"): value.decode("latin-1")
            for key, value in start.get("headers", [])
        }
        request = httpx.Request(method.upper(), f"{self.base_url}{path}{f'?{query}' if query else ''}")
        response = httpx.Response(
            status_code=start["status"],
            headers=response_headers,
            content=response_body,
            request=request,
        )

        if follow_redirects and response.status_code in {301, 302, 303, 307, 308} and "location" in response.headers:
            redirect_method = method if response.status_code in {307, 308} else "GET"
            return await self._request(
                redirect_method,
                response.headers["location"],
                headers=headers,
                json=None,
                data=None,
                content=None,
                params=None,
                follow_redirects=True,
            )

        return response


fastapi.testclient.TestClient = PatchedTestClient

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
    with PatchedTestClient(app) as test_client:
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
