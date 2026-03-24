export interface CompanySummary {
  id: number;
  name: string;
}

export interface Application {
  id: number;
  company: CompanySummary;
  title: string;
  type: string;
  status: string;
  source: string | null;
  job_url: string | null;
  applied_at: string | null;
  last_contact_at: string | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
  hidden: number;
  events: Event[];
}

export interface Event {
  id: number;
  ts: string;
  type: string;
  payload_json: string;
  payload?: any;
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

export interface CompanyStats {
  total_apps: number;
  total_offers: number;
  rejections: number;
  no_responses: number;
  interviews: number;
  rejection_rate: number;
  ghosting_rate: number;
  response_rate: number;
  interview_rate: number;
  last_interaction: string | null;
}

export interface CompanyDetails extends CompanySummary {
  slug: string;
  type: string;
  website: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  metrics: CompanyStats;
  flags: string[];
  global_flag_level: string;
  offers: any[];
  contacts: any[];
  applications: Application[];
}
