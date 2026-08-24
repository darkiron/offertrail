import type {
  Application,
  ApplicationEvent,
  Contact,
  Organization,
} from '../../types';

export interface ApplicationListParams {
  status?: string;
  type?: string;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface WorkflowApplicationListParams {
  q?: string;
  status?: string;
  due?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  include_closed?: boolean;
}

interface WorkflowApplication {
  id: string;
  poste: string;
  statut: string;
  date_candidature: string | null;
  updated_at: string;
  organization: { id: string; name: string };
  next_action: {
    id: string;
    kind: string;
    due_at: string;
    urgency: string;
  } | null;
  last_event: { kind: string; occurred_at: string } | null;
}

export interface WorkflowApplicationPage {
  items: WorkflowApplication[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApplicationWorkspace {
  application: {
    id: string;
    etablissement_id: string;
    client_final_id: string | null;
    poste: string;
    statut: string;
    url_offre: string | null;
    description: string | null;
    type_contrat: string | null;
    notes: string | null;
    source: string | null;
    date_candidature: string | null;
    salaire_vise: number | null;
    tjm_vise: number | null;
  };
  organization: {
    id: string;
    name: string;
    type: string;
    website: string | null;
    description: string | null;
    relationship_summary: { applications: number; responses: number };
  };
  final_customer: { id: string; name: string } | null;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role: string | null;
    email: string | null;
    linkedin_url: string | null;
  }>;
  next_action: {
    id: string;
    kind: string;
    due_at: string;
    channel: string | null;
  } | null;
  future_actions: Array<{ id: string; due_at: string; channel: string | null }>;
  timeline: {
    items: Array<{
      id: string;
      type: string;
      ancien_statut: string | null;
      nouveau_statut: string | null;
      contenu: string | null;
      created_at: string;
    }>;
    next_cursor: string | null;
  };
  capabilities: {
    can_update: boolean;
    can_delete: boolean;
    can_create_followup: boolean;
  };
}

export interface ApplicationPayload {
  company?: string;
  title?: string;
  type?: string;
  status?: string;
  source?: string | null;
  job_url?: string | null;
  applied_at?: string | null;
  next_followup_at?: string | null;
  org_type?: string;
  organization_id?: number | null;
  final_customer_organization_id?: number | null;
  notes?: string | null;
  salary?: number | null;
  daily_rate?: number | null;
  response_date?: string | null;
}

export interface EventUpdatePayload {
  type?: string;
  contenu?: string | null;
  created_at?: string | null;
  ancien_statut?: string | null;
  nouveau_statut?: string | null;
}

export interface CandidatureApi {
  id: string;
  user_id: string;
  etablissement_id: string;
  client_final_id: string | null;
  succursale_id: string | null;
  poste: string;
  url_offre: string | null;
  description: string | null;
  type_contrat: string | null;
  statut: string;
  date_candidature: string | null;
  date_reponse: string | null;
  salaire_vise: number | null;
  tjm_vise: number | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventApi {
  id: string;
  type: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  contenu: string | null;
  created_at: string;
}

export interface ApplicationDetailsResponse {
  application: Application;
  organization: Organization | null;
  final_customer_organization: Organization | null;
  events: ApplicationEvent[];
  contacts: Contact[];
  all_contacts: Contact[];
}

export interface ImportResponse {
  total: number;
  created: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}
