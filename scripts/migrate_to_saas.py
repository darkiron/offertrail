"""
Migration OfferTrail : ancien schema -> nouveau schema multi-tenant.
Toutes les donnees existantes sont assignees au user_id proprietaire fourni.

Usage : python scripts/migrate_to_saas.py

Variables optionnelles :
- OFFERTAIL_DB_PATH
- OFFERTAIL_BACKUP_PATH
"""
from __future__ import annotations

import json
import os
import shutil
import sqlite3
import uuid
from datetime import datetime

DB_PATH = os.getenv("OFFERTAIL_DB_PATH", "offertrail.db")
BACKUP_PATH = os.getenv("OFFERTAIL_BACKUP_PATH", "offertrail_premigration.db")

# ID du user proprietaire de toutes les donnees existantes
OWNER_USER_ID = "36f4b067-3d4d-490e-bd55-c239f625a153"


def gen_uuid() -> str:
    return str(uuid.uuid4())


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def table_exists(cur: sqlite3.Cursor, table_name: str) -> bool:
    row = cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
        (table_name,),
    ).fetchone()
    return row is not None


def get_columns(cur: sqlite3.Cursor, table_name: str) -> set[str]:
    return {row[1] for row in cur.execute(f"PRAGMA table_info({table_name})").fetchall()}


def normalize_name(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def parse_datetime(value: str | None) -> str | None:
    if value is None:
        return None
    candidate = str(value).strip()
    if not candidate:
        return None

    for parser in (datetime.fromisoformat,):
        try:
            return parser(candidate.replace("Z", "+00:00")).isoformat()
        except ValueError:
            pass

    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(candidate, fmt).isoformat()
        except ValueError:
            pass

    return candidate


def legacy_status_to_new(status: str | None) -> str:
    statut_map = {
        "applied": "envoyee",
        "postule": "envoyee",
        "interview": "entretien",
        "entretien": "entretien",
        "offer": "offre_recue",
        "rejected": "refusee",
        "refused": "refusee",
        "ghosted": "ghosting",
        "ghosting": "ghosting",
        "interested": "en_attente",
        "interet": "en_attente",
        "withdrawn": "abandonnee",
    }
    return statut_map.get((status or "").strip().lower(), "envoyee")


def fetch_legacy_events(cur: sqlite3.Cursor) -> dict[int, list[sqlite3.Row]]:
    if not table_exists(cur, "events"):
        return {}

    rows = cur.execute(
        """
        SELECT *
        FROM events
        WHERE entity_type = 'application'
        ORDER BY entity_id, ts, id
        """
    ).fetchall()
    grouped: dict[int, list[sqlite3.Row]] = {}
    for row in rows:
        grouped.setdefault(row["entity_id"], []).append(row)
    return grouped


def ensure_owner_user(cur: sqlite3.Cursor) -> None:
    print(f"[2/7] Verification user {OWNER_USER_ID}")
    user = cur.execute("SELECT id FROM users WHERE id = ?", (OWNER_USER_ID,)).fetchone()
    if user:
        print("  OK User proprietaire trouve")
        return

    print("  WARN User introuvable - creation d'un user de migration")
    cur.execute(
        """
        INSERT INTO users (id, email, hashed_password, plan, is_active, created_at, updated_at)
        VALUES (?, 'migration@offertrail.local', 'migration_no_login', 'pro', 1, ?, ?)
        """,
        (OWNER_USER_ID, now_iso(), now_iso()),
    )


def load_existing_etablissements(cur: sqlite3.Cursor) -> tuple[dict[str, str], dict[str, str]]:
    by_name: dict[str, str] = {}
    by_site: dict[str, str] = {}
    rows = cur.execute("SELECT id, nom, site_web FROM etablissements").fetchall()
    for row in rows:
        normalized = normalize_name(row["nom"])
        if normalized and normalized not in by_name:
            by_name[normalized] = row["id"]
        site_web = (row["site_web"] or "").strip().lower()
        if site_web and site_web not in by_site:
            by_site[site_web] = row["id"]
    return by_name, by_site


def upsert_legacy_organizations(cur: sqlite3.Cursor) -> dict[int, str]:
    print("[3/7] Migration organizations -> etablissements")
    if not table_exists(cur, "organizations"):
        print("  SKIP Pas de table organizations")
        return {}

    org_id_map: dict[int, str] = {}
    existing_by_name, existing_by_site = load_existing_etablissements(cur)
    orgs = cur.execute("SELECT * FROM organizations ORDER BY id").fetchall()
    print(f"  {len(orgs)} organizations trouvees")

    for org in orgs:
        name = org["name"] if "name" in org.keys() else "Sans nom"
        website = org["website"] if "website" in org.keys() else None
        secteur = org["type"] if "type" in org.keys() else None
        description = org["notes"] if "notes" in org.keys() else None
        created_at = parse_datetime(org["created_at"] if "created_at" in org.keys() else None) or now_iso()
        updated_at = parse_datetime(org["updated_at"] if "updated_at" in org.keys() else None) or now_iso()

        normalized_name = normalize_name(name)
        website_key = (website or "").strip().lower()
        etablissement_id = existing_by_name.get(normalized_name) or existing_by_site.get(website_key)

        if etablissement_id:
            cur.execute(
                """
                UPDATE etablissements
                SET secteur = COALESCE(secteur, ?),
                    site_web = COALESCE(site_web, ?),
                    description = COALESCE(description, ?),
                    created_by = COALESCE(created_by, ?),
                    updated_at = ?
                WHERE id = ?
                """,
                (secteur, website, description, OWNER_USER_ID, updated_at, etablissement_id),
            )
        else:
            etablissement_id = gen_uuid()
            cur.execute(
                """
                INSERT INTO etablissements
                    (id, nom, secteur, site_web, description, siege_id, type, verified,
                     created_by, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, NULL, 'independant', 0, ?, ?, ?)
                """,
                (
                    etablissement_id,
                    name,
                    secteur,
                    website,
                    description,
                    OWNER_USER_ID,
                    created_at,
                    updated_at,
                ),
            )
            if normalized_name:
                existing_by_name[normalized_name] = etablissement_id
            if website_key:
                existing_by_site[website_key] = etablissement_id

        org_id_map[org["id"]] = etablissement_id

    cur.execute(
        """
        UPDATE etablissements
        SET created_by = ?
        WHERE created_by IS NULL
        """,
        (OWNER_USER_ID,),
    )
    print(f"  OK {len(org_id_map)} organizations mappees")
    return org_id_map


def ensure_company_etablissement(
    cur: sqlite3.Cursor,
    existing_by_name: dict[str, str],
    company_name: str | None,
) -> str:
    normalized_name = normalize_name(company_name or "Inconnu")
    if normalized_name in existing_by_name:
        return existing_by_name[normalized_name]

    etablissement_id = gen_uuid()
    cur.execute(
        """
        INSERT INTO etablissements
            (id, nom, type, verified, created_by, created_at, updated_at)
        VALUES (?, ?, 'independant', 0, ?, ?, ?)
        """,
        (
            etablissement_id,
            company_name or "Inconnu",
            OWNER_USER_ID,
            now_iso(),
            now_iso(),
        ),
    )
    existing_by_name[normalized_name] = etablissement_id
    return etablissement_id


def reset_private_saas_data(cur: sqlite3.Cursor) -> None:
    print("[4/7] Reinitialisation des donnees privees SaaS a reconstruire")
    cur.execute("DELETE FROM relances")
    cur.execute("DELETE FROM candidature_events")
    cur.execute("DELETE FROM candidatures")
    cur.execute(
        """
        UPDATE contact_interactions
        SET user_id = ?, updated_at = COALESCE(updated_at, ?)
        """,
        (OWNER_USER_ID, now_iso()),
    )
    cur.execute(
        """
        UPDATE contacts
        SET created_by = COALESCE(created_by, ?),
            updated_at = COALESCE(updated_at, ?)
        """,
        (OWNER_USER_ID, now_iso()),
    )


def migrate_legacy_applications(
    cur: sqlite3.Cursor,
    org_id_map: dict[int, str],
) -> None:
    print("[5/7] Migration applications -> candidatures")
    if not table_exists(cur, "applications"):
        print("  SKIP Pas de table applications")
        return

    existing_by_name, _ = load_existing_etablissements(cur)
    app_rows = cur.execute("SELECT * FROM applications ORDER BY id").fetchall()
    legacy_events = fetch_legacy_events(cur)
    print(f"  {len(app_rows)} applications trouvees")

    created_count = 0
    relance_count = 0
    event_count = 0

    for app in app_rows:
        org_id_old = app["organization_id"] if "organization_id" in app.keys() else None
        etablissement_id = org_id_map.get(org_id_old)
        if not etablissement_id:
            company_name = app["company"] if "company" in app.keys() else "Inconnu"
            etablissement_id = ensure_company_etablissement(cur, existing_by_name, company_name)

        candidature_id = gen_uuid()
        statut = legacy_status_to_new(app["status"] if "status" in app.keys() else None)
        applied_at = parse_datetime(app["applied_at"] if "applied_at" in app.keys() else None)
        created_at = parse_datetime(app["created_at"] if "created_at" in app.keys() else None) or now_iso()
        updated_at = parse_datetime(app["updated_at"] if "updated_at" in app.keys() else None) or now_iso()
        poste = app["title"] if "title" in app.keys() else "Poste non renseigne"
        source = app["source"] if "source" in app.keys() else None
        url_offre = app["job_url"] if "job_url" in app.keys() else None
        description = app["type"] if "type" in app.keys() else None

        cur.execute(
            """
            INSERT INTO candidatures
                (id, user_id, etablissement_id, poste, url_offre, description, statut,
                 date_candidature, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                candidature_id,
                OWNER_USER_ID,
                etablissement_id,
                poste,
                url_offre,
                description,
                statut,
                applied_at,
                source,
                created_at,
                updated_at,
            ),
        )
        created_count += 1

        cur.execute(
            """
            INSERT INTO candidature_events
                (id, candidature_id, user_id, type, nouveau_statut, contenu, created_at)
            VALUES (?, ?, ?, 'creation', ?, 'Migre depuis ancien schema', ?)
            """,
            (gen_uuid(), candidature_id, OWNER_USER_ID, statut, created_at),
        )
        event_count += 1

        next_followup_at = parse_datetime(
            app["next_followup_at"] if "next_followup_at" in app.keys() else None
        )
        if next_followup_at:
            cur.execute(
                """
                INSERT INTO relances
                    (id, candidature_id, user_id, date_prevue, canal, contenu, statut, created_at)
                VALUES (?, ?, ?, ?, 'autre', 'Relance migree depuis la base legacy', 'a_faire', ?)
                """,
                (gen_uuid(), candidature_id, OWNER_USER_ID, next_followup_at, created_at),
            )
            relance_count += 1

        for event_row in legacy_events.get(app["id"], []):
            event_type = event_row["type"]
            if event_type == "CREATED":
                continue

            payload_raw = event_row["payload_json"] or "{}"
            try:
                payload = json.loads(payload_raw)
            except json.JSONDecodeError:
                payload = {}

            created_event_at = parse_datetime(event_row["ts"]) or updated_at
            if event_type == "NOTE_ADDED":
                contenu = payload.get("text") or "Note migree depuis le schema legacy"
                cur.execute(
                    """
                    INSERT INTO candidature_events
                        (id, candidature_id, user_id, type, contenu, created_at)
                    VALUES (?, ?, ?, 'note_ajout', ?, ?)
                    """,
                    (gen_uuid(), candidature_id, OWNER_USER_ID, contenu, created_event_at),
                )
                event_count += 1
            elif event_type == "RESPONSE_RECEIVED":
                contenu = "Reponse recue"
                if payload.get("source"):
                    contenu = f"{contenu} via {payload['source']}"
                cur.execute(
                    """
                    INSERT INTO candidature_events
                        (id, candidature_id, user_id, type, contenu, created_at)
                    VALUES (?, ?, ?, 'note_ajout', ?, ?)
                    """,
                    (gen_uuid(), candidature_id, OWNER_USER_ID, contenu, created_event_at),
                )
                event_count += 1
            elif event_type == "STATUS_CHANGED":
                ancien = legacy_status_to_new(payload.get("old_status"))
                nouveau = legacy_status_to_new(payload.get("new_status"))
                cur.execute(
                    """
                    INSERT INTO candidature_events
                        (id, candidature_id, user_id, type, ancien_statut, nouveau_statut, created_at)
                    VALUES (?, ?, ?, 'statut_change', ?, ?, ?)
                    """,
                    (
                        gen_uuid(),
                        candidature_id,
                        OWNER_USER_ID,
                        ancien,
                        nouveau,
                        created_event_at,
                    ),
                )
                event_count += 1

    print(f"  OK {created_count} candidatures creees")
    print(f"  OK {relance_count} relances creees")
    print(f"  OK {event_count} events crees")


def finalize_and_verify(cur: sqlite3.Cursor) -> None:
    print("[6/7] Verification")
    for table in [
        "candidatures",
        "etablissements",
        "contacts",
        "candidature_events",
        "contact_interactions",
        "relances",
        "users",
    ]:
        count = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count} lignes")

    bad_candidatures = cur.execute(
        "SELECT COUNT(*) FROM candidatures WHERE user_id != ?",
        (OWNER_USER_ID,),
    ).fetchone()[0]
    bad_relances = cur.execute(
        "SELECT COUNT(*) FROM relances WHERE user_id != ?",
        (OWNER_USER_ID,),
    ).fetchone()[0]
    bad_interactions = cur.execute(
        "SELECT COUNT(*) FROM contact_interactions WHERE user_id != ?",
        (OWNER_USER_ID,),
    ).fetchone()[0]

    if bad_candidatures or bad_relances or bad_interactions:
        raise RuntimeError(
            "Isolation KO - certaines donnees privees ne pointent pas vers le user proprietaire"
        )

    print(f"  OK Isolation OK - toutes les donnees privees appartiennent a {OWNER_USER_ID}")


def migrate() -> None:
    print(f"[1/7] Snapshot -> {BACKUP_PATH}")
    shutil.copy2(DB_PATH, BACKUP_PATH)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        cur.execute("PRAGMA foreign_keys = OFF")
        cur.execute("BEGIN IMMEDIATE")

        ensure_owner_user(cur)
        org_id_map = upsert_legacy_organizations(cur)
        reset_private_saas_data(cur)
        migrate_legacy_applications(cur, org_id_map)
        finalize_and_verify(cur)

        cur.execute("PRAGMA foreign_keys = ON")
        conn.commit()
        print("[7/7] Migration terminee avec succes")
        print(f"  Backup disponible : {BACKUP_PATH}")
    except Exception as exc:
        conn.rollback()
        print(f"\nERROR pendant la migration : {exc}")
        print(f"   La BDD n'a pas ete modifiee. Backup : {BACKUP_PATH}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
