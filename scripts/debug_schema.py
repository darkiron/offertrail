import sqlite3
from pathlib import Path

def check_schema():
    db_path = Path("offertrail_new.db")
    if not db_path.exists():
        print("DB not found")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    tables = ['organizations', 'applications', 'contacts', 'offers']
    for table in tables:
        print(f"\n--- {table} ---")
        try:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            for col in columns:
                print(col)
        except Exception as e:
            print(f"Error checking {table}: {e}")
            
    conn.close()

if __name__ == "__main__":
    check_schema()
