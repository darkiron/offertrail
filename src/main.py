import subprocess
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from .infrastructure.database_manager import DatabaseManager
from .infrastructure.repositories import SQLiteRepository
from .application.services import ApplicationService, CompanyService
from .api.companies import get_company_router
from .domain.models import ApplicationStatus, OfferType, OfferSource, ApplicationChannel
from pathlib import Path

DB_PATH = Path("offertrail_new.db")
db_manager = DatabaseManager(DB_PATH)
repository = SQLiteRepository(db_manager)
app_service = ApplicationService(repository)
comp_service = CompanyService(repository)

@asynccontextmanager
async def lifespan(app: FastAPI):
    db_manager.init_db()
    # Trigger no-response detection
    app_service.detect_no_responses()
    yield

app = FastAPI(title="Offertrail", lifespan=lifespan)
app.include_router(get_company_router(comp_service))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

templates = Jinja2Templates(directory="src/templates")

def get_branch_name():
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode("utf-8").strip()
    except Exception:
        return "dev"

@app.get("/companies", response_class=HTMLResponse)
async def list_companies_page(request: Request, q: Optional[str] = None):
    if q:
        companies = repository.search_companies(q)
    else:
        companies = repository.list_companies()
    return templates.TemplateResponse(request, "companies/index.html", {
        "companies": companies,
        "q": q,
        "branch_name": get_branch_name()
    })

@app.get("/companies/{company_id}", response_class=HTMLResponse)
async def company_details_page(request: Request, company_id: int):
    details = comp_service.get_company_details(company_id)
    if not details:
        return RedirectResponse(url="/companies", status_code=404)
    return templates.TemplateResponse(request, "companies/details.html", {
        "company_details": details,
        "branch_name": get_branch_name()
    })

@app.get("/", response_class=HTMLResponse)
async def list_applications(
    request: Request,
    status: str = None,
    search: str = None
):
    apps = repository.list_applications(status=status)
    kpis = repository.get_kpis()
    
    return templates.TemplateResponse(request, "index.html", {
        "branch_name": get_branch_name(),
        "applications": apps,
        "filters": {"status": status},
        "search": search,
        "kpis": kpis,
        "monthly_kpis": {"created": 0, "responses": 0, "rejected": 0, "followups_due": 0},
        "annual_stats": [],
        "followups": [],
        "sources": []
    })

@app.get("/companies/search")
async def search_companies_api(q: Optional[str] = ""):
    # Accept empty q to avoid 422 and return top companies
    if q is None:
        q = ""
    companies = repository.search_companies(q) if q else repository.list_companies()
    # Limit to 20 results for empty queries
    results = companies[:20] if not q else companies
    return [{"id": c.id, "name": c.name} for c in results]

@app.get("/api/insights/monthly-applications")
async def api_monthly_applications(year: int = None):
    if year is None:
        year = datetime.now().year
    
    stats = repository.get_annual_monthly_stats(year)
    return {
        "year": year,
        "months": stats
    }

@app.get("/api/dashboard")
async def api_dashboard():
    kpis = repository.get_kpis()
    # For now, return simplified monthly KPIs as expected by frontend types
    monthly_kpis = [] 
    sources = []
    
    # Get follow-ups (applications with next_action_at in the future or past but not done)
    # Reusing list_applications logic but filtered for followups
    all_apps = repository.list_applications()
    followups = [a for a in all_apps if a.get("next_action_at")]
    
    return {
        "kpis": kpis,
        "monthly_kpis": monthly_kpis,
        "sources": sources,
        "followups": followups
    }

@app.get("/api/applications")
async def api_applications(
    status: str = None,
    type: str = None,
    source: str = None,
    search: str = None,
    show_hidden: bool = False,
    page: int = 1,
    limit: int = 50
):
    offset = (page - 1) * limit
    
    apps_data = repository.list_applications(
        status=status, 
        search=search, 
        limit=limit,
        offset=offset
    )
    
    # apps_data from repository.list_applications are already enriched if repo supports it
    # repository.list_applications returns list of dicts or list of Application objects?
    # Based on src/main.py:155 it seems it returns list of dicts that might need normalization
    
    total = repository.count_applications(
        status=status,
        search=search
    )
    
    # Ensure each item is a dict with structured company
    items = []
    for app_item in apps_data:
        if isinstance(app_item, dict):
            # If it's already a dict, ensure it has structured company
            if "company_id" in app_item and "company_name" in app_item and "company" not in app_item:
                app_item["company"] = {"id": app_item["company_id"], "name": app_item["company_name"]}
            items.append(app_item)
        else:
            # If it's an Application object
            items.append(app_item.to_dict(include_company=True))
            
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.post("/api/applications")
async def api_create_application(request: Request):
    # Support both flat and wrapped "data" formats
    payload = await request.json()
    data = payload.get("data") if "data" in payload else payload
    
    # Extract data from JSON body
    company_name = data.get("new_company_name") or data.get("company_name")
    company_id = data.get("company_id")
    title = data.get("title") or "Unknown"
    status_str = data.get("status") or "APPLIED"
    applied_at = data.get("applied_at") or datetime.now().isoformat()
    notes = data.get("notes")
    
    # Simple validation
    if not company_id and not company_name:
        raise HTTPException(status_code=422, detail="Company ID or name is required")
        
    app_id = app_service.apply_to_offer(
        company_name=company_name or "Unknown",
        company_id=int(company_id) if company_id else None,
        offer_title=title,
        applied_at=applied_at
    )
    
    if notes:
        repository.update_application_notes(app_id, notes)
    
    if status_str != "APPLIED":
        try:
            status = ApplicationStatus(status_str)
            app_service.update_application_status(app_id, status)
        except ValueError:
            pass

    return {"id": app_id, "status": "success"}

@app.get("/api/companies")
async def api_list_companies():
    companies = repository.list_companies()
    # List view doesn't need all nested relations by default
    return [c.to_dict(include_related=False) for c in companies]

@app.get("/api/companies/{company_id}")
async def api_get_company(company_id: int):
    company = repository.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Detail view includes all relations
    return company.to_dict(include_related=True)

@app.get("/api/applications/{app_id}")
async def api_application_details(app_id: int):
    app_data = repository.get_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Enrich with company and offer info for the frontend
    company = repository.get_company(app_data.company_id)
    
    # Use the new to_dict with structured company object
    app_dict = app_data.to_dict(include_company=True, company_name=company.name if company else None)
    
    # Get offer info if exists
    offer = None
    if app_data.offer_id:
        offer = repository.get_offer(app_data.offer_id)
        if offer:
            app_dict["offer"] = {
                "id": offer.id,
                "title": offer.title,
                "type": offer.contract_type.value,
                "url": offer.url,
                "source": offer.source.value
            }
            # Fallback for old frontend
            app_dict["title"] = offer.title
            app_dict["job_url"] = offer.url
            app_dict["type"] = offer.contract_type.value
            app_dict["source"] = offer.source.value
    
    events = repository.get_events_for_entity("application", app_id)
    # Payload is already parsed and sanitized by repository._get_events_for_entity_with_conn
    
    # Get contacts for this company
    contacts = []
    if app_data.company_id:
        # Use existing company object if available to avoid DB hit
        if company:
            contacts = [c.to_dict() for c in company.contacts]
        else:
            with repository.db_manager.get_connection() as conn:
                contacts_objs = repository._get_contacts_by_company(conn, app_data.company_id)
                contacts = [c.to_dict() for c in contacts_objs]
    
    # Get all contacts for the link modal
    all_contacts_objs = repository.list_contacts()
    all_contacts = [c.to_dict() for c in all_contacts_objs]
    
    return {
        "application": app_dict,
        "company": company.to_dict() if company else None,
        "events": events,
        "contacts": contacts,
        "all_contacts": all_contacts
    }

@app.post("/api/applications/create_legacy")
async def api_create_application_legacy(data: dict):
    company_id = data.get("company_id")
    company = repository.get_company(company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company_name = company.name
    
    app_id = app_service.apply_to_offer(
        company_name=company_name,
        company_id=company_id,
        offer_title=data.get("title"),
        offer_type=OfferType(data.get("type", "CDI")),
        source=OfferSource(data.get("source", "OTHER")),
        channel=ApplicationChannel(data.get("channel", "OTHER")),
        url=data.get("job_url"),
        applied_at=data.get("applied_at")
    )
    
    app = repository.get_application(app_id)
    return app.to_dict() if app else {"id": app_id}

@app.patch("/api/applications/{app_id}")
async def api_update_application(app_id: int, data: dict):
    existing = repository.get_application(app_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if "status" in data:
        existing.status = ApplicationStatus(data["status"])
    if "notes" in data:
        existing.notes = data["notes"]
    if "next_action_at" in data:
        existing.next_action_at = data["next_action_at"]
    if "last_contact_at" in data:
        existing.last_contact_at = data["last_contact_at"]
    
    repository.save_application(existing)
    return existing.to_dict()

@app.post("/api/applications/{app_id}/notes")
async def api_add_note(app_id: int, data: dict):
    existing = repository.get_application(app_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    
    new_note = data.get("text", "")
    if existing.notes:
        existing.notes += f"\n---\n{new_note}"
    else:
        existing.notes = new_note
        
    repository.save_application(existing)
    return existing.to_dict()

@app.post("/api/applications/{app_id}/response")
async def api_record_response(app_id: int):
    app_service.record_response_received(app_id)
    return {"success": True}

@app.post("/api/applications/{app_id}/followup")
async def api_mark_followup(app_id: int):
    # This is usually to record that a followup was sent
    # We can add an event
    with repository.db_manager.get_connection() as conn:
        repository.log_event(conn, "application", app_id, "FOLLOW_UP_SENT", {"ts": datetime.now().isoformat()})
    return {"success": True}

@app.post("/api/applications/{app_id}/events")
async def api_create_app_event(app_id: int, data: dict):
    with repository.db_manager.get_connection() as conn:
        repository.log_event(conn, "application", app_id, data.get("event_type"), {"source": "api"})
    return {"success": True}

@app.post("/api/applications/{app_id}/link-contact")
async def api_link_contact(app_id: int, data: dict):
    existing = repository.get_application(app_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    
    existing.primary_contact_id = data.get("contact_id")
    repository.save_application(existing)
    return {"success": True}

@app.post("/api/applications/{app_id}/create-contact")
async def api_create_contact(app_id: int, data: dict):
    existing = repository.get_application(app_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Simple split of name into first/last
    name = data.get("name", "")
    parts = name.split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else ""
        
    contact = Contact(
        id=None,
        company_id=existing.company_id,
        first_name=first_name,
        last_name=last_name,
        email=data.get("email"),
        phone=data.get("phone"),
        role=ContactRole.OTHER,
        notes=None
    )
    contact_id = repository.save_contact(contact)
    existing.primary_contact_id = contact_id
    repository.save_application(existing)
    
    return contact.to_dict()

@app.get("/applications/{app_id}", response_class=HTMLResponse)
async def application_details(request: Request, app_id: int):
    app_data = repository.get_application(app_id)
    if not app_data:
        return RedirectResponse(url="/", status_code=404)
    
    # We need to get the offer to get the company_id and then the company
    with db_manager.get_connection() as conn:
        offer_row = conn.execute("SELECT * FROM offers WHERE id = ?", (app_data.offer_id,)).fetchone()
        offer = dict(offer_row) if offer_row else None
        
    company_info = None
    if offer:
        company_info = comp_service.get_company_details(offer["company_id"])
        
    events = repository.get_events_for_entity("application", app_id)
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    # For now, let's keep all_contacts as a simple list from database
    # (should eventually be in repository)
    with db_manager.get_connection() as conn:
        all_contacts = [dict(r) for r in conn.execute("SELECT * FROM contacts").fetchall()]
        # And contacts for THIS company
        contacts = [dict(r) for r in conn.execute("SELECT * FROM contacts WHERE company_id = ?", (offer["company_id"] if offer else 0,)).fetchall()]
    
    # Adapt to template (it expects application as dict with legacy field names for now)
    app_dict = {
        "id": app_data.id,
        "company": company_info["company"].name if company_info else "Unknown",
        "title": offer["title"] if offer else "Unknown",
        "type": offer["type"] if offer else "Unknown",
        "source": offer["source"] if offer else "Unknown",
        "job_url": offer["url"] if offer else "Unknown",
        "status": app_data.status.value,
        "applied_at": app_data.applied_at,
        "next_followup_at": app_data.next_action_at,
        "notes": app_data.notes
    }

    return templates.TemplateResponse(request, "details.html", {
        "branch_name": get_branch_name(),
        "application": app_dict,
        "company": company_info,
        "events": events,
        "contacts": contacts,
        "all_contacts": all_contacts
    })

@app.post("/applications/{app_id}/events")
async def create_app_event(app_id: int, event_type: str = Form(...)):
    with repository.db_manager.get_connection() as conn:
        repository.log_event(conn, "application", app_id, event_type, {"source": "manual_dashboard_lite"})
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/dashboard", response_class=HTMLResponse)
async def kpi_dashboard(
    request: Request,
    status: str = None,
    type: str = None,
    source: str = None
):
    kpis = repository.get_kpis()
    sources = [] # repository.get_distinct_sources() - not implemented yet
    
    return templates.TemplateResponse(request, "dashboard.html", {
        "branch_name": get_branch_name(),
        "kpis": kpis,
        "filters": {"status": status},
        "sources": sources
    })

@app.post("/applications/{app_id}/link-contact", response_class=RedirectResponse)
async def link_contact(app_id: int, contact_id: int = Form(...)):
    app_data = repository.get_application(app_id)
    if app_data:
        app_data.primary_contact_id = contact_id
        repository.save_application(app_data)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/create-contact", response_class=RedirectResponse)
async def create_and_link_contact(
    app_id: int,
    name: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    company: str = Form(None)
):
    app_data = repository.get_application(app_id)
    if app_data:
        parts = name.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""
        contact = Contact(
            id=None,
            company_id=app_data.company_id,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone
        )
        contact_id = repository.save_contact(contact)
        app_data.primary_contact_id = contact_id
        repository.save_application(app_data)
        
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/followups", response_class=HTMLResponse)
async def list_followups(request: Request):
    apps = repository.list_applications()
    followups = [a for a in apps if a.get("next_action_at")]
    return templates.TemplateResponse(request, "followups.html", {
        "branch_name": get_branch_name(),
        "applications": followups
    })

@app.post("/applications/{app_id}/followup", response_class=RedirectResponse)
async def mark_followup(app_id: int):
    with repository.db_manager.get_connection() as conn:
        repository.log_event(conn, "application", app_id, "FOLLOW_UP_SENT", {"ts": datetime.now().isoformat()})
    return RedirectResponse(url="/#queue", status_code=303)

@app.post("/applications/{app_id}/status", response_class=RedirectResponse)
async def update_status(app_id: int, status: str = Form(...)):
    app_service.update_application_status(app_id, ApplicationStatus(status))
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/notes", response_class=RedirectResponse)
async def add_note(app_id: int, text: str = Form(...)):
    app_service.update_application_status(app_id, None, notes=text)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def parse_date(date_str):
    if not date_str or not date_str.strip():
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(date_str.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return None

@app.post("/api/import")
async def api_process_import(data: dict):
    tsv_data = data.get("tsv", "")
    lines = tsv_data.strip().split("\n")
    if not lines:
        return {"error": "Empty data"}
    
    header = lines[0].split("\t")
    rows = lines[1:]
    
    mapping = {
        "Entreprise": "company",
        "Poste": "title",
        "Lien de l’offre": "job_url",
        "Type": "type",
        "Source": "source",
        "Date candidature": "applied_at",
        "Statut": "status",
        "Date relance prévue": "next_followup_at",
        "Notes": "notes",
        "Contact RH": "contact_rh",
        "Email RH": "email_rh",
        "Téléphone": "phone"
    }
    
    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in mapping:
            col_map[mapping[h_clean]] = i

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}
    
    status_map = {
        "INTERESTED": "INTERESTED", "A CONTACTER": "INTERESTED",
        "APPLIED": "APPLIED", "POSTULÉ": "APPLIED", "CANDIDATURE ENVOYÉE": "APPLIED",
        "INTERVIEW": "INTERVIEW", "ENTRETIEN": "INTERVIEW",
        "OFFER": "OFFER", "OFFRE": "OFFER",
        "REJECTED": "REJECTED", "REFUSÉ": "REJECTED"
    }

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2
        
        try:
            def get_val(key):
                if key in col_map and col_map[key] < len(cols):
                    return cols[col_map[key]].strip()
                return None

            company = get_val("company")
            title = get_val("title")
            
            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue
            
            job_url = get_val("job_url")
            app_type = get_val("type") or "CDI"
            if "FREE" in app_type.upper():
                app_type = "FREELANCE"
            else:
                app_type = "CDI"
            
            source = get_val("source")
            applied_at = parse_date(get_val("applied_at"))
            next_followup_at = parse_date(get_val("next_followup_at"))
            
            # Create via service
            app_id = app_service.apply_to_offer(
                company_name=company,
                offer_title=title,
                offer_type=OfferType.FREELANCE if app_type == "FREELANCE" else OfferType.CDI,
                source=OfferSource.OTHER, # Default for import
                url=job_url,
                applied_at=applied_at
            )
            
            app = repository.get_application(app_id)
            if not app:
                continue

            if next_followup_at:
                app.next_action_at = next_followup_at
                repository.save_application(app)
            
            # Update status if needed
            if status != "APPLIED":
                app.status = ApplicationStatus(status)
                repository.save_application(app)

            # Handle extra fields as notes
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                app.notes = "\n".join(notes)
                repository.save_application(app)
            
            results["created"] += 1
            
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    return results

@app.get("/import", response_class=HTMLResponse)
async def import_page(request: Request):
    return templates.TemplateResponse(request, "import.html", {
        "branch_name": get_branch_name(),
        "results": None
    })

@app.post("/import", response_class=HTMLResponse)
async def process_import(request: Request, tsv_data: str = Form(...)):
    lines = tsv_data.strip().split("\n")
    if not lines:
        return RedirectResponse(url="/import", status_code=303)
    
    header = lines[0].split("\t")
    rows = lines[1:]
    
    mapping = {
        "Entreprise": "company",
        "Poste": "title",
        "Lien de l’offre": "job_url",
        "Type": "type",
        "Source": "source",
        "Date candidature": "applied_at",
        "Statut": "status",
        "Date relance prévue": "next_followup_at",
        "Notes": "notes",
        "Contact RH": "contact_rh",
        "Email RH": "email_rh",
        "Téléphone": "phone"
    }
    
    # Reverse mapping for easy lookup
    col_map = {}
    for i, h in enumerate(header):
        h_clean = h.strip()
        if h_clean in mapping:
            col_map[mapping[h_clean]] = i

    results = {"total": len(rows), "created": 0, "skipped": 0, "errors": []}
    
    status_map = {
        "INTERESTED": "INTERESTED", "A CONTACTER": "INTERESTED",
        "APPLIED": "APPLIED", "POSTULÉ": "APPLIED", "CANDIDATURE ENVOYÉE": "APPLIED",
        "INTERVIEW": "INTERVIEW", "ENTRETIEN": "INTERVIEW",
        "OFFER": "OFFER", "OFFRE": "OFFER",
        "REJECTED": "REJECTED", "REFUSÉ": "REJECTED"
    }

    for idx, row_str in enumerate(rows):
        cols = row_str.split("\t")
        row_num = idx + 2
        
        try:
            def get_val(key):
                if key in col_map and col_map[key] < len(cols):
                    return cols[col_map[key]].strip()
                return None

            company = get_val("company")
            title = get_val("title")
            
            if not company or not title:
                results["skipped"] += 1
                results["errors"].append({"row": row_num, "reason": "Missing Company or Job Title"})
                continue
            
            job_url = get_val("job_url")
            app_type = get_val("type") or "CDI"
            if "FREE" in app_type.upper():
                app_type = "FREELANCE"
            else:
                app_type = "CDI"
            
            source = get_val("source")
            applied_at = parse_date(get_val("applied_at"))
            next_followup_at = parse_date(get_val("next_followup_at"))
            
            # Create via service
            app_id = app_service.apply_to_offer(
                company_name=company,
                offer_title=title,
                offer_type=OfferType.FREELANCE if app_type == "FREELANCE" else OfferType.CDI,
                source=OfferSource.OTHER, # Default for import
                url=job_url,
                applied_at=applied_at
            )
            
            app = repository.get_application(app_id)
            if not app:
                continue

            if next_followup_at:
                app.next_action_at = next_followup_at
                repository.save_application(app)
            
            # Update status if needed
            if status != "APPLIED":
                app.status = ApplicationStatus(status)
                repository.save_application(app)

            # Handle extra fields as notes
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                app.notes = "\n".join(notes)
                repository.save_application(app)
            
            results["created"] += 1
            
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    return templates.TemplateResponse(request, "import.html", {
        "branch_name": get_branch_name(),
        "results": results
    })
