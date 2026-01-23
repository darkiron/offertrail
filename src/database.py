import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path("offertrail.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                title TEXT NOT NULL,
                type TEXT NOT NULL, -- CDI|FREELANCE
                status TEXT NOT NULL,
                source TEXT,
                job_url TEXT,
                applied_at TEXT,
                next_followup_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                company TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
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
        conn.commit()

def create_application(company, title, app_type, status, applied_at=None, next_followup_at=None, source=None, job_url=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO applications (company, title, type, status, source, job_url, applied_at, next_followup_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (company, title, app_type, status, source, job_url, applied_at, next_followup_at, now, now)
        )
        app_id = cursor.lastrowid
        log_event(conn, "application", app_id, "CREATED", {
            "company": company,
            "title": title,
            "type": app_type,
            "status": status,
            "source": source,
            "job_url": job_url,
            "applied_at": applied_at
        })
        conn.commit()
        return app_id

def list_applications(filters=None, search=None):
    query = "SELECT a.* FROM applications a"
    params = []
    where_clauses = []

    if filters:
        if filters.get("status"):
            where_clauses.append("a.status = ?")
            params.append(filters["status"])
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

    if search:
        search_term = f"%{search.strip()}%"
        search_clause = """
            (a.company LIKE ? OR a.title LIKE ? OR EXISTS (
                SELECT 1 FROM application_contacts ac 
                JOIN contacts c ON ac.contact_id = c.id 
                WHERE ac.application_id = a.id AND (c.name LIKE ? OR c.email LIKE ?)
            ))
        """
        where_clauses.append(search_clause)
        params.extend([search_term, search_term, search_term, search_term])

    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)

    query += " ORDER BY a.updated_at DESC"

    with get_db() as conn:
        return [dict(row) for row in conn.execute(query, params).fetchall()]

def create_contact(name, email=None, phone=None, company=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO contacts (name, email, phone, company, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (name, email, phone, company, now, now)
        )
        contact_id = cursor.lastrowid
        log_event(conn, "contact", contact_id, "CONTACT_CREATED", {
            "name": name,
            "email": email,
            "company": company
        })
        conn.commit()
        return contact_id

def list_contacts():
    with get_db() as conn:
        return [dict(row) for row in conn.execute("SELECT * FROM contacts ORDER BY name ASC").fetchall()]

def get_contact(contact_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
        return dict(row) if row else None

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
            ORDER BY next_followup_at ASC
            """,
            (today,)
        ).fetchall()
        return [dict(row) for row in rows]

def get_application(app_id):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,)).fetchone()
        return dict(row) if row else None

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
