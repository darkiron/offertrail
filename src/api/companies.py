from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from ..application.services import CompanyService
from ..domain.models import Company

from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="src/templates")

def get_company_router(company_service: CompanyService):
    router = APIRouter(prefix="/companies", tags=["companies"])

    @router.get("", response_class=HTMLResponse)
    async def list_companies_html(request: Request, q: Optional[str] = None):
        if q:
            companies = company_service.repository.search_companies(q)
        else:
            companies = company_service.repository.list_companies()
        return templates.TemplateResponse(request, "companies/index.html", {"companies": companies, "q": q})

    @router.get("/api")
    async def list_companies_api():
        companies = company_service.repository.list_companies()
        return [c.to_dict() for c in companies]

    @router.get("/search")
    async def search_companies_api(q: Optional[str] = None):
        if not q:
            return []
        companies = company_service.repository.search_companies(q)
        return [{"id": c.id, "name": c.name} for c in companies]

    @router.get("/{company_id}", response_class=HTMLResponse)
    async def get_company_html(request: Request, company_id: int):
        details = company_service.get_company_details(company_id)
        if not details:
            raise HTTPException(status_code=404, detail="Company not found")
        return templates.TemplateResponse(request, "companies/details.html", {"company_details": details})

    @router.get("/api/{company_id}")
    async def get_company_api(company_id: int):
        details = company_service.get_company_details(company_id)
        if not details:
            raise HTTPException(status_code=404, detail="Company not found")
        # Ensure applications are enriched for the company details view
        return details.to_dict()

    @router.put("/api/{company_id}")
    async def update_company_api(company_id: int, request: Request):
        data = await request.json()
        company = company_service.repository.get_company(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company.name = data.get("name", company.name)
        company.type = CompanyType(data.get("type", company.type.value))
        company.website = data.get("website", company.website)
        company.location = data.get("location", company.location)
        company.description = data.get("description", company.description)
        company.notes = data.get("notes", company.notes)
        
        company_service.repository.save_company(company)
        return {"status": "success", "id": company_id}

    return router
