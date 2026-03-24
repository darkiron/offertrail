import sqlite3
import os
from pathlib import Path
from datetime import datetime, timezone
import json

# Force a clean test DB for verification
TEST_DB_PATH = Path("test_offertrail.db")
if TEST_DB_PATH.exists():
    os.remove(TEST_DB_PATH)

# Import from database after setting DB_PATH
import src.database as db
db.DB_PATH = TEST_DB_PATH

def test_migration_and_metrics():
    db.init_db()
    
    with db.get_db() as conn:
        # Simulate old structure by inserting manually (since init_db now has new structure)
        # But we already updated init_db, so we test if new logic works.
        
        # 1. Create applications for the same company
        db.create_application("Acme Corp", "Dev", "CDI", "APPLIED")
        db.create_application("Acme Corp", "Senior Dev", "CDI", "REJECTED")
        db.create_application("Acme Corp", "Lead Dev", "CDI", "REJECTED")
        db.create_application("Acme Corp", "Staff Dev", "CDI", "REJECTED") # 3 rejections
        
        # 2. Create applications for another company (no response)
        db.create_application("Ghost Ltd", "Dev", "FREELANCE", "NO_RESPONSE")
        db.create_application("Ghost Ltd", "Dev 2", "FREELANCE", "NO_RESPONSE")
        db.create_application("Ghost Ltd", "Dev 3", "FREELANCE", "NO_RESPONSE")
        
        # 3. Create a contact for Acme
        db.create_contact("John Doe", "john@acme.com", "123", "Acme Corp")
        
    # Verify aggregation
    companies = db.list_companies()
    print(f"Companies found: {[c['name'] for c in companies]}")
    
    acme = next(c for c in companies if c["name"] == "Acme Corp")
    print(f"Acme metrics: apps={acme['applications_count']}, rejected={acme['rejected_count']}, rate={acme['rejected_rate']}%")
    print(f"Acme flags: {acme['flags']}")
    
    ghost = next(c for c in companies if c["name"] == "Ghost Ltd")
    print(f"Ghost metrics: apps={ghost['applications_count']}, no_response={ghost['no_response_count']}, resp_rate={ghost['response_rate']}%")
    print(f"Ghost flags: {ghost['flags']}")

    # Assertions
    assert acme["applications_count"] == 4
    assert acme["rejected_count"] == 3
    assert "HIGH_REJECTION" in acme["flags"]
    
    assert ghost["applications_count"] == 3
    assert ghost["no_response_count"] == 3
    assert "NO_RESPONSE_PATTERN" in ghost["flags"]
    
    print("Verification successful!")

if __name__ == "__main__":
    test_migration_and_metrics()
    if TEST_DB_PATH.exists():
        os.remove(TEST_DB_PATH)
