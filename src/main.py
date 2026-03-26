import subprocess
from fastapi import FastAPI, Request, Form, HTTPException
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

def split_legacy_contact_name(name: str):
    cleaned = (name or "").strip()
    if not cleaned:
        return "", ""
    parts = cleaned.split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])

def format_contact_for_legacy_views(contact: dict):
    formatted = dict(contact)
    first_name = (formatted.get("first_name") or "").strip()
    last_name = (formatted.get("last_name") or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    formatted["name"] = full_name or formatted.get("name") or "Contact"

    if formatted.get("organization_id"):
        organization = database.get_organization(formatted["organization_id"])
        formatted["company"] = organization["name"] if organization else formatted.get("company")
    else:
        formatted["company"] = formatted.get("company")

    return formatted

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

@app.get("/api/insights/monthly-applications")
async def api_monthly_applications(year: int = None):
    if year is None:
        year = datetime.now().year
    
    stats = database.get_annual_monthly_stats(year)
    return {
        "year": year,
        "months": stats
    }

@app.get("/api/job-searches")
async def api_job_searches():
    return database.list_job_searches()

@app.post("/api/job-searches", status_code=201)
async def api_create_job_search(data: dict):
    if not data.get("name") or not data.get("keywords"):
        raise HTTPException(status_code=400, detail="name and keywords are required")
    return database.create_job_search(
        name=data.get("name"),
        keywords=data.get("keywords"),
        excluded_keywords=data.get("excluded_keywords"),
        locations=data.get("locations"),
        contract_type=data.get("contract_type", "CDI"),
        remote_mode=data.get("remote_mode", "ANY"),
        profile_summary=data.get("profile_summary"),
        min_score=data.get("min_score", 60),
        auto_import=bool(data.get("auto_import", False)),
    )

@app.post("/api/job-searches/{search_id}/run")
async def api_run_job_search(search_id: int):
    result = database.run_job_search(search_id)
    if not result:
        raise HTTPException(status_code=404, detail="Search not found")
    return result

@app.get("/api/job-backlog")
async def api_job_backlog(search_id: int = None, status: str = None):
    return {
        "items": database.list_job_backlog_items(search_id=search_id, status=status),
        "runs": database.list_job_backlog_runs(search_id=search_id),
    }

@app.post("/api/job-backlog/{item_id}/import")
async def api_import_job_backlog(item_id: int):
    result = database.import_job_backlog_item(item_id)
    if not result:
        raise HTTPException(status_code=404, detail="Backlog item not found")
    return result

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

@app.get("/api/organizations")
async def api_list_organizations(type: str = None, search: str = None):
    filters = {"type": type} if type else None
    return database.list_organizations(filters=filters, search=search)

@app.get("/api/organizations/{org_id}")
async def api_get_organization(org_id: int):
    org = database.get_organization(org_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@app.post("/api/organizations", status_code=201)
async def api_create_organization(data: dict):
    org_id = database.create_organization(
        name=data.get("name"),
        org_type=data.get("type", "AUTRE"),
        city=data.get("city"),
        website=data.get("website"),
        linkedin_url=data.get("linkedin_url"),
        notes=data.get("notes"),
    )
    return {"id": org_id}

@app.patch("/api/organizations/{org_id}")
async def api_update_organization(org_id: int, data: dict):
    success = database.update_organization(org_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Update failed")
    return {"success": True}

@app.delete("/api/organizations/{org_id}")
async def api_delete_organization(org_id: int):
    success = database.delete_organization(org_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot delete organization with applications")
    return {"success": True}

@app.post("/api/organizations/{org_id}/merge")
async def api_merge_organization(org_id: int, data: dict):
    success = database.merge_organizations(org_id, data.get("target_organization_id"))
    if not success:
        raise HTTPException(status_code=400, detail="Merge failed")
    return {"success": True}

@app.post("/api/organizations/{org_id}/split")
async def api_split_organization(org_id: int, data: dict):
    new_org_id = database.split_organization(
        org_id,
        new_name=data.get("name"),
        new_type=data.get("type", "AUTRE"),
        city=data.get("city"),
        website=data.get("website"),
        linkedin_url=data.get("linkedin_url"),
        notes=data.get("notes"),
        move_contacts=data.get("move_contacts", True),
    )
    if not new_org_id:
        raise HTTPException(status_code=400, detail="Split failed")
    return {"id": new_org_id}

@app.get("/api/contacts")
async def api_list_contacts(organization_id: int = None):
    filters = {"organization_id": organization_id} if organization_id else None
    return database.list_contacts(filters=filters)

@app.get("/api/contacts/{contact_id}")
async def api_get_contact(contact_id: int):
    contact = database.get_contact(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    organization = database.get_organization(contact["organization_id"]) if contact.get("organization_id") else None
    applications = database.get_applications_for_contact(contact_id)
    events = database.get_events_for_entity("contact", contact_id)

    for event in events:
        event["payload"] = json.loads(event["payload_json"]) if event.get("payload_json") else {}

    for application in applications:
        app_events = database.get_events_for_entity("application", application["id"])
        for event in app_events:
            event["payload"] = json.loads(event["payload_json"]) if event.get("payload_json") else {}
            event["application"] = {
                "id": application["id"],
                "title": application["title"],
                "status": application["status"],
            }
            events.append(event)

    events.sort(key=lambda item: item["ts"], reverse=True)

    return {
        **contact,
        "organization": organization,
        "applications": applications,
        "events": events,
    }

@app.post("/api/contacts", status_code=201)
async def api_create_contact_standalone(data: dict):
    contact_id = database.create_contact(
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        organization_id=data.get("organization_id"),
        role=data.get("role"),
        is_recruiter=data.get("is_recruiter", 0),
        linkedin_url=data.get("linkedin_url"),
        notes=data.get("notes")
    )
    return {"id": contact_id}

@app.patch("/api/contacts/{contact_id}")
async def api_update_contact(contact_id: int, data: dict):
    success = database.update_contact(contact_id, data)
    return {"success": success}

@app.delete("/api/contacts/{contact_id}")
async def api_delete_contact(contact_id: int):
    database.delete_contact(contact_id)
    return {"success": True}

@app.get("/api/companies")
async def api_list_companies(type: str = None, search: str = None):
    # Compatibility route
    return api_list_organizations(type, search)

@app.get("/api/companies/{company_id}")
async def api_get_company(company_id: int):
    organization = database.get_organization(company_id)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")

    applications = database.list_applications(
        filters={"organization_id": company_id},
        show_hidden=True
    )
    contacts = database.list_contacts(filters={"organization_id": company_id})

    events = database.get_events_for_entity("organization", company_id)
    for event in events:
        event["payload"] = json.loads(event["payload_json"]) if event.get("payload_json") else {}

    for application in applications:
        app_events = database.get_events_for_entity("application", application["id"])
        for event in app_events:
            event["payload"] = json.loads(event["payload_json"]) if event.get("payload_json") else {}
            event["application"] = {
                "id": application["id"],
                "title": application["title"],
                "status": application["status"],
            }
            events.append(event)

    for contact in contacts:
        contact_events = database.get_events_for_entity("contact", contact["id"])
        for event in contact_events:
            event["payload"] = json.loads(event["payload_json"]) if event.get("payload_json") else {}
            event["contact"] = {
                "id": contact["id"],
                "name": f"{contact['first_name']} {contact['last_name']}".strip(),
            }
            events.append(event)

    events.sort(key=lambda item: item["ts"], reverse=True)

    detail = {
        **organization,
        "applications": applications,
        "contacts": contacts,
        "events": events,
    }
    return detail

@app.get("/api/applications/{app_id}")
async def api_application_details(app_id: int):
    app_data = database.get_application(app_id)
    if not app_data:
        raise HTTPException(status_code=404, detail="Application not found")
    
    organization_info = None
    if app_data.get("organization_id"):
        organization_info = database.get_organization(app_data["organization_id"])
    elif app_data.get("company_id"): # Compatibility
        organization_info = database.get_organization(app_data["company_id"])
    final_customer_organization = None
    if app_data.get("final_customer_organization_id"):
        final_customer_organization = database.get_organization(app_data["final_customer_organization_id"])
        
    events = database.get_events_for_entity("application", app_id)
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    contacts = database.get_contacts_for_application(app_id)
    
    for contact in contacts:
        contact_events = database.get_events_for_entity("contact", contact["id"])
        for ce in contact_events:
            ce["payload"] = json.loads(ce["payload_json"])
            # Enrichment: add contact name to event payload if not present
            if "first_name" not in ce["payload"]:
                ce["payload"]["contact_name"] = f"{contact['first_name']} {contact['last_name']}"
            events.append(ce)
    
    events.sort(key=lambda x: x["ts"], reverse=True)
    
    return {
        "application": app_data,
        "organization": organization_info,
        "final_customer_organization": final_customer_organization,
        "events": events,
        "contacts": contacts,
        "all_contacts": database.list_contacts()
    }

@app.post("/api/applications", status_code=201)
async def api_create_application(data: dict):
    app_id = database.create_application(
        company_name=data.get("company"),
        title=data.get("title"),
        app_type=data.get("type"),
        status=data.get("status"),
        applied_at=data.get("applied_at"),
        next_followup_at=data.get("next_followup_at"),
        source=data.get("source"),
        job_url=data.get("job_url"),
        org_type=data.get("org_type", "AUTRE"),
        organization_id=data.get("organization_id"),
        final_customer_organization_id=data.get("final_customer_organization_id"),
    )
    return {"id": app_id}

@app.patch("/api/applications/{app_id}")
async def api_update_application(app_id: int, data: dict):
    if set(data.keys()) == {"status"}:
        success = database.update_application_status(app_id, data["status"])
    else:
        success = database.update_application(app_id, data)
    if not success:
        raise HTTPException(status_code=400, detail="Update failed")
    return {"success": True}

@app.post("/api/applications/{app_id}/notes")
async def api_add_note(app_id: int, data: dict):
    database.add_note(app_id, data.get("text", ""))
    return {"success": True}

@app.post("/api/applications/{app_id}/followup")
async def api_mark_followup(app_id: int):
    database.mark_as_followed_up(app_id)
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
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        organization_id=data.get("organization_id"),
        role=data.get("role"),
        is_recruiter=data.get("is_recruiter", 0)
    )
    database.link_contact_to_application(app_id, contact_id)
    return {"id": contact_id}

@app.get("/applications/{app_id}", response_class=HTMLResponse)
async def application_details(request: Request, app_id: int):
    app_data = database.get_application(app_id)
    if not app_data:
        return RedirectResponse(url="/", status_code=404)
    
    company_info = None
    if app_data.get("organization_id"):
        company_info = database.get_organization(app_data["organization_id"])
        
    events = database.get_events_for_entity("application", app_id)
    # Parse payload_json for each event
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    contacts = [format_contact_for_legacy_views(contact) for contact in database.get_contacts_for_application(app_id)]
    all_contacts = [format_contact_for_legacy_views(contact) for contact in database.list_contacts()]
    
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
        "company": company_info,
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
    first_name, last_name = split_legacy_contact_name(name)
    organization_id = None

    if company and company.strip():
        with database.get_db() as conn:
            organization_id = database.get_or_create_organization(conn, company.strip())
            conn.commit()

    contact_id = database.create_contact(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        organization_id=organization_id
    )
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
                company_name=company,
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
                company_name=company,
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
