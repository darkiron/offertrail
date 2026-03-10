export interface Application {
  id: number;
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
