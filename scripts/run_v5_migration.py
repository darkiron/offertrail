import sqlite3
from pathlib import Path
import os

DB_PATH = Path("offertrail.db")

def run_migration():
    if not DB_PATH.exists():
        print(f"Database {DB_PATH} not found. Skipping.")
        return

    sql_path = Path("scripts/migration_v5_orgs.sql")
    if not sql_path.exists():
        print(f"Migration file {sql_path} not found.")
        return

    print(f"Executing migration from {sql_path} on {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
            conn.executescript(sql)
        conn.commit()
        conn.close()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
