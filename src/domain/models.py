from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional, Dict
from enum import Enum

class CompanyType(str, Enum):
    ESN = "ESN"
    CABINET = "CABINET"
    STARTUP = "STARTUP"
    SCALE_UP = "SCALE_UP"
    ENTERPRISE = "ENTERPRISE"
    PUBLIC = "PUBLIC"
    ASSOCIATION = "ASSOCIATION"
    OTHER = "OTHER"

class OfferType(str, Enum):
    CDI = "CDI"
    FREELANCE = "FREELANCE"
    INTERNSHIP = "INTERNSHIP"
    FIXED_TERM = "FIXED_TERM"
    OTHER = "OTHER"

class ApplicationStatus(str, Enum):
    DRAFT = "DRAFT"
    APPLIED = "APPLIED"
    FOLLOW_UP = "FOLLOW_UP"
    INTERVIEW = "INTERVIEW"
    REJECTED = "REJECTED"
    ACCEPTED = "ACCEPTED"
    ARCHIVED = "ARCHIVED"

class ContactRole(str, Enum):
    RH = "RH"
    RECRUITER = "RECRUITER"
    MANAGER = "MANAGER"
    FOUNDER = "FOUNDER"
    TECHNICAL = "TECHNICAL"
    OTHER = "OTHER"

class ApplicationChannel(str, Enum):
    JOB_BOARD = "JOB_BOARD"
    EMAIL = "EMAIL"
    REFERRAL = "REFERRAL"
    DIRECT_WEBSITE = "DIRECT_WEBSITE"
    OTHER = "OTHER"

class OfferSource(str, Enum):
    LINKEDIN = "LINKEDIN"
    INDEED = "INDEED"
    WELCOME_TO_THE_JUNGLE = "WELCOME_TO_THE_JUNGLE"
    DIRECT = "DIRECT"
    OTHER = "OTHER"

@dataclass
class Contact:
    id: Optional[int]
    company_id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: ContactRole = ContactRole.OTHER
    notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role.value,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

@dataclass
class Application:
    id: Optional[int]
    company_id: int
    offer_id: Optional[int] = None # Nullable for unsolicited applications
    primary_contact_id: Optional[int] = None
    applied_at: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    last_contact_at: Optional[str] = None
    next_action_at: Optional[str] = None
    channel: ApplicationChannel = ApplicationChannel.OTHER
    notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    events: List[Dict] = field(default_factory=list)

    def to_dict(self, include_company: bool = False, company_name: Optional[str] = None) -> Dict:
        data = {
            "id": self.id,
            "company_id": self.company_id,
            "offer_id": self.offer_id,
            "primary_contact_id": self.primary_contact_id,
            "applied_at": self.applied_at,
            "status": self.status.value,
            "last_contact_at": self.last_contact_at,
            "next_action_at": self.next_action_at,
            "channel": self.channel.value,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "events": self.events
        }
        if include_company and company_name:
            data["company"] = {
                "id": self.company_id,
                "name": company_name
            }
        return data

@dataclass
class Offer:
    id: Optional[int]
    company_id: int
    title: str
    url: Optional[str] = None
    contract_type: OfferType = OfferType.CDI
    source: OfferSource = OfferSource.OTHER
    location: Optional[str] = None
    salary_info: Optional[str] = None
    description: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    applications: List[Application] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "title": self.title,
            "url": self.url,
            "contract_type": self.contract_type.value,
            "source": self.source.value,
            "location": self.location,
            "salary_info": self.salary_info,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }

@dataclass
class Company:
    id: Optional[int]
    name: str
    slug: str
    type: CompanyType = CompanyType.OTHER
    website: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    offers: List[Offer] = field(default_factory=list)
    contacts: List[Contact] = field(default_factory=list)
    applications: List[Application] = field(default_factory=list) # Direct link for easier stats

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "type": self.type.value,
            "website": self.website,
            "location": self.location,
            "description": self.description,
            "notes": self.notes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "metrics": self.metrics,
            "flags": self.flags,
            "global_flag_level": self.global_flag_level
        }

    @property
    def metrics(self) -> Dict:
        # Mix of offer-linked apps and direct company apps
        all_apps_dict = {app.id: app for offer in self.offers for app in offer.applications if app.id}
        for app in self.applications:
            if app.id:
                all_apps_dict[app.id] = app
        
        apps_list = list(all_apps_dict.values())
        total_apps = len(apps_list)
        total_offers = len(self.offers)
        
        if total_apps == 0:
            return {
                "total_apps": 0,
                "total_offers": total_offers,
                "rejections": 0,
                "no_responses": 0,
                "interviews": 0,
                "rejection_rate": 0,
                "ghosting_rate": 0,
                "response_rate": 0,
                "interview_rate": 0,
                "last_interaction": None
            }
        
        rejections = 0
        no_responses = 0
        interviews = 0
        responses_count = 0
        last_interaction = None

        for app in apps_list:
            # Ghosting calculation logic (dynamic)
            is_ghosting = False
            if app.status in [ApplicationStatus.APPLIED, ApplicationStatus.FOLLOW_UP]:
                # Check if there is any RESPONSE_RECEIVED event
                has_response_event = any(e.get("type") == "RESPONSE_RECEIVED" for e in app.events)
                
                if not has_response_event:
                    last_contact = app.last_contact_at or app.applied_at
                    if last_contact:
                        try:
                            last_date = datetime.fromisoformat(last_contact.replace('Z', '+00:00'))
                            if (datetime.now(timezone.utc) - last_date).days >= 14:
                                is_ghosting = True
                        except Exception:
                            pass

            if app.status == ApplicationStatus.REJECTED:
                rejections += 1
                # REJECTED is a status, but per requirement 3: "Rejection must NOT count as response"
                # Response is defined ONLY by event: RESPONSE_RECEIVED
            
            if is_ghosting:
                no_responses += 1
            
            if any(e.get("type") == "INTERVIEW" for e in app.events) or app.status == ApplicationStatus.INTERVIEW:
                interviews += 1

            # NEW LOGIC: response_rate = (number of RESPONSE_RECEIVED events) / (total applications)
            if any(e.get("type") == "RESPONSE_RECEIVED" for e in app.events):
                responses_count += 1
            
            # Simple last interaction logic
            current_interaction = app.last_contact_at or app.applied_at
            if current_interaction:
                if not last_interaction or current_interaction > last_interaction:
                    last_interaction = current_interaction
        
        # response_rate per Requirement 7: (interview + accepted) / total
        interviews_or_accepted = 0
        for app in apps_list:
            is_interview = any(e.get("type") == "INTERVIEW" for e in app.events) or app.status == ApplicationStatus.INTERVIEW
            is_accepted = app.status == ApplicationStatus.ACCEPTED
            if is_interview or is_accepted:
                interviews_or_accepted += 1

        return {
            "total_apps": total_apps,
            "total_offers": total_offers,
            "rejections": rejections,
            "no_responses": no_responses,
            "interviews": interviews,
            "rejection_rate": round(rejections / total_apps * 100, 2),
            "ghosting_rate": round(no_responses / total_apps * 100, 2),
            "response_rate": round(interviews_or_accepted / total_apps * 100, 2),
            "interview_rate": round(interviews / total_apps * 100, 2),
            "last_interaction": last_interaction
        }

    @property
    def flags(self) -> List[str]:
        m = self.metrics
        f = []
        if m["rejection_rate"] > 70 and m["total_apps"] >= 3:
            f.append("HIGH_REJECTION")
        if m["no_responses"] > 2 and m["ghosting_rate"] > 50:
            f.append("NO_RESPONSE_PATTERN")
        if m["ghosting_rate"] > 30 and m["total_apps"] >= 3:
            f.append("LOW_RESPONSE_RATE")
        return f

    @property
    def global_flag_level(self) -> str:
        # visual level (green / orange / red)
        f = self.flags
        if "HIGH_REJECTION" in f or "NO_RESPONSE_PATTERN" in f:
            return "red"
        if f:
            return "orange"
        return "green"
