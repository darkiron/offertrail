import type { CompanySummaryModel } from '../company/model';

export interface ApplicationModel {
  id: number;
  company: CompanySummaryModel;
  offer: OfferSummaryModel | null;
  contact: ContactSummaryModel | null;
  title: string;
  type: string;
  status: string;
  source: string | null;
  jobUrl: string | null;
  appliedAt: string | null;
  lastContactAt: string | null;
  nextFollowupAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: ApplicationEventModel[];
}

export interface OfferSummaryModel {
  id: number;
  title: string;
  type: string;
}

export interface ContactSummaryModel {
  id: number;
  name: string;
}

export interface ApplicationEventModel {
  id: number;
  type: string;
  timestamp: string;
  payload: any;
}

export const mapApplicationDtoToModel = (dto: any): ApplicationModel => {
  return {
    id: dto.id,
    company: {
      id: dto.company?.id || 0,
      name: dto.company?.name || dto.company_name || 'Unknown',
    },
    offer: dto.offer ? {
      id: dto.offer.id,
      title: dto.offer.title,
      type: dto.offer.type || dto.offer_type,
    } : null,
    contact: dto.contact ? {
      id: dto.contact.id,
      name: dto.contact.name,
    } : null,
    title: dto.title || dto.offer?.title || '',
    type: dto.type || dto.offer?.type || dto.offer_type || '',
    status: dto.status,
    source: dto.source,
    jobUrl: dto.job_url,
    appliedAt: dto.applied_at,
    lastContactAt: dto.last_contact_at,
    nextFollowupAt: dto.next_followup_at,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    events: (dto.events || []).map((e: any) => ({
      id: e.id,
      type: e.type,
      timestamp: e.ts || e.created_at,
      payload: e.payload || (e.payload_json ? JSON.parse(e.payload_json) : {}),
    })),
  };
};
