import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone
from src.infrastructure.database_manager import DatabaseManager
from src.infrastructure.repositories import SQLiteRepository
from src.domain.models import Company, Offer, Application, OfferType, ApplicationStatus, CompanyType, Contact, OfferSource

OLD_DB_PATH = Path("offertrail.db")
NEW_DB_PATH = Path("offertrail_new.db")

def migrate():
    if not OLD_DB_PATH.exists():
        print("Old database not found. Skipping migration.")
        return

    # Initialize new database
    db_manager = DatabaseManager(NEW_DB_PATH)
    db_manager.init_db()
    repo = SQLiteRepository(db_manager)

    conn_old = sqlite3.connect(OLD_DB_PATH)
    conn_old.row_factory = sqlite3.Row
    cursor_old = conn_old.cursor()

    print("Migrating companies...")
    cursor_old.execute("SELECT * FROM companies")
    processed_slugs = set()
    for row in cursor_old.fetchall():
        name = row["name"]
        base_slug = name.lower().replace(" ", "-")
        slug = base_slug
        counter = 1
        while slug in processed_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        processed_slugs.add(slug)
        
        company = Company(
            id=None,
            name=name,
            slug=slug,
            type=CompanyType.OTHER,
            created_at=row["created_at"]
        )
        repo.save_company(company)

    print("Migrating applications as Offers + Applications...")
    cursor_old.execute("SELECT * FROM applications")
    for row in cursor_old.fetchall():
        # Each old application is an Offer + an initial Application in the new model
        # We need to find the company_id in the new DB
        with db_manager.get_connection() as conn_new:
            # We match by name since IDs might have changed if not careful, 
            # but here we just inserted them.
            c_row = conn_new.execute("SELECT id FROM companies WHERE name = ?", (row["company"],)).fetchone()
            company_id = c_row["id"] if c_row else None
            
            if not company_id:
                # If company didn't exist in 'companies' table but was in 'applications' (shouldn't happen with previous migration but safety first)
                name = row["company"]
                slug = name.lower().replace(" ", "-")
                company = Company(id=None, name=name, slug=slug)
                company_id = repo.save_company(company)

        offer = Offer(
            id=None,
            company_id=company_id,
            title=row["title"],
            contract_type=OfferType.CDI if row["type"] == "CDI" else OfferType.FREELANCE,
            source=OfferSource.LINKEDIN if row["source"] == "LinkedIn" else OfferSource.OTHER,
            url=row["job_url"],
            created_at=row["created_at"]
        )
        offer_id = repo.save_offer(offer)

        app = Application(
            id=None,
            company_id=company_id,
            offer_id=offer_id,
            applied_at=row["applied_at"],
            status=ApplicationStatus(row["status"]) if row["status"] in [s.value for s in ApplicationStatus] else ApplicationStatus.APPLIED,
            next_action_at=row["next_followup_at"],
            created_at=row["created_at"]
        )
        repo.save_application(app)

    print("Migrating contacts...")
    cursor_old.execute("SELECT * FROM contacts")
    for row in cursor_old.fetchall():
        with db_manager.get_connection() as conn_new:
            c_row = conn_new.execute("SELECT id FROM companies WHERE name = ?", (row["company"],)).fetchone()
            company_id = c_row["id"] if c_row else None
        
        if company_id:
            full_name = row["name"].split(" ", 1)
            first_name = full_name[0]
            last_name = full_name[1] if len(full_name) > 1 else "Unknown"
            
            contact = Contact(
                id=None,
                company_id=company_id,
                first_name=first_name,
                last_name=last_name,
                email=row["email"],
                phone=row["phone"]
            )
            repo.save_contact(contact)

    conn_old.close()
    print("Migration finished successfully. New database at offertrail_new.db")

if __name__ == "__main__":
    migrate()
