import subprocess
from fastapi import FastAPI, Request, Form
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from . import database
import json
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield

app = FastAPI(title="OfferTrail", lifespan=lifespan)
templates = Jinja2Templates(directory="src/templates")

def get_branch_name():
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode("utf-8").strip()
    except Exception:
        return "dev"

@app.get("/", response_class=HTMLResponse)
async def list_applications(request: Request):
    apps = database.list_applications()
    return templates.TemplateResponse(request, "index.html", {
        "branch_name": get_branch_name(),
        "applications": apps
    })

@app.post("/applications", response_class=RedirectResponse)
async def create_application(
    company: str = Form(...),
    title: str = Form(...),
    type: str = Form(...),
    status: str = Form(...),
    applied_at: str = Form(None),
    next_followup_at: str = Form(None)
):
    database.create_application(company, title, type, status, applied_at, next_followup_at)
    return RedirectResponse(url="/", status_code=303)

@app.get("/applications/{app_id}", response_class=HTMLResponse)
async def application_details(request: Request, app_id: int):
    app_data = database.get_application(app_id)
    events = database.get_events_for_entity("application", app_id)
    # Parse payload_json for each event
    for event in events:
        event["payload"] = json.loads(event["payload_json"])
    
    return templates.TemplateResponse(request, "details.html", {
        "branch_name": get_branch_name(),
        "application": app_data,
        "events": events
    })

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
    return RedirectResponse(url="/followups", status_code=303)

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
