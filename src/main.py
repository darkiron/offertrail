import subprocess
from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from . import database
import json
from contextlib import asynccontextmanager
from datetime import datetime

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield

app = FastAPI(title="OfferTrail", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/", response_class=HTMLResponse)
async def list_applications(
    request: Request,
    status: str = None,
    type: str = None,
    source: str = None,
    has_contact: str = None,
    followup_due: str = None,
    search: str = None,
    show_hidden: str = None
):
    filters = {
        "status": status,
        "type": type,
        "source": source,
        "has_contact": has_contact,
        "followup_due": followup_due
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    show_hidden_bool = show_hidden == "yes"
    apps = database.list_applications(filters=filters, search=search, show_hidden=show_hidden_bool)
    
    # Dashboard data
    kpis = database.get_kpis(filters)
    monthly_kpis = database.get_monthly_kpis()
    annual_stats = database.get_annual_monthly_stats()
    followups = database.list_followups()
    sources = database.get_distinct_sources()
    
    return templates.TemplateResponse(request, "index.html", {
        "branch_name": get_branch_name(),
        "applications": apps,
        "filters": filters,
        "search": search,
        "show_hidden": show_hidden_bool,
        "kpis": kpis,
        "monthly_kpis": monthly_kpis,
        "annual_stats": annual_stats,
        "followups": followups,
        "sources": sources
    })

@app.get("/api/dashboard")
async def api_dashboard(
    status: str = None,
    type: str = None,
    source: str = None,
):
    filters = {
        "status": status,
        "type": type,
        "source": source,
    }
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    kpis = database.get_kpis(filters)
    monthly_kpis = database.get_monthly_kpis()
    sources = database.get_distinct_sources()
    followups = database.list_followups()
    
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
    filters = {
        "status": status,
        "type": type,
        "source": source,
    }
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    offset = (page - 1) * limit
    
    apps = database.list_applications(
        filters=filters, 
        search=search, 
        show_hidden=show_hidden,
        limit=limit,
        offset=offset
    )
    total = database.count_applications(
        filters=filters,
        search=search,
        show_hidden=show_hidden
    )
    
    return {
        "items": apps,
        "total": total,
        "page": page,
        "limit": limit
    }

@app.post("/applications", response_class=RedirectResponse)
async def create_application(
    company: str = Form(...),
    title: str = Form(...),
    type: str = Form(...),
    status: str = Form(...),
    source: str = Form(None),
    job_url: str = Form(None),
    applied_at: str = Form(None),
    next_followup_at: str = Form(None)
):
    database.create_application(company, title, type, status, applied_at, next_followup_at, source, job_url)
    return RedirectResponse(url="/", status_code=303)

@app.get("/api/applications/{app_id}")
async def api_application_details(app_id: int):
    app_data = database.get_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
        
    events = database.get_events_for_entity("application", app_id)
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    contacts = database.get_contacts_for_application(app_id)
    
    for contact in contacts:
        contact_events = database.get_events_for_entity("contact", contact["id"])
        for ce in contact_events:
            ce["payload"] = json.loads(ce["payload_json"])
            # Enrichment: add contact name to event payload if not present
            if "name" not in ce["payload"]:
                ce["payload"]["contact_name"] = contact["name"]
            events.append(ce)
    
    events.sort(key=lambda x: x["ts"], reverse=True)
    
    return {
        "application": app_data,
        "events": events,
        "contacts": contacts,
        "all_contacts": database.list_contacts()
    }

@app.post("/api/applications", status_code=201)
async def api_create_application(data: dict):
    app_id = database.create_application(
        company=data.get("company"),
        title=data.get("title"),
        app_type=data.get("type"),
        status=data.get("status"),
        applied_at=data.get("applied_at"),
        next_followup_at=data.get("next_followup_at"),
        source=data.get("source"),
        job_url=data.get("job_url")
    )
    return {"id": app_id}

@app.patch("/api/applications/{app_id}")
async def api_update_application(app_id: int, data: dict):
    if "status" in data:
        database.update_application_status(app_id, data["status"])
    return {"success": True}

@app.post("/api/applications/{app_id}/notes")
async def api_add_note(app_id: int, data: dict):
    database.add_note(app_id, data.get("text", ""))
    return {"success": True}

@app.post("/api/applications/{app_id}/followup")
async def api_mark_followup(app_id: int):
    database.mark_followed_up(app_id)
    return {"success": True}

@app.post("/api/applications/{app_id}/events")
async def api_create_app_event(app_id: int, data: dict):
    with database.get_db() as conn:
        database.log_event(conn, "application", app_id, data.get("event_type"), {"source": "api"})
        conn.commit()
    return {"success": True}

@app.post("/api/applications/{app_id}/link-contact")
async def api_link_contact(app_id: int, data: dict):
    database.link_contact_to_application(app_id, data.get("contact_id"))
    return {"success": True}

@app.post("/api/applications/{app_id}/create-contact")
async def api_create_contact(app_id: int, data: dict):
    contact_id = database.create_contact(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        company=data.get("company")
    )
    database.link_contact_to_application(app_id, contact_id)
    return {"id": contact_id}

@app.get("/applications/{app_id}", response_class=HTMLResponse)
async def application_details(request: Request, app_id: int):
    app_data = database.get_application(app_id)
    if not app_data:
        return RedirectResponse(url="/", status_code=404)
        
    events = database.get_events_for_entity("application", app_id)
    # Parse payload_json for each event
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    contacts = database.get_contacts_for_application(app_id)
    all_contacts = database.list_contacts()
    
    # Also get contact events
    for contact in contacts:
        contact_events = database.get_events_for_entity("contact", contact["id"])
        for ce in contact_events:
            ce["payload"] = json.loads(ce["payload_json"])
            # Prefix contact name to event type for clarity or just add to list
            events.append(ce)
    
    # Sort events by ts again after merging
    events.sort(key=lambda x: x["ts"], reverse=True)
    
    return templates.TemplateResponse(request, "details.html", {
        "branch_name": get_branch_name(),
        "application": app_data,
        "events": events,
        "contacts": contacts,
        "all_contacts": all_contacts
    })

@app.post("/applications/{app_id}/events")
async def create_app_event(app_id: int, event_type: str = Form(...)):
    with database.get_db() as conn:
        database.log_event(conn, "application", app_id, event_type, {"source": "manual_dashboard_lite"})
        conn.commit()
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/dashboard", response_class=HTMLResponse)
async def kpi_dashboard(
    request: Request,
    status: str = None,
    type: str = None,
    source: str = None
):
    filters = {
        "status": status,
        "type": type,
        "source": source
    }
    filters = {k: v for k, v in filters.items() if v is not None and v != ""}
    
    kpis = database.get_kpis(filters)
    sources = database.get_distinct_sources()
    
    return templates.TemplateResponse(request, "dashboard.html", {
        "branch_name": get_branch_name(),
        "kpis": kpis,
        "filters": filters,
        "sources": sources
    })

@app.post("/applications/{app_id}/link-contact", response_class=RedirectResponse)
async def link_contact(app_id: int, contact_id: int = Form(...)):
    database.link_contact_to_application(app_id, contact_id)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/create-contact", response_class=RedirectResponse)
async def create_and_link_contact(
    app_id: int,
    name: str = Form(...),
    email: str = Form(None),
    phone: str = Form(None),
    company: str = Form(None)
):
    contact_id = database.create_contact(name, email, phone, company)
    database.link_contact_to_application(app_id, contact_id)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.get("/followups", response_class=HTMLResponse)
async def list_followups(request: Request):
    apps = database.list_followups()
    return templates.TemplateResponse(request, "followups.html", {
        "branch_name": get_branch_name(),
        "applications": apps
    })

@app.post("/applications/{app_id}/followup", response_class=RedirectResponse)
async def mark_followup(app_id: int):
    database.mark_as_followed_up(app_id)
    return RedirectResponse(url="/#queue", status_code=303)

@app.post("/applications/{app_id}/status", response_class=RedirectResponse)
async def update_status(app_id: int, status: str = Form(...)):
    database.update_application_status(app_id, status)
    return RedirectResponse(url=f"/applications/{app_id}", status_code=303)

@app.post("/applications/{app_id}/notes", response_class=RedirectResponse)
async def add_note(app_id: int, text: str = Form(...)):
    database.add_note(app_id, text)
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
            
            raw_status = (get_val("status") or "APPLIED").upper()
            status = status_map.get(raw_status, "APPLIED")

            app_id = database.create_application(
                company=company,
                title=title,
                app_type=app_type,
                status=status,
                applied_at=applied_at,
                next_followup_at=next_followup_at,
                source=source,
                job_url=job_url
            )
            
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                database.add_note(app_id, "\n".join(notes))
                
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
            
            raw_status = (get_val("status") or "APPLIED").upper()
            status = status_map.get(raw_status, "APPLIED")

            app_id = database.create_application(
                company=company,
                title=title,
                app_type=app_type,
                status=status,
                applied_at=applied_at,
                next_followup_at=next_followup_at,
                source=source,
                job_url=job_url
            )
            
            # Handle extra fields as notes
            notes = []
            if get_val("notes"): notes.append(f"Notes: {get_val('notes')}")
            if get_val("contact_rh"): notes.append(f"Contact RH: {get_val('contact_rh')}")
            if get_val("email_rh"): notes.append(f"Email RH: {get_val('email_rh')}")
            if get_val("phone"): notes.append(f"Téléphone: {get_val('phone')}")
            
            if notes:
                database.add_note(app_id, "\n".join(notes))
                
            results["created"] += 1
            
        except Exception as e:
            results["skipped"] += 1
            results["errors"].append({"row": row_num, "reason": str(e)})

    return templates.TemplateResponse(request, "import.html", {
        "branch_name": get_branch_name(),
        "results": results
    })
