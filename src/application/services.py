from typing import List, Optional, Dict, Any
from ..domain.models import (
    Company, Offer, Application, Contact, 
    CompanyType, OfferType, ApplicationStatus, ContactRole,
    OfferSource, ApplicationChannel
)
from ..infrastructure.repositories import SQLiteRepository
from datetime import datetime, timezone, timedelta

class ApplicationService:
    def __init__(self, repository: SQLiteRepository):
        self.repository = repository

    def apply_to_offer(self, 
                       company_name: str, 
                       offer_title: Optional[str] = None, 
                       offer_type: OfferType = OfferType.CDI, 
                       source: OfferSource = OfferSource.OTHER, 
                       url: Optional[str] = None,
                       channel: ApplicationChannel = ApplicationChannel.OTHER,
                       applied_at: Optional[str] = None,
                       company_id: Optional[int] = None) -> int:
        
        # 1. Get or create company
        company = None
        if company_id:
            company = self.repository.get_company(company_id)
        
        if not company:
            company = self.repository.find_company_by_name(company_name)
            
        if not company:
            slug = company_name.lower().replace(" ", "-").replace(".", "") # Simple slug
            company = Company(id=None, name=company_name, slug=slug, type=CompanyType.OTHER)
            company_id = self.repository.save_company(company)
            company.id = company_id
        
        offer_id = None
        # 2. Create offer if title provided
        if offer_title:
            offer = Offer(
                id=None,
                company_id=company.id,
                title=offer_title,
                contract_type=offer_type,
                source=source,
                url=url
            )
            offer_id = self.repository.save_offer(offer)
        
        # 3. Create application
        if not applied_at:
            applied_at = datetime.now(timezone.utc).isoformat()
            
        app = Application(
            id=None,
            company_id=company.id,
            offer_id=offer_id,
            applied_at=applied_at,
            status=ApplicationStatus.APPLIED,
            channel=channel
        )
        return self.repository.save_application(app)

    def update_application_status(self, app_id: int, new_status: Optional[ApplicationStatus], notes: Optional[str] = None):
        app = self.repository.get_application(app_id)
        if app:
            if new_status:
                app.status = new_status
            if notes:
                app.notes = (app.notes + "\n" + notes) if app.notes else notes
            app.last_contact_at = datetime.now(timezone.utc).isoformat()
            app.updated_at = datetime.now(timezone.utc).isoformat()
            self.repository.save_application(app)

    def detect_no_responses(self, days_threshold: int = 14):
        # This is now computed dynamically in the domain model.
        # We could still use this to "archive" or "flag" them, but the requirement 
        # is that NO_RESPONSE is NOT a manual status.
        pass

    def record_response_received(self, app_id: int):
        app = self.repository.get_application(app_id)
        if app:
            app.last_contact_at = datetime.now(timezone.utc).isoformat()
            app.updated_at = datetime.now(timezone.utc).isoformat()
            
            with self.repository.db_manager.get_connection() as conn:
                self.repository.save_application(app)
                self.repository.log_event(conn, "application", app_id, "RESPONSE_RECEIVED", {"ts": app.last_contact_at})

class CompanyService:
    def __init__(self, repository: SQLiteRepository):
        self.repository = repository

    def get_company_details(self, company_id: int) -> Optional[Company]:
        company = self.repository.get_company(company_id)
        return company
