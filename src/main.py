import subprocess
from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

app = FastAPI(title="OfferTrail")
templates = Jinja2Templates(directory="src/templates")

def get_branch_name():
    try:
        return subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode("utf-8").strip()
    except Exception:
        return "dev"

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request, "index.html", {"branch_name": get_branch_name()})

@app.get("/health")
async def health_check():
    return {"status": "ok"}
