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
                applied_at TEXT,
                next_followup_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
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

def create_application(company, title, app_type, status, applied_at=None, next_followup_at=None):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO applications (company, title, type, status, applied_at, next_followup_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (company, title, app_type, status, applied_at, next_followup_at, now, now)
        )
        app_id = cursor.lastrowid
        log_event(conn, "application", app_id, "CREATED", {
            "company": company,
            "title": title,
            "type": app_type,
            "status": status,
            "applied_at": applied_at
        })
        conn.commit()
        return app_id

def list_applications():
    with get_db() as conn:
        return [dict(row) for row in conn.execute("SELECT * FROM applications ORDER BY updated_at DESC").fetchall()]

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
