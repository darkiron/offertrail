import sqlite3
import os


db_path = os.getenv("OFFERTAIL_DB_PATH", "offertrail.db")
conn = sqlite3.connect(db_path)
cur = conn.cursor()
tables = cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).fetchall()

print(f"Tables restantes dans {db_path} :")
for (table_name,) in tables:
    try:
        count = cur.execute(f"SELECT COUNT(*) FROM '{table_name}'").fetchone()[0]
    except sqlite3.OperationalError as exc:
        print(f"  {table_name}: inaccessible ({exc})")
        continue
    print(f"  {table_name}: {count} lignes")

conn.close()
