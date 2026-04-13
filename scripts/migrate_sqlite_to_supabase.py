"""
Migration des données locales SQLite vers Supabase PostgreSQL.
Lancer une seule fois après avoir configuré DATABASE_URL PostgreSQL dans .env.

Usage:
  DATABASE_URL=postgresql://... python scripts/migrate_sqlite_to_supabase.py
"""
import os
import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

SQLITE_PATH  = "offertrail.db"
POSTGRES_URL = os.getenv("DATABASE_URL")

if not POSTGRES_URL or POSTGRES_URL.startswith("sqlite"):
    raise SystemExit("Définir DATABASE_URL avec une URL PostgreSQL Supabase dans .env")

print(f"Source : {SQLITE_PATH}")
print(f"Destination : {POSTGRES_URL[:40]}...")

# Connexion SQLite source
sqlite_conn = sqlite3.connect(SQLITE_PATH)
sqlite_conn.row_factory = sqlite3.Row

# Connexion PostgreSQL destination
pg_engine  = create_engine(POSTGRES_URL)
PgSession  = sessionmaker(bind=pg_engine)
pg_session = PgSession()

# Tables dans l'ordre (respect des foreign keys)
TABLES = [
    "users",
    "etablissements",
    "succursales",
    "contacts",
    "password_reset_tokens",
    "candidatures",
    "candidature_events",
    "relances",
    "contact_interactions",
    "probite_scores",
]

total_migrated = 0

for table in TABLES:
    try:
        rows = sqlite_conn.execute(f"SELECT * FROM {table}").fetchall()
    except Exception as e:
        print(f"  {table}: ignorée ({e})")
        continue

    if not rows:
        print(f"  {table}: 0 lignes (ignorée)")
        continue

    columns = rows[0].keys()
    col_names = ", ".join(columns)
    placeholders = ", ".join([f":{c}" for c in columns])

    inserted = 0
    skipped  = 0

    for row in rows:
        try:
            pg_session.execute(
                text(f"""
                    INSERT INTO {table} ({col_names})
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """),
                dict(row)
            )
            inserted += 1
        except Exception:
            skipped += 1

    pg_session.commit()
    print(f"  {table}: {inserted} insérées, {skipped} ignorées")
    total_migrated += inserted

sqlite_conn.close()
pg_session.close()

print(f"\n✅ Migration terminée — {total_migrated} lignes migrées")
