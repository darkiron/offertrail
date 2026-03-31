from __future__ import annotations

import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.database import SessionLocal, init_db
from src.models import Candidature, Contact, ContactInteraction, Etablissement, Relance, User

LEGACY_DB_PATH = Path("offertrail.db")
BACKUP_DB_PATH = Path("offertrail_backup.db")
MIGRATION_EMAIL = "migration@local.dev"


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    candidate = value.strip()
    if not candidate:
        return None
    for parser in (datetime.fromisoformat,):
        try:
            return parser(candidate.replace("Z", "+00:00"))
        except ValueError:
            continue
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(candidate, fmt)
        except ValueError:
            continue
    return None


def map_status(legacy_status: Optional[str]) -> str:
    mapping = {
        "INTERESTED": "brouillon",
        "APPLIED": "envoyee",
        "INTERVIEW": "entretien",
        "OFFER": "offre_recue",
        "REJECTED": "refusee",
    }
    return mapping.get((legacy_status or "").upper(), "en_attente")


def main() -> None:
    print("[1/6] Verification des fichiers SQLite")
    if BACKUP_DB_PATH.exists():
        raise RuntimeError("offertrail_backup.db existe deja. Renomme-le ou supprime-le avant migration.")

    if not LEGACY_DB_PATH.exists():
        print("Aucune base legacy detectee. Initialisation du schema SaaS seulement.")
        init_db()
        return

    print("[2/6] Sauvegarde de la base existante")
    LEGACY_DB_PATH.rename(BACKUP_DB_PATH)

    print("[3/6] Creation du nouveau schema SaaS")
    init_db()

    print("[4/6] Lecture de la base legacy")
    legacy = sqlite3.connect(BACKUP_DB_PATH)
    legacy.row_factory = sqlite3.Row

    print("[5/6] Migration des donnees")
    session = SessionLocal()
    try:
        migration_user = session.query(User).filter(User.email == MIGRATION_EMAIL).first()
        if migration_user is None:
            migration_user = User(
                email=MIGRATION_EMAIL,
                hashed_password="migration-only-account",
                plan="starter",
            )
            session.add(migration_user)
            session.flush()
            print(f"Utilisateur technique cree: {migration_user.email}")
        else:
            print(f"Utilisateur technique reutilise: {migration_user.email}")

        org_rows = legacy.execute("SELECT * FROM organizations ORDER BY id").fetchall()
        org_map: dict[int, str] = {}
        for row in org_rows:
            etablissement = Etablissement(
                nom=row["name"],
                secteur=row["type"],
                site_web=row["website"],
                description=row["notes"],
                siege_id=None,
                type="independant",
                created_at=parse_datetime(row["created_at"]) or datetime.utcnow(),
                updated_at=parse_datetime(row["updated_at"]) or datetime.utcnow(),
            )
            session.add(etablissement)
            session.flush()
            org_map[row["id"]] = etablissement.id
        print(f"Etablissements migres: {len(org_map)}")

        app_rows = legacy.execute("SELECT * FROM applications ORDER BY id").fetchall()
        app_map: dict[int, str] = {}
        for row in app_rows:
            etablissement_id = org_map.get(row["organization_id"])
            if etablissement_id is None:
                continue

            candidature = Candidature(
                user_id=migration_user.id,
                etablissement_id=etablissement_id,
                poste=row["title"],
                url_offre=row["job_url"],
                statut=map_status(row["status"]),
                date_candidature=parse_datetime(row["applied_at"]),
                source=row["source"],
                created_at=parse_datetime(row["created_at"]) or datetime.utcnow(),
                updated_at=parse_datetime(row["updated_at"]) or datetime.utcnow(),
            )
            session.add(candidature)
            session.flush()
            app_map[row["id"]] = candidature.id

            next_followup_at = parse_datetime(row["next_followup_at"])
            if next_followup_at is not None:
                session.add(
                    Relance(
                        candidature_id=candidature.id,
                        user_id=migration_user.id,
                        date_prevue=next_followup_at,
                        canal="autre",
                        contenu="Relance migree depuis la base legacy",
                    )
                )
        print(f"Candidatures migrees: {len(app_map)}")

        contact_rows = legacy.execute("SELECT * FROM contacts ORDER BY id").fetchall()
        contact_map: dict[int, str] = {}
        for row in contact_rows:
            etablissement_id = org_map.get(row["organization_id"])
            if etablissement_id is None:
                continue

            contact = Contact(
                etablissement_id=etablissement_id,
                prenom=row["first_name"],
                nom=row["last_name"],
                poste=row["role"],
                linkedin_url=row["linkedin_url"],
                email_pro=row["email"],
                created_at=parse_datetime(row["created_at"]) or datetime.utcnow(),
                updated_at=parse_datetime(row["updated_at"]) or datetime.utcnow(),
            )
            session.add(contact)
            session.flush()
            contact_map[row["id"]] = contact.id

            has_private_data = any(
                [
                    row["notes"],
                    row["phone"],
                ]
            )
            if has_private_data:
                session.add(
                    ContactInteraction(
                        contact_id=contact.id,
                        user_id=migration_user.id,
                        notes=row["notes"],
                        telephone=row["phone"],
                        updated_at=parse_datetime(row["updated_at"]) or datetime.utcnow(),
                    )
                )
        print(f"Contacts publics migres: {len(contact_map)}")

        session.commit()
        print("[6/6] Migration terminee avec succes")
        print(f"Base legacy sauvegardee dans: {BACKUP_DB_PATH}")
        print(f"Nouvelle base SaaS disponible dans: {LEGACY_DB_PATH}")
    except Exception:
        session.rollback()
        if LEGACY_DB_PATH.exists():
            LEGACY_DB_PATH.unlink()
        BACKUP_DB_PATH.rename(LEGACY_DB_PATH)
        raise
    finally:
        session.close()
        legacy.close()


if __name__ == "__main__":
    main()
