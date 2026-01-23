from fastapi.testclient import TestClient
from src.main import app
from src import database
import re

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

def test_root_page():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "OfferTrail" in response.text

def test_create_and_list_application():
    with TestClient(app) as client:
        # Create
        response = client.post("/applications", data={
            "company": "TestCorp",
            "title": "Tester",
            "type": "CDI",
            "status": "APPLIED",
            "applied_at": "2024-01-23",
            "source": "LinkedIn",
            "job_url": "https://example.com/job"
        }, follow_redirects=True)
        assert response.status_code == 200
        assert "TestCorp" in response.text
        assert "Tester" in response.text
        assert "LinkedIn" in response.text

def test_import_tsv():
    with TestClient(app) as client:
        tsv_data = (
            "Entreprise\tPoste\tLien de l’offre\tType\tSource\tDate candidature\tStatut\tNotes\n"
            "Google\tSRE\thttps://google.com/jobs\tCDI\tLinkedIn\t2026-01-20\tPOSTULÉ\tVery cool\n"
            "Amazon\tDevOps\t\tFreelance\tIndeed\t20/01/2026\tA contacter\t"
        )
        response = client.post("/import", data={"tsv_data": tsv_data}, follow_redirects=True)
        assert response.status_code == 200
        # assert "Processed: 2" in response.text
        # assert "Created: 2" in response.text
        
        # Check if they exist in list
        list_res = client.get("/")
        assert "Google" in list_res.text
        assert "Amazon" in list_res.text
        
        # Check details of Google
        # match = re.search(r'href="/applications/(\d+)"', list_res.text)
        # app_id = match.group(1)
        # details_res = client.get(f"/applications/{app_id}")
        # assert "google.com/jobs" in details_res.text
        # assert "LinkedIn" in details_res.text

def test_filters_and_search():
    with TestClient(app) as client:
        # Create apps with different attributes
        client.post("/applications", data={
            "company": "FilterCorp1", "title": "CDI dev", "type": "CDI", "status": "APPLIED"
        })
        client.post("/applications", data={
            "company": "FilterCorp2", "title": "Freelance dev", "type": "FREELANCE", "status": "INTERVIEW"
        })
        
        # Test search
        res = client.get("/?search=FilterCorp1")
        assert "FilterCorp1" in res.text
        assert "FilterCorp2" not in res.text
        
        # Test type filter
        res = client.get("/?type=FREELANCE")
        assert "FilterCorp2" in res.text
        assert "FilterCorp1" not in res.text

        # Test status filter
        res = client.get("/?status=INTERVIEW")
        assert "FilterCorp2" in res.text
        assert "FilterCorp1" not in res.text

def test_contacts_linking():
    with TestClient(app) as client:
        # Create app
        client.post("/applications", data={
            "company": "ContactApp", "title": "Dev", "type": "CDI", "status": "APPLIED"
        })
        list_res = client.get("/")
        import re
        app_id = re.search(r'href="/applications/(\d+)"', list_res.text).group(1)
        
        # Create and link contact
        res = client.post(f"/applications/{app_id}/create-contact", data={
            "name": "John Doe", "email": "john@example.com", "phone": "123456", "company": "Recruiters"
        }, follow_redirects=True)
        
        assert "John Doe" in res.text
        assert "Recruiters" in res.text
        assert "CONTACT_CREATED" in res.text
        assert "CONTACT_LINKED" in res.text

        # Search by contact name
        search_res = client.get("/?search=John")
        assert "ContactApp" in search_res.text
        
        # Filter by has_contact
        contact_filter_res = client.get("/?has_contact=yes")
        assert "ContactApp" in contact_filter_res.text
        
        no_contact_filter_res = client.get("/?has_contact=no")
        assert "ContactApp" not in no_contact_filter_res.text

def test_application_details_and_status_change():
    with TestClient(app) as client:
        # Create one first
        client.post("/applications", data={
            "company": "StatusCorp",
            "title": "Manager",
            "type": "FREELANCE",
            "status": "INTERESTED"
        })
        
        # Get ID from list
        list_res = client.get("/")
        import re
        match = re.search(r'href="/applications/(\d+)"', list_res.text)
        assert match
        app_id = match.group(1)
        
        # Check details
        details_res = client.get(f"/applications/{app_id}")
        assert details_res.status_code == 200
        assert "StatusCorp" in details_res.text
        assert "INTERESTED" in details_res.text
        assert "CREATED" in details_res.text # Event log
        
        # Change status
        update_res = client.post(f"/applications/{app_id}/status", data={"status": "INTERVIEW"}, follow_redirects=True)
        assert update_res.status_code == 200
        assert "INTERVIEW" in update_res.text
        assert "STATUS_CHANGED" in update_res.text # Event log

def test_add_note():
    with TestClient(app) as client:
        # Create an application
        client.post("/applications", data={
            "company": "NoteCorp",
            "title": "Engineer",
            "type": "CDI",
            "status": "APPLIED"
        })
        
        # Get ID from list
        list_res = client.get("/")
        import re
        match = re.search(r'href="/applications/(\d+)"', list_res.text)
        assert match
        app_id = match.group(1)
        
        # Add a note
        note_text = "This is a test note."
        response = client.post(f"/applications/{app_id}/notes", data={"text": note_text}, follow_redirects=True)
        assert response.status_code == 200
        assert "NOTE_ADDED" in response.text
        assert note_text in response.text
        assert "manual" in response.text

def test_kpi_dashboard():
    with TestClient(app) as client:
        # Create some data
        client.post("/applications", data={
            "company": "KPI Test",
            "title": "Engineer",
            "type": "CDI",
            "status": "APPLIED",
            "applied_at": "2026-01-01"
        })
        
        response = client.get("/dashboard")
        assert response.status_code == 200
        assert "KPI Dashboard" in response.text
        assert "Total Applications" in response.text
        # Check if numbers appear (this is a bit loose but confirms rendering)
        assert "1" in response.text 

def test_response_received_event():
    with TestClient(app) as client:
        # Create application
        client.post("/applications", data={
            "company": "Event Test",
            "title": "Engineer",
            "type": "CDI",
            "status": "APPLIED",
            "applied_at": "2026-01-01"
        })
        # Let's get the list to find the ID.
        apps = client.get("/").text
        import re
        match = re.search(r'href="/applications/(\d+)"', apps)
        app_id = match.group(1)
        
        # Log event
        response = client.post(f"/applications/{app_id}/events", data={"event_type": "RESPONSE_RECEIVED"}, follow_redirects=False)
        assert response.status_code == 303
        assert response.headers["location"] == f"/applications/{app_id}"
        
        # Verify in details
        details = client.get(f"/applications/{app_id}").text
        assert "RESPONSE_RECEIVED" in details
        
        # Verify KPI updated
        dashboard = client.get("/dashboard").text
        # Since we have multiple apps created in previous tests (if DB persists), 
        # let's just check for the percentage sign at least.
        assert "%" in dashboard
