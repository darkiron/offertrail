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

export interface DashboardData {
  kpis: KPIs;
  monthly_kpis: any[];
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

export interface JobSearch {
  id: number;
  name: string;
  keywords: string[];
  excluded_keywords: string[];
  locations: string[];
  contract_type: string;
  remote_mode: string;
  profile_summary: string | null;
  min_score: number;
  auto_import: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobBacklogItem {
  id: number;
  search_id: number;
  run_id: number | null;
  source: string;
  external_id: string;
  title: string;
  company: string;
  location: string | null;
  remote_mode: string | null;
  contract_type: string | null;
  url: string | null;
  description: string | null;
  published_at: string | null;
  salary_text: string | null;
  score: number;
  match_reasons: string[];
  status: 'NEW' | 'IMPORTED' | 'REJECTED';
  imported_application_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface JobBacklogRun {
  id: number;
  search_id: number;
  source: string;
  status: string;
  fetched_count: number;
  created_count: number;
  imported_count: number;
  error_text: string | null;
  created_at: string;
}
