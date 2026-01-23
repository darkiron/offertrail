from fastapi.testclient import TestClient
from src.main import app
from src import database

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
            "applied_at": "2024-01-23"
        }, follow_redirects=True)
        assert response.status_code == 200
        assert "TestCorp" in response.text
        assert "Tester" in response.text

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
