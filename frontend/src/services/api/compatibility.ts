import axios from 'axios';
import type {
  Application,
  ApplicationEvent,
  AuthResponse,
  Contact,
  ContactDetails,
  ContactApplicationSummary,
  ContactEvent,
  DashboardData,
  LoginCredentials,
  Organization,
  OrganizationType,
  PaginatedResponse,
  RegisterPayload,
  SubscriptionStatus,
  TodayData,
} from '../../types';

// En mode dev avec proxy Vite, VITE_API_URL est vide → baseURL "" = même origine → pas de CORS.
// En prod, VITE_API_URL=https://api.offertrail.fr est utilisé directement.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

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

export interface WorkflowApplication {
  id: string;
  poste: string;
  statut: string;
  date_candidature: string | null;
  updated_at: string;
  organization: { id: string; name: string };
  next_action: { id: string; kind: string; due_at: string; urgency: string } | null;
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
    id: string; etablissement_id: string; client_final_id: string | null; poste: string; statut: string; url_offre: string | null;
    description: string | null; type_contrat: string | null; notes: string | null; source: string | null;
    date_candidature: string | null; salaire_vise: number | null; tjm_vise: number | null;
  };
  organization: {
    id: string; name: string; type: string; website: string | null; description: string | null;
    relationship_summary: { applications: number; responses: number };
  };
  final_customer: { id:string; name:string } | null;
  contacts: Array<{ id: string; first_name: string; last_name: string; role: string | null; email: string | null; linkedin_url: string | null }>;
  next_action: { id: string; kind: string; due_at: string; channel: string | null } | null;
  future_actions: Array<{ id: string; due_at: string; channel: string | null }>;
  timeline: { items: Array<{ id: string; type: string; ancien_statut: string | null; nouveau_statut: string | null; contenu: string | null; created_at: string }>; next_cursor: string | null };
  capabilities: { can_update: boolean; can_delete: boolean; can_create_followup: boolean };
}

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
  applications: Array<{ id: string; title: string; status: string; applied_at: string | null; updated_at: string; source: string | null }>;
  contacts: Array<{ id: string; first_name: string; last_name: string; role: string | null; email: string | null; linkedin_url: string | null }>;
  activity: Array<{ id: string; application_id: string; type: string; content: string | null; created_at: string }>;
  capabilities: { can_edit: boolean };
}

export interface OrganizationDetails extends Organization {
  applications: Array<{ id: number; title: string; applied_at: string; status: string }>;
  contacts: Array<{
    id: number;
    first_name: string;
    last_name: string;
    role: string;
    email?: string;
  }>;
}

export interface ContactPortfolioItem { id:string; first_name:string; last_name:string; role:string|null; email:string|null; phone:string|null; is_recruiter:boolean; updated_at:string; organization:{id:string;name:string;type:string}|null }
export interface ContactPortfolioPage { items:ContactPortfolioItem[]; total:number; page:number; per_page:number; pages:number }

export interface DashboardParams {
  status?: string;
  type?: string;
  source?: string;
}

export interface CheckoutPayload {
  plan: 'pro' | 'ultimate';
  period: 'monthly' | 'yearly';
  coupon?: string;
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

interface CandidatureApi {
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

interface EtablissementApi {
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

interface MeStatsApi {
  total_candidatures: number;
  pipeline_actif: number;
  taux_refus: number;
  temps_moyen_reponse: number | null;
  delai_moyen_reponse: number | null;
  taux_reponse: number;
  relances_dues: number;
}

interface RelanceApi {
  id: string;
  candidature_id: string;
  user_id: string;
  contact_id: string | null;
  date_prevue: string;
  date_effectuee: string | null;
  canal: string | null;
  contenu: string | null;
  statut: string;
  created_at: string;
}

interface EventApi {
  id: string;
  type: string;
  ancien_statut: string | null;
  nouveau_statut: string | null;
  contenu: string | null;
  created_at: string;
}

interface ContactApi {
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

interface ContactDetailsApi extends ContactApi {
  organization: { id:string; name:string; type:string } | null;
  applications: Array<
    Partial<ContactApplicationSummary> &
      Pick<Application, 'id' | 'title' | 'status' | 'applied_at'>
  >;
  events: Array<Omit<ContactEvent, 'application'> & {
    application?: { id: string | number; title: string; status: string };
  }>;
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


const candidatureNumericToUuid = new Map<number, string>();
const organizationNumericToUuid = new Map<number, string>();
const contactNumericToUuid = new Map<number, string>();

function toLegacyId(uuid: string | number): number {
  if (typeof uuid === 'number') {
    return uuid;
  }
  let hash = 0;
  for (let index = 0; index < uuid.length; index += 1) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(index)) | 0;
  }
  const normalized = Math.abs(hash) || 1;
  candidatureNumericToUuid.set(normalized, uuid);
  return normalized;
}

function toLegacyOrganizationId(uuid: string | number): number {
  if (typeof uuid === 'number') {
    return uuid;
  }
  let hash = 0;
  const seed = `org:${uuid}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  const normalized = Math.abs(hash) || 1;
  organizationNumericToUuid.set(normalized, uuid);
  return normalized;
}

function toLegacyContactId(uuid: string | number): number {
  if (typeof uuid === 'number') {
    return uuid;
  }
  let hash = 0;
  const seed = `contact:${uuid}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  const normalized = Math.abs(hash) || 1;
  contactNumericToUuid.set(normalized, uuid);
  return normalized;
}

function resolveCandidatureId(id: number | string): string {
  if (typeof id === 'string' && id.includes('-')) {
    return id;
  }
  const numericId = typeof id === 'number' ? id : Number(id);
  return candidatureNumericToUuid.get(numericId) ?? String(id);
}

function resolveOrganizationId(id: number | string): string {
  if (typeof id === 'string' && id.includes('-')) {
    return id;
  }
  const numericId = typeof id === 'number' ? id : Number(id);
  return organizationNumericToUuid.get(numericId) ?? String(id);
}

function resolveContactId(id: number | string): string {
  if (typeof id === 'string' && id.includes('-')) {
    return id;
  }
  const numericId = typeof id === 'number' ? id : Number(id);
  return contactNumericToUuid.get(numericId) ?? String(id);
}

async function ensureOrganizationIdResolved(id: number | string): Promise<string> {
  const resolved = resolveOrganizationId(id);
  if (resolved.includes('-')) {
    return resolved;
  }
  const response = await axiosInstance.get<EtablissementApi[]>('/etablissements');
  response.data.forEach((item) => {
    toLegacyOrganizationId(item.id);
  });
  return resolveOrganizationId(id);
}

async function ensureCandidatureIdResolved(id: number | string): Promise<string> {
  const resolved = resolveCandidatureId(id);
  if (resolved.includes('-')) {
    return resolved;
  }
  const response = await axiosInstance.get<CandidatureApi[]>('/candidatures');
  response.data.forEach((item) => {
    toLegacyId(item.id);
  });
  return resolveCandidatureId(id);
}

async function ensureContactIdResolved(id: number | string): Promise<string> {
  const resolved = resolveContactId(id);
  if (resolved.includes('-')) {
    return resolved;
  }
  const response = await axiosInstance.get<ContactApi[]>('/contacts');
  response.data.forEach((item) => {
    if (typeof item.id === 'string') {
      toLegacyContactId(item.id);
    }
  });
  return resolveContactId(id);
}


function normalizeDate(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.includes('T') ? value.slice(0, 10) : value;
}

function normalizeOrganizationType(value: string): OrganizationType {
  switch (value.toUpperCase()) {
    case 'CLIENT_FINAL':
      return 'CLIENT_FINAL';
    case 'ESN':
      return 'ESN';
    case 'CABINET_RECRUTEMENT':
      return 'CABINET_RECRUTEMENT';
    case 'STARTUP':
      return 'STARTUP';
    case 'PME':
      return 'PME';
    case 'GRAND_COMPTE':
      return 'GRAND_COMPTE';
    case 'PORTAGE':
      return 'PORTAGE';
    default:
      return 'AUTRE';
  }
}

async function fetchEtablissementsIndex(): Promise<Map<string, EtablissementApi>> {
  const response = await axiosInstance.get<EtablissementApi[]>('/etablissements');
  return new Map(response.data.map((item) => [item.id, item]));
}

function mapEtablissementToOrganization(etablissement: EtablissementApi): Organization {
  const probityLevel =
    etablissement.probity_level === 'insuffisant' ||
    etablissement.probity_level === 'fiable' ||
    etablissement.probity_level === 'moyen' ||
    etablissement.probity_level === 'méfiance'
      ? etablissement.probity_level
      : 'insuffisant';
  return {
    id: toLegacyOrganizationId(etablissement.id),
    organization_id: toLegacyOrganizationId(etablissement.id),
    total_applications: etablissement.total_applications,
    total_responses: etablissement.total_responses,
    response_rate: etablissement.response_rate,
    avg_response_days: etablissement.avg_response_days,
    ghosting_count: etablissement.ghosting_count,
    positive_count: etablissement.positive_count,
    positive_rate: etablissement.positive_rate,
    probity_score: etablissement.probity_score,
    probity_level: probityLevel,
    metrics: {
      probity_score: etablissement.probity_score,
      probity_level: probityLevel,
    },
    name: etablissement.nom,
    type: normalizeOrganizationType(etablissement.type),
    website: etablissement.site_web,
    linkedin_url: etablissement.linkedin_url,
    city: etablissement.city,
    notes: etablissement.notes ?? etablissement.description,
    created_at: etablissement.created_at,
    updated_at: etablissement.updated_at,
  };
}

function mapCandidatureToApplication(
  candidature: CandidatureApi,
  etablissement?: EtablissementApi,
  finalCustomer?: EtablissementApi | null,
): Application {
  return {
    id: toLegacyId(candidature.id),
    organization_id: etablissement ? toLegacyOrganizationId(etablissement.id) : null,
    final_customer_organization_id: finalCustomer ? toLegacyOrganizationId(finalCustomer.id) : null,
    final_customer_name: finalCustomer?.nom ?? null,
    company: etablissement?.nom ?? 'Etablissement',
    company_name: etablissement?.nom ?? 'Etablissement',
    organization: etablissement
      ? { id: toLegacyOrganizationId(etablissement.id), name: etablissement.nom }
      : null,
    title: candidature.poste,
    type: candidature.type_contrat ?? 'autre',
    status: candidature.statut ?? 'en_attente',
    source: candidature.source,
    channel: candidature.source,
    job_url: candidature.url_offre,
    applied_at: normalizeDate(candidature.date_candidature),
    response_date: normalizeDate(candidature.date_reponse),
    salary: candidature.salaire_vise,
    daily_rate: candidature.tjm_vise,
    notes: candidature.notes,
    next_followup_at: null,
    created_at: candidature.created_at,
    updated_at: candidature.updated_at,
    hidden: 0,
  };
}

function mapPayloadToSaas(data: ApplicationPayload): Partial<CandidatureApi> {
  const payload: Partial<CandidatureApi> = {};
  const has = (key: keyof ApplicationPayload) => Object.prototype.hasOwnProperty.call(data, key);

  if (has('organization_id') && data.organization_id) {
    payload.etablissement_id = resolveOrganizationId(data.organization_id);
  }
  if (has('final_customer_organization_id')) {
    payload.client_final_id = data.final_customer_organization_id
      ? resolveOrganizationId(data.final_customer_organization_id)
      : null;
  }
  if (has('title')) payload.poste = data.title ?? '';
  if (has('type')) payload.type_contrat = data.type?.toLowerCase() ?? null;
  if (has('status')) payload.statut = data.status ?? undefined;
  if (has('source')) payload.source = data.source ?? null;
  if (has('job_url')) payload.url_offre = data.job_url ?? null;
  if (has('applied_at')) payload.date_candidature = data.applied_at ?? null;
  if (has('response_date')) payload.date_reponse = data.response_date ?? null;
  if (has('salary')) payload.salaire_vise = data.salary ?? null;
  if (has('daily_rate')) payload.tjm_vise = data.daily_rate ?? null;
  if (has('notes')) payload.notes = data.notes ?? null;

  return payload;
}

function mapContactApiToContact(contact: ContactApi): Contact {
  const organizationId =
    typeof contact.organization_id === 'number'
      ? contact.organization_id
      : contact.organization_id
        ? toLegacyOrganizationId(contact.organization_id)
        : null;
  return {
    id: toLegacyContactId(contact.id),
    organization_id: organizationId,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    role: contact.role,
    is_recruiter: contact.is_recruiter,
    linkedin_url: contact.linkedin_url,
    notes: contact.notes,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
  };
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Nettoyage de l'ancien token legacy (pré-Supabase) si présent en localStorage
localStorage.removeItem('offertrail.auth.token');

// Réexportée par AuthContext via applySession — pas de localStorage
export function setAxiosAuthToken(token: string | null): void {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await axiosInstance.post<AuthResponse>(
      '/auth/login',
      new URLSearchParams({
        username: credentials.email,
        password: credentials.password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data;
  },
  register: async (payload: RegisterPayload) => {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', payload);
    return response.data;
  },
  me: async () => {
    const response = await axiosInstance.get<AuthResponse['user']>('/auth/me');
    return response.data;
  },
  updateMe: async (payload: Pick<RegisterPayload, 'prenom' | 'nom'>) => {
    const response = await axiosInstance.patch<AuthResponse['user']>('/auth/me', payload);
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.post<{ message: string }>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await axiosInstance.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await axiosInstance.post<{ message: string }>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

export const organizationService = {
  getPortfolio: async (params?: { page?: number; per_page?: number; q?: string; relationship_role?: string; sort?: string }) => {
    const response = await axiosInstance.get<OrganizationPortfolioPage>('/me/etablissements', { params });
    return response.data;
  },
  getWorkspace: async (id: string) => {
    const response = await axiosInstance.get<OrganizationWorkspace>(`/me/etablissements/${id}/workspace`);
    return response.data;
  },
  getWorkflowAll: async () => {
    const response = await axiosInstance.get<WorkflowOrganization[]>('/etablissements');
    return response.data;
  },
  searchWorkflow: async (query: string) => {
    const response = await axiosInstance.get<WorkflowOrganization[]>('/etablissements', { params: { q: query, limit: 10 } });
    return response.data;
  },
  createWorkflow: async (payload: { nom: string; type: string }) => {
    const response = await axiosInstance.post<WorkflowOrganization>('/etablissements', payload);
    return response.data;
  },
  updateWorkflow: async (id: string, payload: { nom:string; type:string; site_web:string|null; description:string|null }) => {
    const response = await axiosInstance.patch<EtablissementApi>(`/etablissements/${id}`, payload);
    return response.data;
  },
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await axiosInstance.get<EtablissementApi[]>('/etablissements', { params: { type:params?.type, q:params?.search, limit:params?.search?10:undefined } });
    return response.data.map(mapEtablissementToOrganization);
  },
  getById: async (id: number | string) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.get<EtablissementApi>(`/etablissements/${resolvedId}`);
    return mapEtablissementToOrganization(response.data);
  },
  create: async (data: Partial<Organization>) => {
    const response = await axiosInstance.post<EtablissementApi>('/etablissements', {
      nom: data.name,
      type: data.type ?? 'AUTRE',
      site_web: data.website ?? null,
      description: data.notes ?? null,
    });
    const mapped = mapEtablissementToOrganization(response.data);
    return { id: mapped.id };
  },
  update: async (id: number | string, data: Partial<Organization>) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.patch(`/etablissements/${resolvedId}`, {
      nom: data.name,
      type: data.type,
      site_web: data.website ?? null,
      description: data.notes ?? null,
    });
    return mapEtablissementToOrganization(response.data);
  },
  merge: async (id: number, targetOrganizationId: number) => {
    const sourceId = await ensureOrganizationIdResolved(id);
    const targetId = await ensureOrganizationIdResolved(targetOrganizationId);
    const response = await axiosInstance.post(`/etablissements/${sourceId}/merge`, {
      target_organization_id: targetId,
    });
    return response.data;
  },
  split: async (id: number, data: Partial<Organization> & { move_contacts?: boolean }) => {
    const sourceId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.post<{ id: number }>(`/etablissements/${sourceId}/split`, {
      name: data.name,
      type: data.type,
      website: data.website ?? null,
      notes: data.notes ?? null,
      move_contacts: data.move_contacts,
    });
    return response.data;
  },
  delete: async (id: number) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.delete(`/etablissements/${resolvedId}`);
    return response.data;
  },
};

export const contactService = {
  getPortfolio: async (params: { page:number; per_page:number; q?:string; view?:string }) => {
    const response = await axiosInstance.get<ContactPortfolioPage>('/me/contacts', { params });
    return response.data;
  },
  getAll: async (params?: { organization_id?: number }) => {
    const response = await axiosInstance.get<ContactApi[]>('/contacts', {
      params: {
        organization_id: params?.organization_id ? resolveOrganizationId(params.organization_id) : undefined,
      },
    });
    return response.data.map(mapContactApiToContact);
  },
  getById: async (id: number | string) => {
    const resolvedId = await ensureContactIdResolved(id);
    const response = await axiosInstance.get<ContactDetailsApi>(`/contacts/${resolvedId}`);
    return {
      ...mapContactApiToContact(response.data),
      organization: response.data.organization,
      applications: response.data.applications.map((application) => ({
        id: String(application.id),
        title: application.title,
        company: application.company ?? response.data.organization?.name ?? 'Entreprise',
        applied_at: application.applied_at,
        status: application.status,
      })),
      events: response.data.events.map((event) => ({
        ...event,
        application: event.application
          ? { ...event.application, id: String(event.application.id) }
          : undefined,
      })),
    } satisfies ContactDetails;
  },
  create: async (data: Partial<Contact>) => {
    const response = await axiosInstance.post<{ id: string }>('/contacts', {
      ...data,
      organization_id: data.organization_id ? resolveOrganizationId(data.organization_id) : null,
    });
    return { id: toLegacyContactId(response.data.id) };
  },
  update: async (id: number, data: Partial<Contact>) => {
    const resolvedId = await ensureContactIdResolved(id);
    const response = await axiosInstance.patch(`/contacts/${resolvedId}`, {
      ...data,
      organization_id: data.organization_id ? resolveOrganizationId(data.organization_id) : null,
    });
    return response.data;
  },
  delete: async (id: number) => {
    const resolvedId = await ensureContactIdResolved(id);
    const response = await axiosInstance.delete(`/contacts/${resolvedId}`);
    return response.data;
  },
  linkToApplication: async (contactId: number, applicationId: number) => {
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: resolveCandidatureId(applicationId),
      type: 'contact_ajout',
      contenu: `Contact lie: ${resolveContactId(contactId)}`,
    });
    return response.data;
  },
};

export const subscriptionService = {
  getMe: async () => {
    const response = await axiosInstance.get<SubscriptionStatus>('/subscription/me');
    return response.data;
  },
  checkout: async (payload: CheckoutPayload) => {
    const response = await axiosInstance.post<{ mode: 'simulated' | 'stripe'; checkout_url: string | null; message?: string }>('/subscription/checkout', payload);
    return response.data;
  },
  portal: async () => {
    const response = await axiosInstance.post<{ portal_url: string }>('/subscription/portal');
    return response.data;
  },
};

export const applicationService = {
  createWorkflowApplication: async (payload: {
    etablissement_id: string; client_final_id?: string | null; poste: string; statut: string;
    date_candidature?: string | null; source?: string | null; url_offre?: string | null; type_contrat?: string | null;
  }) => {
    const response = await axiosInstance.post<CandidatureApi>('/me/candidatures', payload);
    return response.data;
  },
  getWorkflowApplications: async (params: WorkflowApplicationListParams) => {
    const response = await axiosInstance.get<WorkflowApplicationPage>('/me/candidatures', { params });
    return response.data;
  },
  getWorkspace: async (id: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.get<ApplicationWorkspace>(`/me/candidatures/${candidatureId}/workspace`);
    return response.data;
  },
  updateWorkflowStatus: async (id: string, status: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.patch(`/me/candidatures/${candidatureId}/status`, { status });
    return response.data;
  },
  updateWorkflowDetails: async (id: string, payload: Partial<CandidatureApi>) => {
    const response = await axiosInstance.patch<CandidatureApi>(`/candidatures/${id}`, payload);
    return response.data;
  },
  addWorkflowNote: async (id: string, content: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.post('/candidature-events', { candidature_id:candidatureId, type:'note_ajout', contenu:content });
    return response.data;
  },
  scheduleWorkflowAction: async (id: string, payload: { due_at: string; channel?: string; note?: string }) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.post(`/me/candidatures/${candidatureId}/actions`, payload);
    return response.data;
  },
  getApplications: async (params?: ApplicationListParams) => {
    const etablissementIndex = await fetchEtablissementsIndex();
    const response = await axiosInstance.get<CandidatureApi[]>('/candidatures', { params });
    const items = response.data.map((item) =>
      mapCandidatureToApplication(
        item,
        etablissementIndex.get(item.etablissement_id),
        item.client_final_id ? etablissementIndex.get(item.client_final_id) ?? null : null,
      ),
    );
    return {
      items,
      total: items.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? items.length,
    } satisfies PaginatedResponse<Application>;
  },
  getApplication: async (id: number | string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const etablissementIndex = await fetchEtablissementsIndex();
    const candidatureResponse = await axiosInstance.get<CandidatureApi>(`/candidatures/${candidatureId}`);
    const historyResponse = await axiosInstance.get<EventApi[]>(`/candidatures/${candidatureId}/events`);
    const candidature = candidatureResponse.data;
    const etablissement = etablissementIndex.get(candidature.etablissement_id) ?? null;
    const finalCustomer = candidature.client_final_id ? etablissementIndex.get(candidature.client_final_id) ?? null : null;
    const application = mapCandidatureToApplication(candidature, etablissement ?? undefined, finalCustomer);

    const contactsResponse = await contactService.getAll({
      organization_id: etablissement ? toLegacyOrganizationId(etablissement.id) : undefined,
    });

    return {
      application,
      organization: etablissement
        ? {
            id: toLegacyOrganizationId(etablissement.id),
            organization_id: toLegacyOrganizationId(etablissement.id),
            total_applications: 0,
            total_responses: 0,
            response_rate: 0,
            avg_response_days: null,
            ghosting_count: 0,
            positive_count: 0,
            positive_rate: 0,
            probity_score: null,
            probity_level: 'insuffisant',
            metrics: {
              probity_score: null,
              probity_level: 'insuffisant',
            },
            name: etablissement.nom,
            type: 'AUTRE',
            website: null,
            linkedin_url: null,
            city: null,
            notes: null,
            created_at: candidature.created_at,
            updated_at: candidature.updated_at,
          }
        : null,
      final_customer_organization: finalCustomer ? mapEtablissementToOrganization(finalCustomer) : null,
      events: historyResponse.data.map((event) => ({
        id: event.id,
        type: event.type.toUpperCase(),
        ts: event.created_at,
        payload: {
          old_status: event.ancien_statut ?? null,
          new_status: event.nouveau_statut ?? null,
          text: event.contenu,
        },
      })),
      contacts: contactsResponse,
      all_contacts: contactsResponse,
    } satisfies ApplicationDetailsResponse;
  },
  createApplication: async (data: ApplicationPayload) => {
    const payload = mapPayloadToSaas(data);
    const response = await axiosInstance.post('/candidatures', payload);
    return response.data;
  },
  updateApplication: async (id: number | string, data: ApplicationPayload) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const payload = mapPayloadToSaas(data);
    const response = await axiosInstance.patch(`/candidatures/${candidatureId}`, payload);
    return response.data;
  },
  addNote: async (id: number, text: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: candidatureId,
      type: 'note_ajout',
      contenu: text,
    });
    return response.data;
  },
  markFollowup: async (id: number) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const relances = await axiosInstance.get<RelanceApi[]>('/relances');
    const target = relances.data.find((item) => item.candidature_id === candidatureId && item.statut === 'a_faire');
    if (!target) {
      return { success: true };
    }
    const response = await axiosInstance.patch(`/relances/${target.id}`, {
      statut: 'faite',
      date_effectuee: new Date().toISOString(),
    });
    return response.data;
  },
  addEvent: async (id: number, eventType: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const eventTypeMap: Record<string, string> = {
      RESPONSE_RECEIVED: 'note_ajout',
    };
    const contentMap: Record<string, string> = {
      RESPONSE_RECEIVED: 'Reponse recue',
    };
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: candidatureId,
      type: eventTypeMap[eventType] ?? eventType.toLowerCase(),
      contenu: contentMap[eventType] ?? eventType,
    });
    return response.data;
  },
  linkContact: async (appId: number, contactId: number) => {
    const response = await contactService.linkToApplication(contactId, appId);
    return response.data;
  },
  createContact: async (
    appId: number,
    data: {
      first_name?: string;
      last_name?: string;
      email?: string | null;
      phone?: string | null;
      organization_id?: number | null;
      role?: string | null;
      is_recruiter?: number;
    },
  ) => {
    const created = await contactService.create({
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      email: data.email ?? null,
      phone: data.phone ?? null,
      role: data.role ?? null,
      is_recruiter: data.is_recruiter ?? 0,
      organization_id: data.organization_id ?? null,
    });
    await contactService.linkToApplication(created.id, appId);
    return created;
  },
  importTsv: async (tsv: string) => {
    const response = await axiosInstance.post<ImportResponse>('/api/import', { tsv });
    return response.data;
  },
  updateEvent: async (eventId: string, data: EventUpdatePayload) => {
    const response = await axiosInstance.patch(`/candidature-events/${eventId}`, data);
    return response.data;
  },
  deleteEvent: async (eventId: string) => {
    await axiosInstance.delete(`/candidature-events/${eventId}`);
  },
};

export const dashboardService = {
  getToday: async () => {
    const response = await axiosInstance.get<TodayData>('/me/today');
    return response.data;
  },
  completeAction: async (actionId: string, payload: {
    outcome: string;
    note?: string;
    next_action?: { due_at: string; channel?: string } | null;
  }) => {
    const response = await axiosInstance.post(`/me/actions/${actionId}/complete`, payload);
    return response.data;
  },
  getDashboardData: async (params?: DashboardParams) => {
    const [statsResponse, relancesResponse, applicationsResponse] = await Promise.all([
      axiosInstance.get<MeStatsApi>('/me/stats', { params }),
      axiosInstance.get<RelanceApi[]>('/me/relances/dues'),
      applicationService.getApplications(),
    ]);

    const stats = statsResponse.data;
    const followups = applicationsResponse.items.filter((item) =>
      relancesResponse.data.some((relance) => resolveCandidatureId(item.id) === relance.candidature_id),
    );

    return {
      kpis: {
        total_count: stats.total_candidatures,
        active_count: stats.pipeline_actif,
        due_followups: stats.relances_dues,
        rejected_rate: stats.taux_refus,
        rejected_count: Math.round((stats.total_candidatures * stats.taux_refus) / 100),
        response_rate: stats.taux_reponse,
        responded_count: Math.round((stats.total_candidatures * stats.taux_reponse) / 100),
        avg_response_time: stats.temps_moyen_reponse ?? stats.delai_moyen_reponse,
      },
      monthly_kpis: {
        created: stats.total_candidatures,
        responses: Math.round((stats.total_candidatures * stats.taux_reponse) / 100),
        rejected: Math.round((stats.total_candidatures * stats.taux_refus) / 100),
        followups_due: stats.relances_dues,
      },
      sources: [],
      followups,
    } satisfies DashboardData;
  },
  getMonthlyInsights: async (year?: number) => {
    const targetYear = year ?? new Date().getFullYear();
    const response = await axiosInstance.get<CandidatureApi[]>('/candidatures');
    const monthCounts = new Array<number>(12).fill(0);
    response.data.forEach((item) => {
      const rawDate = item.date_candidature ?? item.created_at;
      if (!rawDate) {
        return;
      }
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== targetYear) {
        return;
      }
      monthCounts[parsed.getMonth()] += 1;
    });
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      year: targetYear,
      months: monthLabels.map((month, index) => ({ month, count: monthCounts[index] })),
    };
  },
};

export const api = {
  getCompany: async (id: number | string): Promise<OrganizationDetails> => {
    const workspace = await organizationService.getWorkspace(
      await ensureOrganizationIdResolved(id),
    );
    const organizationId = toLegacyOrganizationId(workspace.organization.id);
    return {
      id: organizationId,
      organization_id: organizationId,
      name: workspace.organization.name,
      type: normalizeOrganizationType(workspace.organization.type),
      website: workspace.organization.website,
      linkedin_url: null,
      city: null,
      notes: workspace.organization.description,
      created_at: workspace.organization.created_at,
      updated_at: workspace.organization.updated_at,
      total_applications: workspace.organization.applications_count,
      total_responses: workspace.organization.responses_count,
      response_rate: workspace.organization.response_rate,
      avg_response_days: null,
      ghosting_count: 0,
      positive_count: workspace.organization.positive_count,
      positive_rate: 0,
      probity_score: null,
      probity_level: 'insuffisant',
      metrics: { probity_score: null, probity_level: 'insuffisant' },
      applications: workspace.applications.map((application) => ({
        id: toLegacyId(application.id),
        title: application.title,
        applied_at: application.applied_at ?? application.updated_at,
        status: application.status,
      })),
      contacts: workspace.contacts.map((contact) => ({
        id: toLegacyContactId(contact.id),
        first_name: contact.first_name,
        last_name: contact.last_name,
        role: contact.role ?? '',
        email: contact.email ?? undefined,
      })),
    };
  },
};

export default axiosInstance;
