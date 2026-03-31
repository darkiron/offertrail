import sqlite3
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_PATH = Path("offertrail.db")

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
        conn.commit()

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
