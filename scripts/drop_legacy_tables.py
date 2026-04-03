"""
Supprime les anciennes tables apres migration reussie.
Ne lancer QUE si migrate_to_saas.py s'est termine sans erreur.
"""
import os
import sqlite3

DB_PATH = os.getenv("OFFERTAIL_DB_PATH", "offertrail.db")

LEGACY_TABLES = [
    "application_contacts",
    "applications",
    "companies",
    "events",
    "job_backlog_items",
    "job_backlog_runs",
    "job_searches",
    "job_sources",
    "organizations",
]

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
cur.execute("PRAGMA foreign_keys = OFF")

print("Suppression des tables legacy...")
for table in LEGACY_TABLES:
    exists = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,)
    ).fetchone()
    if exists:
        cur.execute(f"DROP TABLE IF EXISTS '{table}'")
        print(f"  OK {table} supprimee")
    else:
        print(f"  SKIP {table} absente")

cur.execute("PRAGMA foreign_keys = ON")
conn.commit()
conn.close()
print("\nNettoyage termine")
