export type OrganizationType =
  | 'CLIENT_FINAL'
  | 'ESN'
  | 'CABINET_RECRUTEMENT'
  | 'STARTUP'
  | 'PME'
  | 'GRAND_COMPTE'
  | 'PORTAGE'
  | 'AUTRE';

type ProbityLevel = 'fiable' | 'moyen' | 'méfiance' | 'insuffisant';

interface OrganizationStats {
  organization_id: string;
  total_applications: number;
  total_responses: number;
  response_rate: number;
  avg_response_days: number | null;
  ghosting_count: number;
  positive_count: number;
  positive_rate: number;
  probity_score: number | null;
  probity_level: ProbityLevel;
}

export interface Organization extends OrganizationStats {
  id: string;
  name: string;
  type: OrganizationType;
  website: string | null;
  linkedin_url: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  metrics: Pick<OrganizationStats, 'probity_score' | 'probity_level'>;
}

export interface Contact {
  id: string;
  organization_id: string | null;
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

export interface Application {
  id: string;
  organization_id: string | null;
  final_customer_organization_id: string | null;
  final_customer_name?: string | null;
  company: string;
  company_name: string;
  organization: { id: string; name: string } | null;
  title: string;
  type: string;
  status: string;
  source: string | null;
  channel: string | null;
  job_url: string | null;
  applied_at: string | null;
  response_date: string | null;
  salary: number | null;
  daily_rate: number | null;
  notes: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
  hidden: number;
}

export interface ApplicationEvent {
  id: string | number;
  type: string;
  ts: string;
  payload: Record<string, unknown>;
}

export interface ContactApplicationSummary {
  id: string;
  title: string;
  company: string;
  applied_at: string | null;
  status: string;
}

export interface ContactEvent {
  id: string | number;
  ts: string;
  type: string;
  event_type?: string;
  payload?: Record<string, unknown>;
  application?: { id: string; title: string; status: string };
}

export interface ContactDetails extends Contact {
  organization: { id: string; name: string; type: string } | null;
  applications: ContactApplicationSummary[];
  events: ContactEvent[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface SubscriptionStatus {
  subscription_status: 'pending' | 'active' | 'cancelled' | string;
  is_active: boolean;
  plan: 'free' | 'pro' | 'ultimate' | string;
  billing_period: 'monthly' | 'yearly' | null;
  plan_started_at: string | null;
  limits?: Record<string, unknown>;
  usage?: Record<string, unknown>;
}
