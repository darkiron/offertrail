import sqlite3
import json
import httpx
from datetime import datetime, timezone, timedelta
from pathlib import Path
from xml.etree import ElementTree

DB_PATH = Path("offertrail.db")

JOB_BACKLOG_STATUS_NEW = "NEW"
JOB_BACKLOG_STATUS_IMPORTED = "IMPORTED"
JOB_BACKLOG_STATUS_REJECTED = "REJECTED"

JOB_SOURCE_MOCK = "mock-board"
JOB_SOURCE_WWR = "wwr-rss"

WWR_RSS_FEEDS = {
    "ALL": "https://weworkremotely.com/remote-jobs.rss",
    "PROGRAMMING": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    "BACKEND": "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss",
    "FRONTEND": "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
    "FULLSTACK": "https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss",
    "DEVOPS": "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
}

DEFAULT_JOB_SOURCES = [
    {
        "slug": JOB_SOURCE_MOCK,
        "name": "Mock board",
        "kind": "mock",
        "uri": None,
        "config": {},
    },
    {
        "slug": JOB_SOURCE_WWR,
        "name": "We Work Remotely RSS",
        "kind": "rss",
        "uri": WWR_RSS_FEEDS["PROGRAMMING"],
        "config": {"feed_key": "PROGRAMMING"},
    },
]

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS organizations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL DEFAULT 'AUTRE',
                website TEXT,
                linkedin_url TEXT,
                city TEXT,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organization_id INTEGER,
                final_customer_organization_id INTEGER,
                company TEXT NOT NULL, -- Keep for compatibility during transition
                title TEXT NOT NULL,
                type TEXT NOT NULL, -- CDI|FREELANCE
                status TEXT NOT NULL,
                source TEXT,
                job_url TEXT,
                applied_at TEXT,
                next_followup_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (organization_id) REFERENCES organizations (id),
                FOREIGN KEY (final_customer_organization_id) REFERENCES organizations (id)
            )
        """)
        application_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(applications)").fetchall()
        }
        if "final_customer_organization_id" not in application_columns:
            conn.execute("ALTER TABLE applications ADD COLUMN final_customer_organization_id INTEGER")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                organization_id INTEGER,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                role TEXT,
                is_recruiter INTEGER NOT NULL DEFAULT 0,
                linkedin_url TEXT,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (organization_id) REFERENCES organizations (id)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS application_contacts (
                application_id INTEGER NOT NULL,
                contact_id INTEGER NOT NULL,
                PRIMARY KEY (application_id, contact_id),
                FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                payload_json TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                kind TEXT NOT NULL,
                uri TEXT,
                config_json TEXT NOT NULL DEFAULT '{}',
                is_enabled INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        job_source_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(job_sources)").fetchall()
        }
        if "uri" not in job_source_columns:
            conn.execute("ALTER TABLE job_sources ADD COLUMN uri TEXT")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_searches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                source_id INTEGER,
                source TEXT NOT NULL DEFAULT 'mock-board',
                source_config_json TEXT NOT NULL DEFAULT '{}',
                keywords_json TEXT NOT NULL,
                excluded_keywords_json TEXT NOT NULL DEFAULT '[]',
                locations_json TEXT NOT NULL DEFAULT '[]',
                contract_type TEXT NOT NULL DEFAULT 'CDI',
                remote_mode TEXT NOT NULL DEFAULT 'ANY',
                profile_summary TEXT,
                min_score INTEGER NOT NULL DEFAULT 60,
                auto_import INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (source_id) REFERENCES job_sources (id) ON DELETE SET NULL
            )
        """)
        job_search_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(job_searches)").fetchall()
        }
        if "source_id" not in job_search_columns:
            conn.execute("ALTER TABLE job_searches ADD COLUMN source_id INTEGER")
        if "source" not in job_search_columns:
            conn.execute("ALTER TABLE job_searches ADD COLUMN source TEXT NOT NULL DEFAULT 'mock-board'")
        if "source_config_json" not in job_search_columns:
            conn.execute("ALTER TABLE job_searches ADD COLUMN source_config_json TEXT NOT NULL DEFAULT '{}'")
        _ensure_default_job_sources(conn)
        _backfill_job_search_sources(conn)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_backlog_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER NOT NULL,
                source TEXT NOT NULL,
                status TEXT NOT NULL,
                fetched_count INTEGER NOT NULL DEFAULT 0,
                created_count INTEGER NOT NULL DEFAULT 0,
                imported_count INTEGER NOT NULL DEFAULT 0,
                error_text TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (search_id) REFERENCES job_searches (id) ON DELETE CASCADE
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_backlog_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id INTEGER NOT NULL,
                run_id INTEGER,
                source TEXT NOT NULL,
                external_id TEXT NOT NULL,
                title TEXT NOT NULL,
                company TEXT NOT NULL,
                location TEXT,
                remote_mode TEXT,
                contract_type TEXT,
                url TEXT,
                description TEXT,
                published_at TEXT,
                salary_text TEXT,
                score REAL NOT NULL DEFAULT 0,
                match_reasons_json TEXT NOT NULL DEFAULT '[]',
                status TEXT NOT NULL DEFAULT 'NEW',
                raw_payload_json TEXT NOT NULL DEFAULT '{}',
                imported_application_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(source, external_id),
                FOREIGN KEY (search_id) REFERENCES job_searches (id) ON DELETE CASCADE,
                FOREIGN KEY (run_id) REFERENCES job_backlog_runs (id) ON DELETE SET NULL,
                FOREIGN KEY (imported_application_id) REFERENCES applications (id) ON DELETE SET NULL
            )
        """)
        conn.commit()

def _utc_now():
    return datetime.now(timezone.utc).isoformat()

def _ensure_default_job_sources(conn):
    now = _utc_now()
    for source in DEFAULT_JOB_SOURCES:
        existing = conn.execute("SELECT id FROM job_sources WHERE slug = ?", (source["slug"],)).fetchone()
        if existing:
            conn.execute(
                "UPDATE job_sources SET name = ?, kind = ?, uri = ?, config_json = ?, updated_at = ? WHERE slug = ?",
                (source["name"], source["kind"], source["uri"], json.dumps(source["config"]), now, source["slug"])
            )
            continue
        conn.execute(
            """
            INSERT INTO job_sources (slug, name, kind, uri, config_json, is_enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 1, ?, ?)
            """,
            (source["slug"], source["name"], source["kind"], source["uri"], json.dumps(source["config"]), now, now)
        )

def _backfill_job_search_sources(conn):
    rows = conn.execute("SELECT id, source FROM job_searches WHERE source_id IS NULL").fetchall()
    for row in rows:
        source_slug = row["source"] or JOB_SOURCE_MOCK
        source = conn.execute("SELECT id FROM job_sources WHERE slug = ?", (source_slug,)).fetchone()
        if source:
            conn.execute("UPDATE job_searches SET source_id = ? WHERE id = ?", (source["id"], row["id"]))

def _json_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [part.strip() for part in str(value).split(",") if part.strip()]

def _decode_json_list(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [str(item) for item in parsed]

def _serialize_job_search(row):
    data = dict(row)
    try:
        data["source_config"] = json.loads(data.pop("source_config_json", "{}"))
    except json.JSONDecodeError:
        data["source_config"] = {}
    data["keywords"] = _decode_json_list(data.pop("keywords_json", "[]"))
    data["excluded_keywords"] = _decode_json_list(data.pop("excluded_keywords_json", "[]"))
    data["locations"] = _decode_json_list(data.pop("locations_json", "[]"))
    data["auto_import"] = bool(data.get("auto_import"))
    return data

def _serialize_job_source(row):
    data = dict(row)
    try:
        data["config"] = json.loads(data.pop("config_json", "{}"))
    except json.JSONDecodeError:
        data["config"] = {}
    data["is_enabled"] = bool(data.get("is_enabled"))
    return data

def _serialize_job_backlog_item(row):
    data = dict(row)
    try:
        data["match_reasons"] = json.loads(data.pop("match_reasons_json", "[]"))
    except json.JSONDecodeError:
        data["match_reasons"] = []
    try:
        data["raw_payload"] = json.loads(data.pop("raw_payload_json", "{}"))
    except json.JSONDecodeError:
        data["raw_payload"] = {}
    return data

def _tokenize_text(value):
    normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in (value or ""))
    return {part for part in normalized.split() if part}

def _build_mock_job_catalog():
    return [
        {
            "source": "mock-board",
            "external_id": "mock-001",
            "title": "Python Backend Engineer",
            "company": "Blue Signal",
            "location": "Paris",
            "remote_mode": "HYBRID",
            "contract_type": "CDI",
            "url": "https://example.com/jobs/mock-001",
            "description": "FastAPI, Python, APIs, PostgreSQL, backend ownership, product mindset.",
            "published_at": "2026-03-20",
            "salary_text": "55k-65k",
        },
        {
            "source": "mock-board",
            "external_id": "mock-002",
            "title": "React Frontend Engineer",
            "company": "Northwind Studio",
            "location": "Lyon",
            "remote_mode": "REMOTE",
            "contract_type": "CDI",
            "url": "https://example.com/jobs/mock-002",
            "description": "React, TypeScript, design systems, dashboard UX, product collaboration.",
            "published_at": "2026-03-21",
            "salary_text": "50k-60k",
        },
        {
            "source": "mock-board",
            "external_id": "mock-003",
            "title": "Freelance DevOps Consultant",
            "company": "Cloud Peak",
            "location": "Remote",
            "remote_mode": "REMOTE",
            "contract_type": "FREELANCE",
            "url": "https://example.com/jobs/mock-003",
            "description": "Terraform, AWS, Kubernetes, CI/CD, freelance mission, 6 months.",
            "published_at": "2026-03-19",
            "salary_text": "650/day",
        },
        {
            "source": "mock-board",
            "external_id": "mock-004",
            "title": "Data Analyst",
            "company": "Quiet Metrics",
            "location": "Bordeaux",
            "remote_mode": "ONSITE",
            "contract_type": "CDI",
            "url": "https://example.com/jobs/mock-004",
            "description": "SQL, BI, dashboards, stakeholder communication.",
            "published_at": "2026-03-18",
            "salary_text": "45k-52k",
        },
    ]

def _extract_rss_text(element, tag_name):
    value = element.findtext(tag_name)
    return value.strip() if isinstance(value, str) else None

def _fetch_wwr_rss_items(source_config=None):
    source_config = source_config or {}
    feed_key = str(source_config.get("feed_key") or "PROGRAMMING").upper()
    feed_url = WWR_RSS_FEEDS.get(feed_key, WWR_RSS_FEEDS["PROGRAMMING"])
    with httpx.Client(timeout=15.0, follow_redirects=True) as client:
        response = client.get(feed_url, headers={"User-Agent": "OfferTrail/1.0 (+local backlog ingestion)"})
        response.raise_for_status()

    root = ElementTree.fromstring(response.text)
    channel = root.find("channel")
    if channel is None:
        return []

    items = []
    for node in channel.findall("item"):
        title = _extract_rss_text(node, "title") or "Untitled role"
        link = _extract_rss_text(node, "link")
        guid = _extract_rss_text(node, "guid") or link or title
        description = _extract_rss_text(node, "description") or ""
        pub_date = _extract_rss_text(node, "pubDate")

        company = "Unknown company"
        role_title = title
        if ": " in title:
            company, role_title = title.split(": ", 1)
        elif " at " in title:
            role_title, company = title.rsplit(" at ", 1)

        lowered = f"{title} {description}".lower()
        contract_type = "FREELANCE" if "contract" in lowered or "freelance" in lowered else "CDI"
        remote_mode = "REMOTE"

        items.append({
            "source": JOB_SOURCE_WWR,
            "external_id": guid,
            "title": role_title.strip(),
            "company": company.strip(),
            "location": "Remote",
            "remote_mode": remote_mode,
            "contract_type": contract_type,
            "url": link,
            "description": description,
            "published_at": pub_date,
            "salary_text": None,
        })
    return items

def _fetch_job_catalog(source, source_config=None):
    if source == JOB_SOURCE_WWR:
        return _fetch_wwr_rss_items(source_config)
    return _build_mock_job_catalog()

def _score_job_backlog_item(search, item):
    haystack = " ".join([
        item.get("title", ""),
        item.get("company", ""),
        item.get("location", ""),
        item.get("description", ""),
        item.get("contract_type", ""),
        item.get("remote_mode", ""),
    ])
    tokens = _tokenize_text(haystack)
    reasons = []
    score = 0
    keyword_hits = 0

    for keyword in search["keywords"]:
        keyword_tokens = _tokenize_text(keyword)
        if keyword_tokens and keyword_tokens.issubset(tokens):
            score += 25
            reasons.append(f"keyword:{keyword}")
            keyword_hits += 1

    for keyword in search["excluded_keywords"]:
        keyword_tokens = _tokenize_text(keyword)
        if keyword_tokens and keyword_tokens.issubset(tokens):
            score -= 80
            reasons.append(f"exclude:{keyword}")

    if search["contract_type"] and search["contract_type"] != "ANY":
        if (item.get("contract_type") or "").upper() == search["contract_type"].upper():
            score += 15
            reasons.append(f"contract:{search['contract_type']}")
        else:
            score -= 10

    if search["remote_mode"] and search["remote_mode"] != "ANY":
        if (item.get("remote_mode") or "").upper() == search["remote_mode"].upper():
            score += 10
            reasons.append(f"remote:{search['remote_mode']}")

    if search["locations"]:
        item_location = (item.get("location") or "").lower()
        if any(location.lower() in item_location for location in search["locations"]):
            score += 10
            reasons.append("location-match")

    if search.get("profile_summary"):
        profile_tokens = _tokenize_text(search["profile_summary"])
        overlap = len(tokens.intersection(profile_tokens))
        if overlap >= 3:
            score += min(15, overlap * 2)
            reasons.append(f"profile-overlap:{overlap}")

    if search["keywords"] and keyword_hits == 0:
        score = 0
        reasons.append("no-keyword-hit")

    if score < 0:
        score = 0
    return min(score, 100), reasons

def list_job_searches():
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT js.*, src.name AS source_name, src.slug AS source_slug, src.kind AS source_kind
            FROM job_searches js
            LEFT JOIN job_sources src ON src.id = js.source_id
            ORDER BY js.updated_at DESC, js.id DESC
            """
        ).fetchall()
        return [_serialize_job_search(row) for row in rows]

def list_job_sources():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM job_sources ORDER BY updated_at DESC, id DESC").fetchall()
        return [_serialize_job_source(row) for row in rows]

def create_job_source(name, slug, kind, uri=None, config=None, is_enabled=True):
    now = _utc_now()
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO job_sources (slug, name, kind, uri, config_json, is_enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                slug.strip(),
                name.strip(),
                kind.strip(),
                uri,
                json.dumps(config or {}),
                1 if is_enabled else 0,
                now,
                now,
            )
        )
        source_id = cursor.lastrowid
        conn.commit()
        row = conn.execute("SELECT * FROM job_sources WHERE id = ?", (source_id,)).fetchone()
        return _serialize_job_source(row)

def update_job_source(source_id, data):
    now = _utc_now()
    fields = []
    params = []
    for key, value in data.items():
        if key == "config":
            fields.append("config_json = ?")
            params.append(json.dumps(value or {}))
        elif key == "uri":
            fields.append("uri = ?")
            params.append(value)
        elif key in {"slug", "name", "kind"}:
            fields.append(f"{key} = ?")
            params.append(str(value).strip())
        elif key == "is_enabled":
            fields.append("is_enabled = ?")
            params.append(1 if value else 0)
    if not fields:
        return False
    fields.append("updated_at = ?")
    params.append(now)
    params.append(source_id)
    with get_db() as conn:
        conn.execute(f"UPDATE job_sources SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()
        return True

def delete_job_source(source_id):
    with get_db() as conn:
        search_count = conn.execute("SELECT COUNT(*) FROM job_searches WHERE source_id = ?", (source_id,)).fetchone()[0]
        if search_count > 0:
            return False
        conn.execute("DELETE FROM job_sources WHERE id = ?", (source_id,))
        conn.commit()
        return True

def update_job_search(search_id, data):
    now = _utc_now()
    fields = []
    params = []
    for key, value in data.items():
        if key == "keywords":
            fields.append("keywords_json = ?")
            params.append(json.dumps(_json_list(value)))
        elif key == "excluded_keywords":
            fields.append("excluded_keywords_json = ?")
            params.append(json.dumps(_json_list(value)))
        elif key == "locations":
            fields.append("locations_json = ?")
            params.append(json.dumps(_json_list(value)))
        elif key == "source_config":
            fields.append("source_config_json = ?")
            params.append(json.dumps(value or {}))
        elif key == "source_id":
            fields.append("source_id = ?")
            params.append(value)
        elif key in {"name", "source", "contract_type", "remote_mode", "profile_summary", "min_score"}:
            fields.append(f"{key} = ?")
            params.append(value)
        elif key == "auto_import":
            fields.append("auto_import = ?")
            params.append(1 if value else 0)
    if not fields:
        return False
    fields.append("updated_at = ?")
    params.append(now)
    params.append(search_id)
    with get_db() as conn:
        conn.execute(f"UPDATE job_searches SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()
        return True

def delete_job_search(search_id):
    with get_db() as conn:
        conn.execute("DELETE FROM job_searches WHERE id = ?", (search_id,))
        conn.commit()
        return True

def create_job_search(name, keywords, excluded_keywords=None, locations=None, contract_type="CDI", remote_mode="ANY", profile_summary=None, min_score=60, auto_import=False, source=JOB_SOURCE_MOCK, source_config=None, source_id=None):
    now = _utc_now()
    with get_db() as conn:
        resolved_source_id = source_id
        source_row = None
        if resolved_source_id:
            source_row = conn.execute("SELECT * FROM job_sources WHERE id = ?", (resolved_source_id,)).fetchone()
        elif source:
            source_row = conn.execute("SELECT * FROM job_sources WHERE slug = ?", (source,)).fetchone()
            if source_row:
                resolved_source_id = source_row["id"]

        if source_row:
            source = source_row["slug"]
            if not source_config:
                try:
                    source_config = json.loads(source_row["config_json"])
                except json.JSONDecodeError:
                    source_config = {}

        cursor = conn.execute(
            """
            INSERT INTO job_searches (
                name, source_id, source, source_config_json, keywords_json, excluded_keywords_json, locations_json, contract_type,
                remote_mode, profile_summary, min_score, auto_import, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name.strip(),
                resolved_source_id,
                source or JOB_SOURCE_MOCK,
                json.dumps(source_config or {}),
                json.dumps(_json_list(keywords)),
                json.dumps(_json_list(excluded_keywords)),
                json.dumps(_json_list(locations)),
                contract_type or "CDI",
                remote_mode or "ANY",
                profile_summary,
                int(min_score),
                1 if auto_import else 0,
                now,
                now,
            )
        )
        search_id = cursor.lastrowid
        conn.commit()
        row = conn.execute(
            """
            SELECT js.*, src.name AS source_name, src.slug AS source_slug, src.kind AS source_kind
            FROM job_searches js
            LEFT JOIN job_sources src ON src.id = js.source_id
            WHERE js.id = ?
            """,
            (search_id,)
        ).fetchone()
        return _serialize_job_search(row)

def get_job_search(search_id):
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT js.*, src.name AS source_name, src.slug AS source_slug, src.kind AS source_kind
            FROM job_searches js
            LEFT JOIN job_sources src ON src.id = js.source_id
            WHERE js.id = ?
            """,
            (search_id,)
        ).fetchone()
        return _serialize_job_search(row) if row else None

def list_job_backlog_items(search_id=None, status=None, source_id=None):
    query = """
        SELECT bi.*, jr.created_at AS run_created_at, js.source_id
        FROM job_backlog_items bi
        LEFT JOIN job_backlog_runs jr ON jr.id = bi.run_id
        LEFT JOIN job_searches js ON js.id = bi.search_id
    """
    params = []
    clauses = []
    if search_id:
        clauses.append("bi.search_id = ?")
        params.append(search_id)
    if source_id:
        clauses.append("js.source_id = ?")
        params.append(source_id)
    if status:
        clauses.append("bi.status = ?")
        params.append(status)
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY bi.score DESC, bi.updated_at DESC, bi.id DESC"
    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return [_serialize_job_backlog_item(row) for row in rows]

def list_job_backlog_runs(search_id=None):
    query = "SELECT * FROM job_backlog_runs"
    params = []
    if search_id:
        query += " WHERE search_id = ?"
        params.append(search_id)
    query += " ORDER BY created_at DESC, id DESC"
    with get_db() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def run_job_search(search_id):
    search = get_job_search(search_id)
    if not search:
        return None

    now = _utc_now()
    try:
        catalog = _fetch_job_catalog(search["source"], search.get("source_config"))
    except Exception as exc:
        with get_db() as conn:
            cursor = conn.execute(
                """
                INSERT INTO job_backlog_runs (search_id, source, status, fetched_count, created_count, imported_count, error_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (search_id, search["source"], "FAILED", 0, 0, 0, str(exc), now)
            )
            conn.commit()
            run_id = cursor.lastrowid
        return {
            "run_id": run_id,
            "search": search,
            "fetched_count": 0,
            "created_count": 0,
            "imported_count": 0,
            "error": str(exc),
            "items": list_job_backlog_items(search_id=search_id),
        }
    created_count = 0
    imported_count = 0

    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO job_backlog_runs (search_id, source, status, fetched_count, created_count, imported_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (search_id, search["source"], "SUCCESS", len(catalog), 0, 0, now)
        )
        run_id = cursor.lastrowid

        for item in catalog:
            score, reasons = _score_job_backlog_item(search, item)
            status = JOB_BACKLOG_STATUS_NEW if score >= search["min_score"] else JOB_BACKLOG_STATUS_REJECTED
            existing = conn.execute(
                "SELECT id, status, imported_application_id FROM job_backlog_items WHERE source = ? AND external_id = ?",
                (item["source"], item["external_id"])
            ).fetchone()

            payload = (
                search_id,
                run_id,
                item["source"],
                item["external_id"],
                item["title"],
                item["company"],
                item["location"],
                item["remote_mode"],
                item["contract_type"],
                item["url"],
                item["description"],
                item["published_at"],
                item["salary_text"],
                score,
                json.dumps(reasons),
                status,
                json.dumps(item),
                now,
                now,
            )

            if existing:
                conn.execute(
                    """
                    UPDATE job_backlog_items
                    SET search_id = ?, run_id = ?, title = ?, company = ?, location = ?, remote_mode = ?,
                        contract_type = ?, url = ?, description = ?, published_at = ?, salary_text = ?,
                        score = ?, match_reasons_json = ?, status = ?, raw_payload_json = ?, updated_at = ?
                    WHERE id = ?
                    """,
                    (
                        search_id,
                        run_id,
                        item["title"],
                        item["company"],
                        item["location"],
                        item["remote_mode"],
                        item["contract_type"],
                        item["url"],
                        item["description"],
                        item["published_at"],
                        item["salary_text"],
                        score,
                        json.dumps(reasons),
                        existing["status"] if existing["imported_application_id"] else status,
                        json.dumps(item),
                        now,
                        existing["id"],
                    )
                )
            else:
                conn.execute(
                    """
                    INSERT INTO job_backlog_items (
                        search_id, run_id, source, external_id, title, company, location, remote_mode,
                        contract_type, url, description, published_at, salary_text, score,
                        match_reasons_json, status, raw_payload_json, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    payload
                )
                if status == JOB_BACKLOG_STATUS_NEW:
                    created_count += 1

        if search["auto_import"]:
            rows = conn.execute(
                "SELECT id FROM job_backlog_items WHERE search_id = ? AND run_id = ? AND status = ?",
                (search_id, run_id, JOB_BACKLOG_STATUS_NEW)
            ).fetchall()
            for row in rows:
                import_job_backlog_item(row["id"], conn=conn)
                imported_count += 1

        conn.execute(
            "UPDATE job_backlog_runs SET created_count = ?, imported_count = ? WHERE id = ?",
            (created_count, imported_count, run_id)
        )
        conn.commit()

    return {
        "run_id": run_id,
        "search": search,
        "fetched_count": len(catalog),
        "created_count": created_count,
        "imported_count": imported_count,
        "items": list_job_backlog_items(search_id=search_id),
    }

def import_job_backlog_item(item_id, conn=None):
    owns_conn = conn is None
    conn = conn or get_db()
    try:
        row = conn.execute("SELECT * FROM job_backlog_items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            return None
        item = _serialize_job_backlog_item(row)
        if item.get("imported_application_id"):
            return {"item_id": item_id, "application_id": item["imported_application_id"], "already_imported": True}

        organization_id = get_or_create_organization(conn, item["company"], "AUTRE")
        app_now = _utc_now()
        cursor = conn.execute(
            """
            INSERT INTO applications (organization_id, company, title, type, status, source, job_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                organization_id,
                item["company"],
                item["title"],
                item["contract_type"] or "CDI",
                "INTERESTED",
                f"job_backlog:{item['source']}",
                item["url"],
                app_now,
                app_now,
            )
        )
        app_id = cursor.lastrowid
        log_event(conn, "application", app_id, "CREATED", {
            "organization_id": organization_id,
            "company": item["company"],
            "title": item["title"],
            "type": item["contract_type"] or "CDI",
            "status": "INTERESTED",
            "source": f"job_backlog:{item['source']}",
            "job_url": item["url"],
            "backlog_item_id": item_id,
        })
        conn.execute(
            """
            UPDATE job_backlog_items
            SET status = ?, imported_application_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (JOB_BACKLOG_STATUS_IMPORTED, app_id, app_now, item_id)
        )
        if owns_conn:
            conn.commit()
        return {"item_id": item_id, "application_id": app_id, "already_imported": False}
    finally:
        if owns_conn:
            conn.close()

def get_or_create_organization(conn, name, org_type='AUTRE'):
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute("SELECT id FROM organizations WHERE name = ?", (name,))
    row = cursor.fetchone()
    if row:
        return row["id"]
    
    cursor = conn.execute(
        "INSERT INTO organizations (name, type, created_at, updated_at) VALUES (?, ?, ?, ?)",
        (name, org_type, now, now)
    )
    return cursor.lastrowid

def create_organization(name, org_type='AUTRE', city=None, website=None, linkedin_url=None, notes=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
      existing = conn.execute("SELECT id FROM organizations WHERE name = ?", (name,)).fetchone()
      if existing:
          org_id = existing["id"]
          conn.execute(
              """
              UPDATE organizations
              SET type = ?, city = ?, website = ?, linkedin_url = ?, notes = ?, updated_at = ?
              WHERE id = ?
              """,
              (org_type, city, website, linkedin_url, notes, now, org_id)
          )
          log_event(conn, "organization", org_id, "UPDATED", {
              "name": name,
              "type": org_type,
              "city": city,
              "website": website,
              "linkedin_url": linkedin_url,
              "notes": notes,
          })
          conn.commit()
          return org_id

      cursor = conn.execute(
          """
          INSERT INTO organizations (name, type, city, website, linkedin_url, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          """,
          (name, org_type, city, website, linkedin_url, notes, now, now)
      )
      org_id = cursor.lastrowid
      log_event(conn, "organization", org_id, "CREATED", {
          "name": name,
          "type": org_type,
          "city": city,
          "website": website,
          "linkedin_url": linkedin_url,
          "notes": notes,
      })
      conn.commit()
      return org_id

def create_application(company_name, title, app_type, status, applied_at=None, next_followup_at=None, source=None, job_url=None, org_type='AUTRE', organization_id=None, final_customer_organization_id=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        if organization_id:
            row = conn.execute("SELECT id, name FROM organizations WHERE id = ?", (organization_id,)).fetchone()
            if row:
                organization_id = row["id"]
                company_name = row["name"]
            else:
                organization_id = get_or_create_organization(conn, company_name, org_type)
        else:
            organization_id = get_or_create_organization(conn, company_name, org_type)
        cursor = conn.execute(
            """
            INSERT INTO applications (organization_id, final_customer_organization_id, company, title, type, status, source, job_url, applied_at, next_followup_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (organization_id, final_customer_organization_id, company_name, title, app_type, status, source, job_url, applied_at, next_followup_at, now, now)
        )
        app_id = cursor.lastrowid
        log_event(conn, "application", app_id, "CREATED", {
            "organization_id": organization_id,
            "final_customer_organization_id": final_customer_organization_id,
            "company": company_name,
            "title": title,
            "type": app_type,
            "status": status,
            "source": source,
            "job_url": job_url,
            "applied_at": applied_at
        })
        
        # If the organization was already created, but we received a specific org_type in this request, 
        # we might want to update it if it's currently 'AUTRE'.
        if org_type != 'AUTRE':
            conn.execute("UPDATE organizations SET type = ? WHERE id = ? AND type = 'AUTRE'", (org_type, organization_id))
            
        conn.commit()
        return app_id

def list_applications(filters=None, search=None, show_hidden=False, limit=None, offset=None):
    query = """
        SELECT
            a.*,
            fc.name AS final_customer_name
        FROM applications a
        LEFT JOIN organizations fc ON fc.id = a.final_customer_organization_id
    """
    params = []
    where_clauses = []

    if filters:
        if filters.get("organization_id"):
            where_clauses.append("a.organization_id = ?")
            params.append(filters["organization_id"])
        if filters.get("status"):
            where_clauses.append("a.status = ?")
            params.append(filters["status"])
        elif not show_hidden:
            where_clauses.append("a.status NOT IN ('REJECTED', 'OFFER')")
        
        if filters.get("type"):
            where_clauses.append("a.type = ?")
            params.append(filters["type"])
        if filters.get("source"):
            where_clauses.append("a.source = ?")
            params.append(filters["source"])
        if filters.get("has_contact") is not None:
            if filters["has_contact"] == "yes":
                where_clauses.append("EXISTS (SELECT 1 FROM application_contacts ac WHERE ac.application_id = a.id)")
            elif filters["has_contact"] == "no":
                where_clauses.append("NOT EXISTS (SELECT 1 FROM application_contacts ac WHERE ac.application_id = a.id)")
        if filters.get("followup_due") == "yes":
            today = datetime.now().date().isoformat()
            where_clauses.append("a.next_followup_at IS NOT NULL AND a.next_followup_at <= ?")
            params.append(today)
    elif not show_hidden:
        where_clauses.append("a.status NOT IN ('REJECTED', 'OFFER')")

    if search:
        search_term = f"%{search.strip()}%"
        search_clause = """
            (a.company LIKE ? OR a.title LIKE ? OR fc.name LIKE ? OR EXISTS (
                SELECT 1 FROM application_contacts ac 
                JOIN contacts c ON ac.contact_id = c.id 
                WHERE ac.application_id = a.id AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)
            ))
        """
        where_clauses.append(search_clause)
        params.extend([search_term, search_term, search_term, search_term, search_term, search_term])

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY a.updated_at DESC"

    if limit is not None:
        query += " LIMIT ?"
        params.append(limit)
    if offset is not None:
        query += " OFFSET ?"
        params.append(offset)

    with get_db() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def count_applications(filters=None, search=None, show_hidden=False):
    query = """
        SELECT COUNT(*) as total
        FROM applications a
        LEFT JOIN organizations fc ON fc.id = a.final_customer_organization_id
    """
    params = []
    where_clauses = []

    if filters:
        if filters.get("organization_id"):
            where_clauses.append("a.organization_id = ?")
            params.append(filters["organization_id"])
        if filters.get("status"):
            where_clauses.append("a.status = ?")
            params.append(filters["status"])
        elif not show_hidden:
            where_clauses.append("a.status NOT IN ('REJECTED', 'OFFER')")
        
        if filters.get("type"):
            where_clauses.append("a.type = ?")
            params.append(filters["type"])
        if filters.get("source"):
            where_clauses.append("a.source = ?")
            params.append(filters["source"])
        if filters.get("has_contact") is not None:
            if filters["has_contact"] == "yes":
                where_clauses.append("EXISTS (SELECT 1 FROM application_contacts ac WHERE ac.application_id = a.id)")
            elif filters["has_contact"] == "no":
                where_clauses.append("NOT EXISTS (SELECT 1 FROM application_contacts ac WHERE ac.application_id = a.id)")
        if filters.get("followup_due") == "yes":
            today = datetime.now().date().isoformat()
            where_clauses.append("a.next_followup_at IS NOT NULL AND a.next_followup_at <= ?")
            params.append(today)
    elif not show_hidden:
        where_clauses.append("a.status NOT IN ('REJECTED', 'OFFER')")

    if search:
        search_term = f"%{search.strip()}%"
        search_clause = """
            (a.company LIKE ? OR a.title LIKE ? OR fc.name LIKE ? OR EXISTS (
                SELECT 1 FROM application_contacts ac 
                JOIN contacts c ON ac.contact_id = c.id 
                WHERE ac.application_id = a.id AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ?)
            ))
        """
        where_clauses.append(search_clause)
        params.extend([search_term, search_term, search_term, search_term, search_term, search_term])

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    with get_db() as conn:
        row = conn.execute(query, params).fetchone()
        return row["total"]

def create_contact(first_name, last_name, email=None, phone=None, organization_id=None, role=None, is_recruiter=0, linkedin_url=None, notes=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO contacts (organization_id, first_name, last_name, email, phone, role, is_recruiter, linkedin_url, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (organization_id, first_name, last_name, email, phone, role, is_recruiter, linkedin_url, notes, now, now)
        )
        contact_id = cursor.lastrowid
        log_event(conn, "contact", contact_id, "CONTACT_CREATED", {
            "organization_id": organization_id,
            "first_name": first_name,
            "last_name": last_name,
            "name": f"{first_name} {last_name}".strip(),
            "email": email,
            "is_recruiter": is_recruiter
        })
        conn.commit()
        return contact_id

def list_organizations(filters=None, search=None):
    query = """
        SELECT 
            o.*,
            COUNT(a.id) as applications_count
        FROM organizations o
        LEFT JOIN applications a ON o.id = a.organization_id
    """
    params = []
    where_clauses = []
    
    if filters and filters.get("type"):
        where_clauses.append("o.type = ?")
        params.append(filters["type"])
    
    if search:
        where_clauses.append("o.name LIKE ?")
        params.append(f"%{search.strip()}%")
        
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    query += " GROUP BY o.id ORDER BY o.name ASC"
    
    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        orgs = []
        for row in rows:
            d = dict(row)
            stats = get_organization_stats(d["id"])
            d.update(stats)
            orgs.append(d)
        return orgs

def get_organization_stats(org_id):
    """Calcule à la volée les stats de probité pour une organisation."""
    with get_db() as conn:
        # 1. Total applications
        total_apps = conn.execute("SELECT COUNT(*) FROM applications WHERE organization_id = ?", (org_id,)).fetchone()[0]
        
        # 2. Total responses based on explicit response-like events.
        # This keeps organization stats aligned with application details and dashboard KPIs.
        total_responses = conn.execute(
            """
            SELECT COUNT(DISTINCT a.id)
            FROM applications a
            JOIN events e ON e.entity_id = a.id AND e.entity_type = 'application'
            WHERE a.organization_id = ?
              AND e.type IN ('RESPONSE_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED')
            """,
            (org_id,)
        ).fetchone()[0]
        
        response_rate = (total_responses / total_apps * 100) if total_apps > 0 else 0
        
        # 3. Avg response days
        avg_response_days = conn.execute(
            """
            SELECT AVG(julianday(e.ts) - julianday(a.applied_at))
            FROM applications a
            JOIN events e ON a.id = e.entity_id AND e.entity_type = 'application'
            WHERE a.organization_id = ? 
              AND a.applied_at IS NOT NULL 
              AND e.type IN ('RESPONSE_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED')
            """, (org_id,)
        ).fetchone()[0]
        
        # 4. Ghosting count (APPLIED depuis > 30 jours sans évolution)
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        ghosting_count = conn.execute(
            """
            SELECT COUNT(*) FROM applications 
            WHERE organization_id = ? 
              AND status = 'APPLIED' 
              AND applied_at < ?
            """, (org_id, thirty_days_ago)
        ).fetchone()[0]
        
        # 5. Positive count (INTERVIEW + OFFER)
        positive_count = conn.execute(
            "SELECT COUNT(*) FROM applications WHERE organization_id = ? AND status IN ('INTERVIEW', 'OFFER')", 
            (org_id,)
        ).fetchone()[0]
        
        positive_rate = (positive_count / total_apps * 100) if total_apps > 0 else 0
        
        # 6. Probity score & level
        probity_score = None
        probity_level = 'insuffisant'
        
        if total_apps >= 3:
            # Formula:
            # score = (response_rate * 0.5)
            #       + (Math.max(0, (14 - avg_response_days) / 14) * 100 * 0.3)
            #       + (Math.max(0, 1 - ghosting_count / total_apps) * 100 * 0.2)
            
            days_score = 0
            if avg_response_days is not None:
                days_score = max(0, (14 - avg_response_days) / 14) * 100
            
            ghost_score = max(0, 1 - ghosting_count / total_apps) * 100
            
            probity_score = (response_rate * 0.5) + (days_score * 0.3) + (ghost_score * 0.2)
            
            if probity_score >= 70: probity_level = 'fiable'
            elif probity_score >= 40: probity_level = 'moyen'
            else: probity_level = 'méfiance'
        
        return {
            "organization_id": org_id,
            "total_applications": total_apps,
            "total_responses": total_responses,
            "response_rate": round(response_rate, 1),
            "avg_response_days": round(avg_response_days, 1) if avg_response_days else None,
            "ghosting_count": ghosting_count,
            "positive_count": positive_count,
            "positive_rate": round(positive_rate, 1),
            "probity_score": round(probity_score, 1) if probity_score is not None else None,
            "probity_level": probity_level
        }

def list_contacts(filters=None):
    query = "SELECT * FROM contacts"
    params = []
    if filters and filters.get("organization_id"):
        query += " WHERE organization_id = ?"
        params.append(filters["organization_id"])
    
    query += " ORDER BY last_name ASC, first_name ASC"
    with get_db() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def get_contact(contact_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
        return dict(row) if row else None

def get_applications_for_contact(contact_id):
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT a.* FROM applications a
            JOIN application_contacts ac ON a.id = ac.application_id
            WHERE ac.contact_id = ?
            ORDER BY a.updated_at DESC
            """,
            (contact_id,)
        ).fetchall()
        return [dict(row) for row in rows]

def get_organization(org_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM organizations WHERE id = ?", (org_id,)).fetchone()
        if not row: return None
        d = dict(row)
        d.update(get_organization_stats(org_id))
        return d

def update_organization(org_id, data):
    now = datetime.now(timezone.utc).isoformat()
    fields = []
    params = []
    for k, v in data.items():
        if k in ['name', 'type', 'website', 'linkedin_url', 'city', 'notes']:
            fields.append(f"{k} = ?")
            params.append(v)
    
    if not fields:
        return False
        
    fields.append("updated_at = ?")
    params.append(now)
    params.append(org_id)
    
    with get_db() as conn:
        conn.execute(f"UPDATE organizations SET {', '.join(fields)} WHERE id = ?", params)
        log_event(conn, "organization", org_id, "UPDATED", data)
        conn.commit()
        return True

def delete_organization(org_id):
    with get_db() as conn:
        # Check if any application linked
        count = conn.execute("SELECT COUNT(*) FROM applications WHERE organization_id = ?", (org_id,)).fetchone()[0]
        if count > 0:
            return False
            
        conn.execute("DELETE FROM organizations WHERE id = ?", (org_id,))
        log_event(conn, "organization", org_id, "DELETED", {})
        conn.commit()
        return True

def merge_organizations(source_org_id, target_org_id):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        source = conn.execute("SELECT * FROM organizations WHERE id = ?", (source_org_id,)).fetchone()
        target = conn.execute("SELECT * FROM organizations WHERE id = ?", (target_org_id,)).fetchone()
        if not source or not target or source_org_id == target_org_id:
            return False

        conn.execute(
            "UPDATE applications SET organization_id = ?, company = ?, updated_at = ? WHERE organization_id = ?",
            (target_org_id, target["name"], now, source_org_id)
        )
        conn.execute(
            "UPDATE applications SET final_customer_organization_id = ?, updated_at = ? WHERE final_customer_organization_id = ?",
            (target_org_id, now, source_org_id)
        )
        conn.execute(
            "UPDATE contacts SET organization_id = ?, updated_at = ? WHERE organization_id = ?",
            (target_org_id, now, source_org_id)
        )
        conn.execute("DELETE FROM organizations WHERE id = ?", (source_org_id,))

        log_event(conn, "organization", target_org_id, "MERGED_IN", {
            "source_organization_id": source_org_id,
            "source_name": source["name"],
        })
        conn.commit()
        return True

def split_organization(org_id, new_name, new_type='AUTRE', city=None, website=None, linkedin_url=None, notes=None, move_contacts=True):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        source = conn.execute("SELECT * FROM organizations WHERE id = ?", (org_id,)).fetchone()
        if not source or not new_name or not new_name.strip():
            return None

        existing = conn.execute("SELECT id FROM organizations WHERE name = ?", (new_name.strip(),)).fetchone()
        if existing:
            new_org_id = existing["id"]
            conn.execute(
                """
                UPDATE organizations
                SET type = ?, city = ?, website = ?, linkedin_url = ?, notes = ?, updated_at = ?
                WHERE id = ?
                """,
                (new_type, city, website, linkedin_url, notes, now, new_org_id)
            )
        else:
            cursor = conn.execute(
                """
                INSERT INTO organizations (name, type, city, website, linkedin_url, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (new_name.strip(), new_type, city, website, linkedin_url, notes, now, now)
            )
            new_org_id = cursor.lastrowid

        conn.execute(
            "UPDATE applications SET organization_id = ?, company = ?, updated_at = ? WHERE organization_id = ?",
            (new_org_id, new_name.strip(), now, org_id)
        )
        conn.execute(
            "UPDATE applications SET final_customer_organization_id = ?, updated_at = ? WHERE final_customer_organization_id = ?",
            (new_org_id, now, org_id)
        )

        if move_contacts:
            conn.execute(
                "UPDATE contacts SET organization_id = ?, updated_at = ? WHERE organization_id = ?",
                (new_org_id, now, org_id)
            )

        log_event(conn, "organization", org_id, "SPLIT_OUT", {
            "new_organization_id": new_org_id,
            "new_name": new_name.strip(),
        })
        log_event(conn, "organization", new_org_id, "SPLIT_IN", {
            "source_organization_id": org_id,
            "source_name": source["name"],
        })

        remaining_apps = conn.execute("SELECT COUNT(*) FROM applications WHERE organization_id = ?", (org_id,)).fetchone()[0]
        remaining_final_customer_links = conn.execute(
            "SELECT COUNT(*) FROM applications WHERE final_customer_organization_id = ?",
            (org_id,)
        ).fetchone()[0]
        remaining_contacts = conn.execute("SELECT COUNT(*) FROM contacts WHERE organization_id = ?", (org_id,)).fetchone()[0]
        if remaining_apps == 0 and remaining_contacts == 0 and remaining_final_customer_links == 0:
            conn.execute("DELETE FROM organizations WHERE id = ?", (org_id,))
            log_event(conn, "organization", org_id, "DELETED", {"reason": "split_empty"})

        conn.commit()
        return new_org_id

def update_contact(contact_id, data):
    now = datetime.now(timezone.utc).isoformat()
    fields = []
    params = []
    for k, v in data.items():
        if k in ['organization_id', 'first_name', 'last_name', 'email', 'phone', 'role', 'is_recruiter', 'linkedin_url', 'notes']:
            fields.append(f"{k} = ?")
            params.append(v)
            
    if not fields:
        return False
        
    fields.append("updated_at = ?")
    params.append(now)
    params.append(contact_id)
    
    with get_db() as conn:
        conn.execute(f"UPDATE contacts SET {', '.join(fields)} WHERE id = ?", params)
        log_event(conn, "contact", contact_id, "UPDATED", data)
        conn.commit()
        return True

def delete_contact(contact_id):
    with get_db() as conn:
        conn.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
        log_event(conn, "contact", contact_id, "DELETED", {})
        conn.commit()
        return True

def link_contact_to_application(application_id, contact_id):
    with get_db() as conn:
        # Check if already linked
        existing = conn.execute(
            "SELECT 1 FROM application_contacts WHERE application_id = ? AND contact_id = ?",
            (application_id, contact_id)
        ).fetchone()
        if existing:
            return True
        
        conn.execute(
            "INSERT INTO application_contacts (application_id, contact_id) VALUES (?, ?)",
            (application_id, contact_id)
        )
        log_event(conn, "application", application_id, "CONTACT_LINKED", {
            "contact_id": contact_id
        })
        conn.commit()
        return True

def get_contacts_for_application(application_id):
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT c.* FROM contacts c
            JOIN application_contacts ac ON c.id = ac.contact_id
            WHERE ac.application_id = ?
            """,
            (application_id,)
        ).fetchall()
        return [dict(row) for row in rows]

def list_followups():
    today = datetime.now().date().isoformat()
    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT * FROM applications 
            WHERE next_followup_at IS NOT NULL AND next_followup_at <= ?
            AND status != "REJECTED"
            ORDER BY next_followup_at ASC
            """,
            (today,)
        ).fetchall()
        return [dict(row) for row in rows]

def get_application(app_id):
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT
                a.*,
                fc.name AS final_customer_name
            FROM applications a
            LEFT JOIN organizations fc ON fc.id = a.final_customer_organization_id
            WHERE a.id = ?
            """,
            (app_id,)
        ).fetchone()
        return dict(row) if row else None

def update_application(app_id, data):
    now = datetime.now(timezone.utc).isoformat()
    allowed_fields = {
        "organization_id",
        "final_customer_organization_id",
        "company",
        "title",
        "type",
        "status",
        "source",
        "job_url",
        "applied_at",
        "next_followup_at",
    }
    fields = []
    params = []
    with get_db() as conn:
        current = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,)).fetchone()
        if not current:
            return False

        next_organization_id = data.get("organization_id", current["organization_id"])
        for key, value in data.items():
            if key not in allowed_fields:
                continue
            if key in {"organization_id", "final_customer_organization_id"} and value == "":
                value = None
            fields.append(f"{key} = ?")
            params.append(value)

        if not fields:
            return False

        if "organization_id" in data and next_organization_id:
            linked_org = conn.execute("SELECT name FROM organizations WHERE id = ?", (next_organization_id,)).fetchone()
            if linked_org:
                fields.append("company = ?")
                params.append(linked_org["name"])

        fields.append("updated_at = ?")
        params.append(now)
        params.append(app_id)

        conn.execute(f"UPDATE applications SET {', '.join(fields)} WHERE id = ?", params)
        log_event(conn, "application", app_id, "UPDATED", data)
        conn.commit()
        return True

def update_application_status(app_id, new_status):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        old_app = get_application(app_id)
        if not old_app:
            return False
        
        conn.execute(
            "UPDATE applications SET status = ?, updated_at = ? WHERE id = ?",
            (new_status, now, app_id)
        )
        log_event(conn, "application", app_id, "STATUS_CHANGED", {
            "old_status": old_app["status"],
            "new_status": new_status
        })
        conn.commit()
        return True

def mark_as_followed_up(app_id):
    from datetime import timedelta
    today_dt = datetime.now()
    today = today_dt.date().isoformat()
    next_followup = (today_dt + timedelta(days=7)).date().isoformat()
    now_ts = datetime.now(timezone.utc).isoformat()
    
    with get_db() as conn:
        conn.execute(
            "UPDATE applications SET next_followup_at = ?, updated_at = ? WHERE id = ?",
            (next_followup, now_ts, app_id)
        )
        log_event(conn, "application", app_id, "FOLLOWUP_SENT", {
            "sent_at": today,
            "next_followup_at": next_followup
        })
        conn.commit()
        return True

def add_note(app_id, text):
    with get_db() as conn:
        log_event(conn, "application", app_id, "NOTE_ADDED", {
            "text": text,
            "source": "manual"
        })
        conn.commit()
        return True

def get_distinct_sources():
    with get_db() as conn:
        rows = conn.execute("SELECT DISTINCT source FROM applications WHERE source IS NOT NULL AND source != '' ORDER BY source ASC").fetchall()
        return [row["source"] for row in rows]

def get_kpis(filters=None):
    where_clauses = []
    joined_where_clauses = []
    params = []
    
    if filters:
        if filters.get("status"):
            where_clauses.append("status = ?")
            joined_where_clauses.append("a.status = ?")
            params.append(filters["status"])
        if filters.get("type"):
            where_clauses.append("type = ?")
            joined_where_clauses.append("a.type = ?")
            params.append(filters["type"])
        if filters.get("source"):
            where_clauses.append("source = ?")
            joined_where_clauses.append("a.source = ?")
            params.append(filters["source"])
            
    where_stmt = ""
    if where_clauses:
        where_stmt = " WHERE " + " AND ".join(where_clauses)

    joined_where_stmt = ""
    if joined_where_clauses:
        joined_where_stmt = " WHERE " + " AND ".join(joined_where_clauses)
        
    with get_db() as conn:
        # A) Total applications
        total_count = conn.execute(f"SELECT COUNT(*) FROM applications{where_stmt}", params).fetchone()[0]
        
        # B) Active applications (Not REJECTED, Not OFFER - assuming OFFER is final and successful, REJECTED is final and lost)
        # Based on index.html: INTERESTED, APPLIED, INTERVIEW, OFFER, REJECTED
        # "status NOT IN ('REJECTED', 'OFFER')"
        active_count = conn.execute(f"SELECT COUNT(*) FROM applications{where_stmt} {' AND ' if where_stmt else ' WHERE '} status NOT IN ('REJECTED', 'OFFER')", params).fetchone()[0]
        
        # C) Due follow-ups (today) - Exclude REJECTED and OFFER (as per definition of done/active)
        today = datetime.now().date().isoformat()
        due_followups = conn.execute(f"SELECT COUNT(*) FROM applications{where_stmt} {' AND ' if where_stmt else ' WHERE '} status NOT IN ('REJECTED', 'OFFER') AND next_followup_at IS NOT NULL AND next_followup_at <= ?", params + [today]).fetchone()[0]
        
        # D) Rejected rate
        rejected_count = conn.execute(f"SELECT COUNT(*) FROM applications{where_stmt} {' AND ' if where_stmt else ' WHERE '} status = 'REJECTED'", params).fetchone()[0]
        rejected_rate = (rejected_count / total_count * 100) if total_count > 0 else 0

        # E) Response rate
        # type in (RESPONSE_RECEIVED, INTERVIEW_SCHEDULED, OFFER_RECEIVED)
        # We need to join with events
        response_query = f"""
            SELECT COUNT(DISTINCT a.id) 
            FROM applications a
            JOIN events e ON e.entity_id = a.id AND e.entity_type = 'application'
            {joined_where_stmt}
            {' AND ' if joined_where_stmt else ' WHERE '} e.type IN ('RESPONSE_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED')
        """
        responded_count = conn.execute(response_query, params).fetchone()[0]
        
        response_rate = (responded_count / total_count * 100) if total_count > 0 else 0
        
        # F) Avg time to first response (days)
        # avg( first_response_date - applied_at )
        avg_time_query = f"""
            SELECT AVG(julianday(first_response_date) - julianday(applied_at))
            FROM (
                SELECT a.id, a.applied_at, MIN(e.ts) as first_response_date
                FROM applications a
                JOIN events e ON e.entity_id = a.id AND e.entity_type = 'application'
                {joined_where_stmt}
                {' AND ' if joined_where_stmt else ' WHERE '} a.applied_at IS NOT NULL 
                AND a.applied_at != ''
                AND e.type IN ('RESPONSE_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED')
                GROUP BY a.id
            )
        """
        avg_response_time = conn.execute(avg_time_query, params).fetchone()[0]
        
        return {
            "total_count": total_count,
            "active_count": active_count,
            "due_followups": due_followups,
            "rejected_count": rejected_count,
            "rejected_rate": round(rejected_rate, 1),
            "responded_count": responded_count,
            "response_rate": round(response_rate, 1),
            "avg_response_time": round(avg_response_time, 1) if avg_response_time is not None else None
        }

def get_monthly_kpis(year=None, month=None):
    if year is None:
        year = datetime.now().year
    if month is None:
        month = datetime.now().month
        
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year+1}-01-01"
    else:
        end_date = f"{year}-{month+1:02d}-01"
        
    with get_db() as conn:
        # 1) Applications created this month
        created_this_month = conn.execute(
            "SELECT COUNT(*) FROM applications WHERE applied_at >= ? AND applied_at < ?",
            (start_date, end_date)
        ).fetchone()[0]
        
        # 2) Responses this month (from events)
        responses_this_month = conn.execute(
            "SELECT COUNT(DISTINCT entity_id) FROM events WHERE type IN ('RESPONSE_RECEIVED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED') AND ts >= ? AND ts < ?",
            (start_date, end_date)
        ).fetchone()[0]
        
        # 3) Rejected this month
        rejected_this_month = conn.execute(
            "SELECT COUNT(*) FROM applications a JOIN events e ON a.id = e.entity_id WHERE e.entity_type = 'application' AND e.type = 'STATUS_CHANGED' AND e.payload_json LIKE '%\"new_status\": \"REJECTED\"%' AND e.ts >= ? AND e.ts < ?",
            (start_date, end_date)
        ).fetchone()[0]
        
        # 4) Follow-ups due this month
        followups_due_this_month = conn.execute(
            "SELECT COUNT(*) FROM applications WHERE next_followup_at >= ? AND next_followup_at < ? AND status NOT IN ('REJECTED', 'OFFER')",
            (start_date, end_date)
        ).fetchone()[0]
        
    return {
        "created": created_this_month,
        "responses": responses_this_month,
        "rejected": rejected_this_month,
        "followups_due": followups_due_this_month
    }

def get_annual_monthly_stats(year=None):
    if year is None:
        year = datetime.now().year
        
    stats = []
    with get_db() as conn:
        for month in range(1, 13):
            start_date = f"{year}-{month:02d}-01"
            if month == 12:
                end_date = f"{year+1}-01-01"
            else:
                end_date = f"{year}-{month+1:02d}-01"
                
            count = conn.execute(
                "SELECT COUNT(*) FROM applications WHERE applied_at >= ? AND applied_at < ?",
                (start_date, end_date)
            ).fetchone()[0]
            
            month_name = datetime(year, month, 1).strftime("%b")
            stats.append({"month": month_name, "count": count})
            
    return stats

def log_event(conn, entity_type, entity_id, event_type, payload):
    ts = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO events (ts, entity_type, entity_id, type, payload_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        (ts, entity_type, entity_id, event_type, json.dumps(payload))
    )

def get_events_for_entity(entity_type, entity_id):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM events WHERE entity_type = ? AND entity_id = ? ORDER BY ts DESC",
            (entity_type, entity_id)
        )
        return [dict(row) for row in rows.fetchall()]
