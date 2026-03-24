import sqlite3
from src import database
import os

def test_company_metrics():
    # Use a temporary test database
    test_db = "test_metrics.db"
    if os.path.exists(test_db):
        os.remove(test_db)
    
    # Monkeypatch DB_PATH in database module
    database.DB_PATH = test_db
    database.init_db()
    
    # 1. Create a company with multiple applications
    # Company A: 4 apps, 3 rejected, 1 no response -> High Rejection
    database.create_application("Company A", "Job 1", "CDI", "REJECTED")
    database.create_application("Company A", "Job 2", "CDI", "REJECTED")
    database.create_application("Company A", "Job 3", "CDI", "REJECTED")
    database.create_application("Company A", "Job 4", "CDI", "NO_RESPONSE")
    
    # Company B: 3 apps, 3 no response -> No Response Pattern, Low Response Rate
    database.create_application("Company B", "Job 1", "CDI", "NO_RESPONSE")
    database.create_application("Company B", "Job 2", "CDI", "NO_RESPONSE")
    database.create_application("Company B", "Job 3", "CDI", "NO_RESPONSE")

    # Company C: 3 apps, 1 offer, 2 interview -> Clean
    database.create_application("Company C", "Job 1", "CDI", "OFFER")
    database.create_application("Company C", "Job 2", "CDI", "INTERVIEW")
    database.create_application("Company C", "Job 3", "CDI", "INTERVIEW")

    companies = database.list_companies()
    
    for c in companies:
        print(f"Company: {c['name']}")
        print(f"  Apps: {c['applications_count']}")
        print(f"  Rejected: {c['rejected_offers_count']}")
        print(f"  Unanswered: {c['unanswered_offers_count']}")
        print(f"  Responded: {c['responded_offers_count']}")
        print(f"  Response Rate: {c['response_rate']}%")
        print(f"  Flags: {c['flags']}")
        print("-" * 20)
        
        if c['name'] == "Company A":
            assert "HIGH_REJECTION" in c['flags']
            assert c['rejected_offers_count'] == 3
            assert c['unanswered_offers_count'] == 1
        if c['name'] == "Company B":
            assert "NO_RESPONSE_PATTERN" in c['flags']
            assert "LOW_RESPONSE_RATE" in c['flags']
            assert c['unanswered_offers_count'] == 3
        if c['name'] == "Company C":
            assert len(c['flags']) == 0
            assert c['responded_offers_count'] == 3

    print("All tests passed!")
    
    if os.path.exists(test_db):
        os.remove(test_db)

if __name__ == "__main__":
    test_company_metrics()
