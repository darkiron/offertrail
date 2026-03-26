import sqlite3
from pathlib import Path

def run_migration():
    db_path = Path("offertrail_new.db")
    sql_path = Path("scripts/migration_v4.sql")
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return
        
    with sqlite3.connect(db_path) as conn:
        with open(sql_path, "r", encoding="utf-8") as f:
            sql_script = f.read()
            
        print(f"Executing migration from {sql_path}...")
        try:
            conn.executescript(sql_script)
            print("Migration successful.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
