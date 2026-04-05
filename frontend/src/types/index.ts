export type OrganizationType = 'CLIENT_FINAL' | 'ESN' | 'CABINET_RECRUTEMENT' | 'STARTUP' | 'PME' | 'GRAND_COMPTE' | 'PORTAGE' | 'AUTRE';

export type ProbityLevel = 'fiable' | 'moyen' | 'méfiance' | 'insuffisant';

export interface OrganizationStats {
  organization_id: number;
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
  id: number;
  name: string;
  type: OrganizationType;
  website: string | null;
  linkedin_url: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  organization_id: number | null;
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
  id: number;
  organization_id: number | null;
  final_customer_organization_id: number | null;
  final_customer_name?: string | null;
  company: string;
  title: string;
  type: string;
  status: string;
  source: string | null;
  job_url: string | null;
  applied_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
  hidden: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface KPIs {
  total_count: number;
  active_count: number;
  due_followups: number;
  rejected_rate: number;
  rejected_count: number;
  response_rate: number;
  responded_count: number;
  avg_response_time: number | null;
}

export interface MonthlyKpis {
  created: number;
  responses: number;
  rejected: number;
  followups_due: number;
}

export interface DashboardData {
  kpis: KPIs;
  monthly_kpis: MonthlyKpis;
  sources: string[];
  followups: Application[];
}

export interface MonthlyStats {
  month: string;
  count: number;
}

export interface MonthlyInsights {
  year: number;
  months: MonthlyStats[];
}

export interface AuthUser {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  plan: string;
  role: string;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  prenom?: string;
  nom?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SubscriptionStatus {
  plan: 'starter' | 'pro' | string;
  is_pro: boolean;
  candidatures_count: number;
  candidatures_max: number;
  limite_atteinte: boolean;
  alerte_80: boolean;
  plan_started_at: string | null;
}
