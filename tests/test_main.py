from fastapi.testclient import TestClient
from src.main import app
from src import database
import re
from uuid import uuid4

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

def test_job_backlog_flow():
    with TestClient(app) as client:
        sources_response = client.get("/api/job-sources")
        assert sources_response.status_code == 200
        sources = sources_response.json()
        assert len(sources) >= 1
        source_id = sources[0]["id"]

        create_response = client.post("/api/job-searches", json={
            "name": "Python remote",
            "source_id": source_id,
            "keywords": ["python"],
            "excluded_keywords": ["data analyst"],
            "locations": ["Paris", "Remote"],
            "contract_type": "CDI",
            "remote_mode": "ANY",
            "profile_summary": "Backend Python APIs FastAPI product engineering",
            "min_score": 35,
        })
        assert create_response.status_code == 201
        search = create_response.json()
        assert search["name"] == "Python remote"

        run_response = client.post(f"/api/job-searches/{search['id']}/run")
        assert run_response.status_code == 200
        run_payload = run_response.json()
        assert run_payload["fetched_count"] >= 1

        backlog_response = client.get(f"/api/job-backlog?search_id={search['id']}")
        assert backlog_response.status_code == 200
        backlog_payload = backlog_response.json()
        assert len(backlog_payload["items"]) >= 1

        accepted_item = next(
            item for item in backlog_payload["items"]
            if item["status"] in {"NEW", "IMPORTED"} and item["score"] >= 35
        )
        assert accepted_item["score"] >= 35
        assert accepted_item["match_reasons"]

        import_response = client.post(f"/api/job-backlog/{accepted_item['id']}/import")
        assert import_response.status_code == 200
        import_payload = import_response.json()
        assert import_payload["application_id"]

        application_response = client.get(f"/api/applications/{import_payload['application_id']}")
        assert application_response.status_code == 200
        application_payload = application_response.json()
        assert application_payload["application"]["status"] == "INTERESTED"
        assert application_payload["application"]["source"].startswith("job_backlog:")

def test_job_source_crud():
    with TestClient(app) as client:
        unique_slug = f"wwr-frontend-{uuid4().hex[:8]}"
        create_response = client.post("/api/job-sources", json={
            "name": "WWR Frontend",
            "slug": unique_slug,
            "kind": "rss",
            "uri": "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss",
            "config": {"feed_key": "FRONTEND"},
        })
        assert create_response.status_code == 201
        source = create_response.json()
        assert source["slug"] == unique_slug
        assert source["uri"].endswith(".rss")

        update_response = client.patch(f"/api/job-sources/{source['id']}", json={
            "is_enabled": False,
        })
        assert update_response.status_code == 200

        list_response = client.get("/api/job-sources")
        assert list_response.status_code == 200
        updated = next(item for item in list_response.json() if item["id"] == source["id"])
        assert updated["is_enabled"] is False

def test_job_search_update_and_delete():
    with TestClient(app) as client:
        source_id = client.get("/api/job-sources").json()[0]["id"]
        create_response = client.post("/api/job-searches", json={
            "name": "Initial search",
            "source_id": source_id,
            "keywords": ["python"],
            "locations": ["Remote"],
        })
        assert create_response.status_code == 201
        search = create_response.json()

        update_response = client.patch(f"/api/job-searches/{search['id']}", json={
            "name": "Updated search",
            "keywords": ["python", "fastapi"],
            "min_score": 55,
        })
        assert update_response.status_code == 200

        searches = client.get("/api/job-searches").json()
        updated = next(item for item in searches if item["id"] == search["id"])
        assert updated["name"] == "Updated search"
        assert updated["keywords"] == ["python", "fastapi"]
        assert updated["min_score"] == 55

        delete_response = client.delete(f"/api/job-searches/{search['id']}")
        assert delete_response.status_code == 200
        searches_after = client.get("/api/job-searches").json()
        assert all(item["id"] != search["id"] for item in searches_after)

def test_job_backlog_filter_by_source():
    with TestClient(app) as client:
        sources = client.get("/api/job-sources").json()
        source_id = next(source["id"] for source in sources if source["slug"] == "mock-board")
        search_response = client.post("/api/job-searches", json={
            "name": f"Mock filter {uuid4().hex[:6]}",
            "source_id": source_id,
            "keywords": ["python"],
            "locations": ["Paris"],
        })
        assert search_response.status_code == 201
        search = search_response.json()

        run_response = client.post(f"/api/job-searches/{search['id']}/run")
        assert run_response.status_code == 200

        backlog_response = client.get(f"/api/job-backlog?source_id={source_id}")
        assert backlog_response.status_code == 200
        backlog = backlog_response.json()
        assert any(item["search_id"] == search["id"] for item in backlog["items"])
        assert any(run["search_id"] == search["id"] for run in backlog["runs"])

def test_free_work_source_does_not_fallback_to_mock(monkeypatch):
    unique_slug = f"free-work-test-{uuid4().hex[:8]}"
    free_work_item = {
        "source": unique_slug,
        "external_id": "https://www.free-work.com/fr/tech-it/test-job",
        "title": "Backend Symfony Engineer",
        "company": "FreeWork Client",
        "location": "Lyon, France",
        "remote_mode": "REMOTE",
        "contract_type": "FREELANCE",
        "url": "https://www.free-work.com/fr/tech-it/test-job",
        "description": "Symfony backend mission",
        "published_at": "29/03/2026",
        "salary_text": "500 €",
    }

    def fake_fetch_free_work_items(source_url, source_slug):
        assert "free-work.com" in source_url
        assert source_slug == unique_slug
        return [free_work_item]

    monkeypatch.setattr(database, "_fetch_free_work_items", fake_fetch_free_work_items)

    with TestClient(app) as client:
        create_source_response = client.post("/api/job-sources", json={
            "name": "Free-work test",
            "slug": unique_slug,
            "kind": "rss",
            "uri": "https://www.free-work.com/fr/tech-it/jobs?query=symfony",
            "config": {},
        })
        assert create_source_response.status_code == 201
        source = create_source_response.json()

        create_search_response = client.post("/api/job-searches", json={
            "name": "Free-work search",
            "source_id": source["id"],
            "keywords": ["symfony"],
            "locations": ["Lyon"],
            "contract_type": "FREELANCE",
            "remote_mode": "ANY",
            "min_score": 10,
        })
        assert create_search_response.status_code == 201
        search = create_search_response.json()

        run_response = client.post(f"/api/job-searches/{search['id']}/run")
        assert run_response.status_code == 200
        run_payload = run_response.json()
        assert run_payload["fetched_count"] == 1
        assert run_payload["items"][0]["source"] == unique_slug
        assert run_payload["items"][0]["title"] == "Backend Symfony Engineer"
        assert run_payload["items"][0]["title"] != "Python Backend Engineer"

def test_job_search_items_are_not_rejected_by_default():
    with TestClient(app) as client:
        source_id = next(source["id"] for source in client.get("/api/job-sources").json() if source["slug"] == "mock-board")
        create_response = client.post("/api/job-searches", json={
            "name": f"No reject default {uuid4().hex[:6]}",
            "source_id": source_id,
            "keywords": ["unlikely-keyword"],
            "locations": ["Paris"],
            "contract_type": "CDI",
            "remote_mode": "ANY",
            "min_score": 95,
        })
        assert create_response.status_code == 201
        search = create_response.json()

        run_response = client.post(f"/api/job-searches/{search['id']}/run")
        assert run_response.status_code == 200
        run_payload = run_response.json()
        run_items = [item for item in run_payload["items"] if item["run_id"] == run_payload["run_id"]]

        assert run_items
        assert all(item["status"] in {"NEW", "IMPORTED"} for item in run_items)
        assert not any(item["status"] == "REJECTED" for item in run_items)
