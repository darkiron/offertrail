import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..domain.models import (
    Company, Offer, Application, Contact, 
    CompanyType, OfferType, ApplicationStatus, ContactRole,
    OfferSource, ApplicationChannel
)
from .database_manager import DatabaseManager

class SQLiteRepository:
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager

    def log_event(self, conn, entity_type: str, entity_id: int, event_type: str, payload: Dict[str, Any]):
        ts = datetime.now(timezone.utc).isoformat()
        # Filter out invalid ApplicationStatus values in payload if updating status
        if event_type == "UPDATED" and "status" in payload:
            try:
                ApplicationStatus(payload["status"])
            except ValueError:
                if payload["status"] == "NO_RESPONSE":
                    payload["status"] = "APPLIED"
        
        payload_json = json.dumps(payload)
        conn.execute(
            "INSERT INTO events (ts, entity_type, entity_id, type, payload_json) VALUES (?, ?, ?, ?, ?)",
            (ts, entity_type, entity_id, event_type, payload_json)
        )

    # --- Company ---
    def save_company(self, company: Company) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self.db_manager.get_connection() as conn:
            if company.id:
                conn.execute(
                    "UPDATE companies SET name=?, slug=?, type=?, website=?, location=?, description=?, notes=?, updated_at=? WHERE id=?",
                    (company.name, company.slug, company.type.value, company.website, company.location, company.description, company.notes, now, company.id)
                )
                self.log_event(conn, "company", company.id, "UPDATED", {"name": company.name})
                return company.id
            else:
                cursor = conn.execute(
                    "INSERT INTO companies (name, slug, type, website, location, description, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (company.name, company.slug, company.type.value, company.website, company.location, company.description, company.notes, now, now)
                )
                company.id = cursor.lastrowid
                self.log_event(conn, "company", company.id, "CREATED", {"name": company.name})
                return company.id

    def get_company(self, company_id: int) -> Optional[Company]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute("SELECT * FROM companies WHERE id = ?", (company_id,)).fetchone()
            if not row:
                return None
            
            # Safe company type mapping
            try:
                company_type = CompanyType(row["type"])
            except ValueError:
                company_type = CompanyType.OTHER

            company = Company(
                id=row["id"],
                name=row["name"],
                slug=row["slug"],
                type=company_type,
                website=row["website"],
                location=row["location"],
                description=row["description"],
                notes=row["notes"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            # Load offers, contacts, and direct applications
            company.offers = self._get_offers_by_company(conn, company_id)
            company.contacts = self._get_contacts_by_company(conn, company_id)
            company.applications = self._get_applications_by_company(conn, company_id)
            return company

    def find_company_by_name(self, name: str) -> Optional[Company]:
        with self.db_manager.get_connection() as conn:
            # Case-insensitive match for duplicate prevention
            row = conn.execute("SELECT id FROM companies WHERE LOWER(name) = LOWER(?)", (name,)).fetchone()
            if row:
                return self.get_company(row["id"])
        return None

    def search_companies(self, query: str) -> List[Company]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute("SELECT id FROM companies WHERE name LIKE ? OR slug LIKE ? ORDER BY name ASC", (f"%{query}%", f"%{query}%")).fetchall()
            return [self.get_company(row["id"]) for row in rows if row]

    def list_companies(self) -> List[Company]:
        companies = []
        with self.db_manager.get_connection() as conn:
            rows = conn.execute("SELECT id FROM companies ORDER BY name ASC").fetchall()
            for row in rows:
                companies.append(self.get_company(row["id"]))
        return [c for c in companies if c]

    # --- Offer ---
    def save_offer(self, offer: Offer) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self.db_manager.get_connection() as conn:
            if offer.id:
                conn.execute(
                    "UPDATE offers SET title=?, url=?, contract_type=?, source=?, location=?, salary_info=?, description=?, updated_at=? WHERE id=?",
                    (offer.title, offer.url, offer.contract_type.value, offer.source.value, offer.location, offer.salary_info, offer.description, now, offer.id)
                )
                self.log_event(conn, "offer", offer.id, "UPDATED", {"title": offer.title})
                return offer.id
            else:
                cursor = conn.execute(
                    "INSERT INTO offers (company_id, title, url, contract_type, source, location, salary_info, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (offer.company_id, offer.title, offer.url, offer.contract_type.value, offer.source.value, offer.location, offer.salary_info, offer.description, now, now)
                )
                offer.id = cursor.lastrowid
                self.log_event(conn, "offer", offer.id, "CREATED", {"title": offer.title})
                return offer.id

    def _get_offers_by_company(self, conn, company_id: int) -> List[Offer]:
        rows = conn.execute("SELECT * FROM offers WHERE company_id = ?", (company_id,)).fetchall()
        offers = []
        for row in rows:
            # Safe type and source mapping
            try:
                offer_type = OfferType(row["contract_type"])
            except ValueError:
                offer_type = OfferType.CDI
            
            try:
                source = OfferSource(row["source"])
            except ValueError:
                source = OfferSource.OTHER

            offer = Offer(
                id=row["id"],
                company_id=row["company_id"],
                title=row["title"],
                url=row["url"],
                contract_type=offer_type,
                source=source,
                location=row["location"],
                salary_info=row["salary_info"],
                description=row["description"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            offer.applications = self._get_applications_by_offer(conn, row["id"])
            offers.append(offer)
        return offers

    # --- Application ---
    def save_application(self, app: Application) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self.db_manager.get_connection() as conn:
            if app.id:
                conn.execute(
                    "UPDATE applications SET company_id=?, offer_id=?, primary_contact_id=?, applied_at=?, status=?, last_contact_at=?, next_action_at=?, channel=?, notes=?, updated_at=? WHERE id=?",
                    (app.company_id, app.offer_id, app.primary_contact_id, app.applied_at, app.status.value, app.last_contact_at, app.next_action_at, app.channel.value, app.notes, now, app.id)
                )
                self.log_event(conn, "application", app.id, "UPDATED", {"status": app.status.value})
                return app.id
            else:
                cursor = conn.execute(
                    "INSERT INTO applications (company_id, offer_id, primary_contact_id, applied_at, status, last_contact_at, next_action_at, channel, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (app.company_id, app.offer_id, app.primary_contact_id, app.applied_at, app.status.value, app.last_contact_at, app.next_action_at, app.channel.value, app.notes, now, now)
                )
                app.id = cursor.lastrowid
                self.log_event(conn, "application", app.id, "CREATED", {"status": app.status.value})
                return app.id

    def get_application(self, app_id: int) -> Optional[Application]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute("SELECT * FROM applications WHERE id = ?", (app_id,)).fetchone()
            if not row:
                return None
            app = self._row_to_application(row)
            app.events = self.get_events_for_entity("application", app_id)
            return app

    def _get_applications_by_offer(self, conn, offer_id: int) -> List[Application]:
        rows = conn.execute("SELECT * FROM applications WHERE offer_id = ?", (offer_id,)).fetchall()
        apps = []
        for row in rows:
            app = self._row_to_application(row)
            app.events = self._get_events_for_entity_with_conn(conn, "application", row["id"])
            apps.append(app)
        return apps

    def _get_applications_by_company(self, conn, company_id: int) -> List[Application]:
        rows = conn.execute("SELECT * FROM applications WHERE company_id = ?", (company_id,)).fetchall()
        apps = []
        for row in rows:
            app = self._row_to_application(row)
            app.events = self._get_events_for_entity_with_conn(conn, "application", row["id"])
            apps.append(app)
        return apps

    def _row_to_application(self, row) -> Application:
        status_val = row["status"]
        # Map legacy NO_RESPONSE to APPLIED; ensure valid Enum member
        try:
            status = ApplicationStatus(status_val)
        except ValueError:
            if status_val == "NO_RESPONSE":
                status = ApplicationStatus.APPLIED
            else:
                status = ApplicationStatus.APPLIED # Default fallback
        
        # Safe channel mapping
        try:
            channel = ApplicationChannel(row["channel"])
        except ValueError:
            channel = ApplicationChannel.OTHER

        return Application(
            id=row["id"],
            company_id=row["company_id"],
            offer_id=row["offer_id"],
            primary_contact_id=row["primary_contact_id"],
            applied_at=row["applied_at"],
            status=status,
            last_contact_at=row["last_contact_at"],
            next_action_at=row["next_action_at"],
            channel=channel,
            notes=row["notes"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    # --- Contact ---
    def save_contact(self, contact: Contact) -> int:
        now = datetime.now(timezone.utc).isoformat()
        with self.db_manager.get_connection() as conn:
            if contact.id:
                conn.execute(
                    "UPDATE contacts SET first_name=?, last_name=?, email=?, phone=?, role=?, notes=?, updated_at=? WHERE id=?",
                    (contact.first_name, contact.last_name, contact.email, contact.phone, contact.role.value, contact.notes, now, contact.id)
                )
                self.log_event(conn, "contact", contact.id, "UPDATED", {"name": f"{contact.first_name} {contact.last_name}"})
                return contact.id
            else:
                cursor = conn.execute(
                    "INSERT INTO contacts (company_id, first_name, last_name, email, phone, role, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    (contact.company_id, contact.first_name, contact.last_name, contact.email, contact.phone, contact.role.value, contact.notes, now, now)
                )
                contact.id = cursor.lastrowid
                self.log_event(conn, "contact", contact.id, "CREATED", {"name": f"{contact.first_name} {contact.last_name}"})
                return contact.id

    def get_contact(self, contact_id: int) -> Optional[Contact]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute("SELECT * FROM contacts WHERE id = ?", (contact_id,)).fetchone()
            if not row:
                return None
            
            try:
                role = ContactRole(row["role"])
            except ValueError:
                role = ContactRole.OTHER

            return Contact(
                id=row["id"],
                company_id=row["company_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                email=row["email"],
                phone=row["phone"],
                role=role,
                notes=row["notes"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )

    def get_offer(self, offer_id: int) -> Optional[Offer]:
        with self.db_manager.get_connection() as conn:
            row = conn.execute("SELECT * FROM offers WHERE id = ?", (offer_id,)).fetchone()
            if not row:
                return None
            
            try:
                offer_type = OfferType(row["contract_type"])
            except ValueError:
                offer_type = OfferType.CDI
            
            try:
                source = OfferSource(row["source"])
            except ValueError:
                source = OfferSource.OTHER

            return Offer(
                id=row["id"],
                company_id=row["company_id"],
                title=row["title"],
                url=row["url"],
                contract_type=offer_type,
                source=source,
                location=row["location"],
                salary_info=row["salary_info"],
                description=row["description"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )

    def _get_contacts_by_company(self, conn, company_id: int) -> List[Contact]:
        rows = conn.execute("SELECT * FROM contacts WHERE company_id = ?", (company_id,)).fetchall()
        contacts = []
        for row in rows:
            try:
                role = ContactRole(row["role"])
            except ValueError:
                role = ContactRole.OTHER
            
            contacts.append(Contact(
                id=row["id"],
                company_id=row["company_id"],
                first_name=row["first_name"],
                last_name=row["last_name"],
                email=row["email"],
                phone=row["phone"],
                role=role,
                notes=row["notes"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            ))
        return contacts

    def list_contacts(self) -> List[Contact]:
        with self.db_manager.get_connection() as conn:
            rows = conn.execute("SELECT * FROM contacts ORDER BY last_name, first_name").fetchall()
            contacts = []
            for row in rows:
                try:
                    role = ContactRole(row["role"])
                except ValueError:
                    role = ContactRole.OTHER
                
                contacts.append(Contact(
                    id=row["id"],
                    company_id=row["company_id"],
                    first_name=row["first_name"],
                    last_name=row["last_name"],
                    email=row["email"],
                    phone=row["phone"],
                    role=role,
                    notes=row["notes"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"]
                ))
            return contacts

    def get_kpis(self) -> Dict[str, Any]:
        with self.db_manager.get_connection() as conn:
            total = conn.execute("SELECT COUNT(*) FROM applications").fetchone()[0]
            if total == 0:
                return {
                    "total_count": 0, "active_count": 0, "due_followups": 0,
                    "rejected_count": 0, "rejected_rate": 0,
                    "responded_count": 0, "response_rate": 0, "avg_response_time": None
                }

            active = conn.execute("SELECT COUNT(*) FROM applications WHERE status IN ('APPLIED', 'INTERVIEW', 'FOLLOW_UP')").fetchone()[0]
            rejected = conn.execute("SELECT COUNT(*) FROM applications WHERE status = 'REJECTED'").fetchone()[0]
            
            # response_rate per Requirement 7: (interview + accepted) / total
            # We count apps that have INTERVIEW or ACCEPTED status
            responded_positively = conn.execute("SELECT COUNT(*) FROM applications WHERE status IN ('INTERVIEW', 'ACCEPTED')").fetchone()[0]
            
            # ghosting_count per Requirement 6: (applied or follow_up) and older than 14 days
            threshold_date = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
            ghosting = conn.execute("SELECT COUNT(*) FROM applications WHERE status IN ('APPLIED', 'FOLLOW_UP') AND (last_contact_at < ? OR (last_contact_at IS NULL AND applied_at < ?))", (threshold_date, threshold_date)).fetchone()[0]

            # Follow-ups due
            now = datetime.now(timezone.utc).isoformat()
            due_followups = conn.execute("SELECT COUNT(*) FROM applications WHERE next_action_at IS NOT NULL AND next_action_at < ? AND status NOT IN ('REJECTED', 'ACCEPTED', 'ARCHIVED')", (now,)).fetchone()[0]
            
            return {
                "total_count": total,
                "active_count": active,
                "due_followups": due_followups,
                "rejected_count": rejected,
                "ghosting_count": ghosting,
                "rejected_rate": round(rejected / total * 100, 2),
                "responded_count": responded_positively,
                "response_rate": round(responded_positively / total * 100, 2),
                "avg_response_time": None
            }

    def list_applications(self, status: Optional[str] = None, search: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        query = """
            SELECT a.*, o.title, o.contract_type as offer_type, o.source as offer_source, c.name as company_name, c.id as company_id
            FROM applications a
            LEFT JOIN offers o ON a.offer_id = o.id
            JOIN companies c ON a.company_id = c.id
            WHERE 1=1
        """
        params = []
        if status:
            if status == "GHOSTING":
                # status is applied or follow_up AND last_contact_at or applied_at is older than 14 days
                threshold_date = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
                query += " AND a.status IN ('APPLIED', 'FOLLOW_UP') AND (a.last_contact_at < ? OR (a.last_contact_at IS NULL AND a.applied_at < ?))"
                params.extend([threshold_date, threshold_date])
            else:
                query += " AND a.status = ?"
                params.append(status)
        
        if search:
            query += " AND (c.name LIKE ? OR o.title LIKE ? OR a.notes LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
        
        query += " ORDER BY a.updated_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        with self.db_manager.get_connection() as conn:
            rows = conn.execute(query, params).fetchall()
            results = []
            for row in rows:
                app_dict = dict(row)
                
                # Sanitize status and channel for the dictionary
                s_val = app_dict.get("status")
                try:
                    ApplicationStatus(s_val)
                except ValueError:
                    app_dict["status"] = "APPLIED" if s_val == "NO_RESPONSE" else "APPLIED"

                c_val = app_dict.get("channel")
                try:
                    ApplicationChannel(c_val)
                except ValueError:
                    app_dict["channel"] = "OTHER"

                # Sanitize offer type and source if they exist
                if app_dict.get("offer_type"):
                    try:
                        OfferType(app_dict["offer_type"])
                    except ValueError:
                        app_dict["offer_type"] = "CDI"
                
                if app_dict.get("offer_source"):
                    try:
                        OfferSource(app_dict["offer_source"])
                    except ValueError:
                        app_dict["offer_source"] = "OTHER"

                app_dict["company"] = {
                    "id": row["company_id"],
                    "name": row["company_name"]
                }
                # Keep company_name for old frontend but prefer company.name
                app_dict["company_name"] = row["company_name"]
                results.append(app_dict)
            return results

    def count_applications(self, status: Optional[str] = None, search: Optional[str] = None) -> int:
        query = "SELECT COUNT(*) FROM applications a JOIN companies c ON a.company_id = c.id LEFT JOIN offers o ON a.offer_id = o.id WHERE 1=1"
        params = []
        if status:
            if status == "GHOSTING":
                threshold_date = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
                query += " AND a.status IN ('APPLIED', 'FOLLOW_UP') AND (a.last_contact_at < ? OR (a.last_contact_at IS NULL AND a.applied_at < ?))"
                params.extend([threshold_date, threshold_date])
            else:
                query += " AND a.status = ?"
                params.append(status)
        if search:
            query += " AND (c.name LIKE ? OR o.title LIKE ? OR a.notes LIKE ?)"
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])
            
        with self.db_manager.get_connection() as conn:
            return conn.execute(query, params).fetchone()[0]

    def update_application_notes(self, application_id: int, notes: str):
        with self.db_manager.get_connection() as conn:
            conn.execute("UPDATE applications SET notes = ? WHERE id = ?", (notes, application_id))

    def get_events_for_entity(self, entity_type: str, entity_id: int) -> List[Dict[str, Any]]:
        with self.db_manager.get_connection() as conn:
            return self._get_events_for_entity_with_conn(conn, entity_type, entity_id)

    def _get_events_for_entity_with_conn(self, conn, entity_type: str, entity_id: int) -> List[Dict[str, Any]]:
        rows = conn.execute(
            "SELECT * FROM events WHERE entity_type = ? AND entity_id = ? ORDER BY ts DESC",
            (entity_type, entity_id)
        ).fetchall()
        events = []
        for row in rows:
            ev = dict(row)
            if ev.get("payload_json"):
                try:
                    ev["payload"] = json.loads(ev["payload_json"])
                    # Standardize legacy NO_RESPONSE in payloads too
                    if ev.get("type") == "UPDATED" and ev["payload"].get("status") == "NO_RESPONSE":
                        ev["payload"]["status"] = "APPLIED"
                    if ev.get("type") == "CREATED" and ev["payload"].get("status") == "NO_RESPONSE":
                        ev["payload"]["status"] = "APPLIED"
                except:
                    ev["payload"] = {}
            events.append(ev)
        return events

    def get_annual_monthly_stats(self, year: int) -> List[int]:
        stats = [0] * 12
        with self.db_manager.get_connection() as conn:
            rows = conn.execute("""
                SELECT strftime('%m', applied_at) as month, COUNT(*) as count
                FROM applications
                WHERE strftime('%Y', applied_at) = ?
                GROUP BY month
            """, (str(year),)).fetchall()
            for row in rows:
                month_idx = int(row["month"]) - 1
                stats[month_idx] = row["count"]
        return stats
