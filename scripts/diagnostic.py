import sqlite3

conn = sqlite3.connect("offertrail.db")
cur = conn.cursor()

tables = cur.execute(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).fetchall()

print("=== TABLES EXISTANTES ===")
for (t,) in tables:
    count = cur.execute(f"SELECT COUNT(*) FROM '{t}'").fetchone()[0]
    print(f"  {t}: {count} lignes")

print("\n=== COLONNES applications ===")
cols = cur.execute("PRAGMA table_info(applications)").fetchall()
for c in cols:
    print(f"  {c[1]} ({c[2]})")

print("\n=== COLONNES organizations ===")
try:
    cols = cur.execute("PRAGMA table_info(organizations)").fetchall()
    for c in cols:
        print(f"  {c[1]} ({c[2]})")
except Exception:
    print("  Table absente")

print("\n=== ECHANTILLON applications (3 lignes) ===")
rows = cur.execute("SELECT * FROM applications LIMIT 3").fetchall()
for r in rows:
    print(f"  {r}")

conn.close()
