import os
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Ensure src is in path
sys.path.append(os.getcwd())

from src.infrastructure.database_manager import DatabaseManager
from src.infrastructure.repositories import SQLiteRepository
from src.application.services import ApplicationService, CompanyService
from src.domain.models import ApplicationStatus, OfferType

TEST_DB = Path("test_ddd.db")
if TEST_DB.exists():
    os.remove(TEST_DB)

def test_ddd_workflow():
    db_manager = DatabaseManager(TEST_DB)
    db_manager.init_db()
    repo = SQLiteRepository(db_manager)
    app_service = ApplicationService(repo)
    comp_service = CompanyService(repo)

    print("Step 1: Applying to an offer...")
    app_id = app_service.apply_to_offer(
        company_name="Innovatech",
        offer_title="Full Stack Engineer",
        offer_type=OfferType.CDI,
        source="LinkedIn",
        url="https://linkedin.com/jobs/123"
    )
    assert app_id is not None
    print(f"Created application ID: {app_id}")

    print("Step 2: Checking company stats...")
    companies = repo.list_companies()
    assert len(companies) == 1
    company = companies[0]
    assert company.name == "Innovatech"
    assert len(company.offers) == 1
    assert company.metrics["total_apps"] == 1
    print(f"Company metrics: {company.metrics}")

    print("Step 3: Simulating rejections to trigger flag...")
    # Add 3 more rejections (total 3 rejections, 4 apps)
    for i in range(3):
        oid = repo.save_offer(Offer(id=None, company_id=company.id, title=f"Role {i}"))
        repo.save_application(Application(id=None, offer_id=oid, status=ApplicationStatus.REJECTED))
    
    # Reload company
    company = repo.get_company(company.id)
    print(f"Metrics after rejections: {company.metrics}")
    print(f"Flags: {company.flags}")
    # rejection_rate = 3/4 = 75% (> 70% threshold in code? let's check models.py)
    assert "HIGH_REJECTION" in company.flags
    assert company.global_flag_level == "red"

    print("Step 4: Testing 'No Response' detection...")
    # Create an old application
    oid_old = repo.save_offer(Offer(id=None, company_id=company.id, title="Old Role"))
    old_date = (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()
    aid_old = repo.save_application(Application(id=None, offer_id=oid_old, status=ApplicationStatus.APPLIED, applied_at=old_date))
    
    app_service.detect_no_responses(days_threshold=14)
    
    # Check if updated
    app_old = repo.get_application(aid_old)
    print(f"Old application status after detection: {app_old.status}")
    assert app_old.status == ApplicationStatus.NO_RESPONSE

    print("Verification successful!")

if __name__ == "__main__":
    try:
        from src.domain.models import Application, Offer
        test_ddd_workflow()
    finally:
        if TEST_DB.exists():
            try:
                os.remove(TEST_DB)
            except:
                pass
