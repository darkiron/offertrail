import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from src.infrastructure.database_manager import DatabaseManager
from src.infrastructure.repositories import SQLiteRepository
from src.application.services import ApplicationService, CompanyService
from src.domain.models import ApplicationStatus, OfferType, OfferSource, ApplicationChannel

def verify():
    db_path = Path("test_offertrail_v3.db")
    if db_path.exists():
        os.remove(db_path)
    
    db_manager = DatabaseManager(db_path)
    db_manager.init_db()
    repository = SQLiteRepository(db_manager)
    app_service = ApplicationService(repository)
    comp_service = CompanyService(repository)

    print("--- 1. Testing Company Search and Duplicate Detection ---")
    # Initial state
    results = repository.search_companies("Acme")
    print(f"Searching 'Acme' (empty): {len(results)}")
    
    # Create first company
    app_id1 = app_service.apply_to_offer(
        company_name="Acme Corp",
        offer_title="Senior Developer",
        offer_type=OfferType.CDI,
        source=OfferSource.LINKEDIN,
        channel=ApplicationChannel.JOB_BOARD
    )
    print(f"Created first application (ID: {app_id1}) with 'Acme Corp'")
    
    # Search again
    results = repository.search_companies("acme")
    print(f"Searching 'acme' (case-insensitive): Found {len(results)} matches (Expected: 1)")
    
    # Test duplicate detection
    duplicate = repository.find_company_by_name("ACME CORP")
    print(f"Find 'ACME CORP' (exact name, diff case): Found company ID {duplicate.id if duplicate else 'None'} (Expected: 1)")

    print("\n--- 2. Testing Unsolicited Application (No Offer) ---")
    app_id2 = app_service.apply_to_offer(
        company_name="Acme Corp",
        offer_title=None, # Unsolicited
        channel=ApplicationChannel.EMAIL
    )
    print(f"Created second (unsolicited) application (ID: {app_id2}) for existing 'Acme Corp'")

    print("\n--- 3. Testing Stats and Flags Aggregation ---")
    company = repository.get_company(duplicate.id)
    print(f"Company 'Acme Corp' now has:")
    print(f"- Offers: {len(company.offers)}")
    print(f"- Direct Applications: {len(company.applications)}")
    print(f"- Total Apps (Metrics): {company.metrics['total_apps']}")
    
    # Add more rejections to trigger flags
    for i in range(3):
        aid = app_service.apply_to_offer(company_name="Acme Corp", offer_title=f"Role {i}")
        app_service.update_application_status(aid, ApplicationStatus.REJECTED)
    
    company = repository.get_company(duplicate.id)
    print(f"After 3 rejections:")
    print(f"- Total Apps: {company.metrics['total_apps']}")
    print(f"- Rejection Rate: {company.metrics['rejection_rate']}%")
    print(f"- Flags: {company.flags}")
    print(f"- Flag Level: {company.global_flag_level}")

    print("\n--- 4. Testing Application List View Join ---")
    all_apps = repository.list_applications()
    print(f"Total applications listed: {len(all_apps)}")
    for app in all_apps:
        title = app.get('title') or "Unsolicited"
        print(f"App {app['id']}: {app['company_name']} - {title} ({app['status']})")

    print("\nVerification successful!")
    # Cleanup
    try:
        os.remove(db_path)
    except:
        pass

if __name__ == "__main__":
    verify()
