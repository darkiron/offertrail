export interface WorkflowOrganization {
  id: string;
  nom: string;
  type: string;
}

export interface OrganizationPortfolioItem {
  id: string;
  name: string;
  type: string;
  website: string | null;
  description: string | null;
  type_contrat: string | null;
  created_at: string;
  updated_at: string;
  applications_count: number;
  responses_count: number;
  positive_count: number;
  response_rate: number;
}

export interface OrganizationPortfolioPage {
  items: OrganizationPortfolioItem[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface OrganizationWorkspace {
  organization: OrganizationPortfolioItem;
  applications: Array<{
    id: string;
    title: string;
    status: string;
    applied_at: string | null;
    updated_at: string;
    source: string | null;
  }>;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    role: string | null;
    email: string | null;
    linkedin_url: string | null;
  }>;
  activity: Array<{
    id: string;
    application_id: string;
    type: string;
    content: string | null;
    created_at: string;
  }>;
  capabilities: { can_edit: boolean };
}

export interface EtablissementApi {
  id: string;
  nom: string;
  type: string;
  site_web: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  total_applications: number;
  total_responses: number;
  response_rate: number;
  avg_response_days: number | null;
  ghosting_count: number;
  positive_count: number;
  positive_rate: number;
  probity_score: number | null;
  probity_level: string;
  city: string | null;
  linkedin_url: string | null;
  notes: string | null;
}
