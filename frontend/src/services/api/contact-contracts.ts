import type {
  Application,
  ContactApplicationSummary,
  ContactEvent,
} from '../../types';

export interface ContactPortfolioItem {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  is_recruiter: boolean;
  updated_at: string;
  organization: { id: string; name: string; type: string } | null;
}
export interface ContactPortfolioPage {
  items: ContactPortfolioItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ContactApi {
  id: string | number;
  organization_id: string | number | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  is_recruiter: number;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactDetailsApi extends ContactApi {
  organization: { id: string; name: string; type: string } | null;
  applications: Array<
    Partial<ContactApplicationSummary> &
      Pick<Application, 'id' | 'title' | 'status' | 'applied_at'>
  >;
  events: Array<
    Omit<ContactEvent, 'application'> & {
      application?: { id: string | number; title: string; status: string };
    }
  >;
}
