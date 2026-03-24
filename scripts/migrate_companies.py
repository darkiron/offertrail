import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path("offertrail.db")

def migrate():
    if not DB_PATH.exists():
        print("Database not found. Skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Ensure 'companies' table exists (it should after init_db, but for safety)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 2. Check if 'company_id' column exists in 'applications'
    cursor.execute("PRAGMA table_info(applications)")
    columns = [col[1] for col in cursor.fetchall()]
    if "company_id" not in columns:
        print("Adding company_id column to applications...")
        cursor.execute("ALTER TABLE applications ADD COLUMN company_id INTEGER REFERENCES companies (id)")

    now = datetime.now(timezone.utc).isoformat()

    # 3. Migrate unique companies from 'applications' and 'contacts'
    cursor.execute("SELECT DISTINCT company FROM applications WHERE company IS NOT NULL")
    companies_from_apps = [row[0] for row in cursor.fetchall()]

    cursor.execute("SELECT DISTINCT company FROM contacts WHERE company IS NOT NULL AND company != ''")
    companies_from_contacts = [row[0] for row in cursor.fetchall()]

    all_companies = set(companies_from_apps + companies_from_contacts)

    for company_name in all_companies:
        try:
            cursor.execute(
                "INSERT INTO companies (name, created_at, updated_at) VALUES (?, ?, ?)",
                (company_name, now, now)
            )
            print(f"Created company: {company_name}")
        except sqlite3.IntegrityError:
            print(f"Company already exists: {company_name}")

    # 4. Link applications to companies
    cursor.execute("SELECT id, company FROM applications")
    apps = cursor.fetchall()
    for app in apps:
        cursor.execute("SELECT id FROM companies WHERE name = ?", (app["company"],))
        company_row = cursor.fetchone()
        if company_row:
            cursor.execute(
                "UPDATE applications SET company_id = ? WHERE id = ?",
                (company_row[0], app["id"])
            )

    # 5. Link contacts to companies (Optional, but good for completeness)
    cursor.execute("PRAGMA table_info(contacts)")
    columns = [col[1] for col in cursor.fetchall()]
    if "company_id" not in columns:
        print("Adding company_id column to contacts...")
        cursor.execute("ALTER TABLE contacts ADD COLUMN company_id INTEGER REFERENCES companies (id)")

    cursor.execute("SELECT id, company FROM contacts WHERE company IS NOT NULL AND company != ''")
    contacts = cursor.fetchall()
    for contact in contacts:
        cursor.execute("SELECT id FROM companies WHERE name = ?", (contact["company"],))
        company_row = cursor.fetchone()
        if company_row:
            cursor.execute(
                "UPDATE contacts SET company_id = ? WHERE id = ?",
                (company_row[0], contact["id"])
            )

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
