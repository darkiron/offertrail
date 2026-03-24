import sys
import os
from datetime import datetime, timezone, timedelta

# Add the project root to the python path
sys.path.append(os.getcwd())

from src.infrastructure.database_manager import DatabaseManager
from src.infrastructure.repositories import SQLiteRepository
from src.application.services import ApplicationService
from src.domain.models import ApplicationStatus, OfferType, OfferSource, ApplicationChannel
from pathlib import Path

def test_event_driven_metrics():
    db_path = Path("test_event_metrics.db")
    if db_path.exists():
        db_path.unlink()
    
    db_manager = DatabaseManager(db_path)
    db_manager.init_db()
    repository = SQLiteRepository(db_manager)
    app_service = ApplicationService(repository)
    
    print("1. Creating a company and an application...")
    app_id = app_service.apply_to_offer(
        company_name="Test Event Co",
        offer_title="Event Engineer",
        applied_at=datetime.now(timezone.utc).isoformat()
    )
    
    app = repository.get_application(app_id)
    company = repository.get_company(app.company_id)
    
    print(f"Initial Metrics: {company.metrics}")
    assert company.metrics["response_rate"] == 0
    assert company.metrics["total_apps"] == 1
    
    print("\n2. Changing status to REJECTED (should NOT increase response_rate)...")
    app.status = ApplicationStatus.REJECTED
    repository.save_application(app)
    
    company = repository.get_company(app.company_id)
    print(f"Metrics after REJECTED status: {company.metrics}")
    assert company.metrics["response_rate"] == 0
    assert company.metrics["rejections"] == 1
    
    print("\n3. Recording RESPONSE_RECEIVED event (should increase response_rate)...")
    app_service.record_response_received(app_id)
    
    company = repository.get_company(app.company_id)
    print(f"Metrics after RESPONSE_RECEIVED event: {company.metrics}")
    assert company.metrics["response_rate"] == 100
    assert company.metrics["total_apps"] == 1
    
    print("\n4. Verifying timeline events...")
    events = repository.get_events_for_entity("application", app_id)
    event_types = [e["type"] for e in events]
    print(f"Events: {event_types}")
    assert "RESPONSE_RECEIVED" in event_types
    assert "CREATED" in event_types
    
    print("\nVerification successful!")
    
    # Cleanup
    if db_path.exists():
        try:
            db_path.unlink()
        except:
            pass

if __name__ == "__main__":
    test_event_driven_metrics()
