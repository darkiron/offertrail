import axios from 'axios';
import type {
  Application,
  AuthResponse,
  Contact,
  DashboardData,
  LoginCredentials,
  Organization,
  PaginatedResponse,
  RegisterPayload,
  SubscriptionStatus,
} from '../types';

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

export interface DashboardParams {
  status?: string;
  type?: string;
  source?: string;
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
  statut: string;
  date_candidature: string | null;
  date_reponse: string | null;
  salaire_vise: number | null;
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
  organization: Organization | null;
  applications: Application[];
  events: Array<{
    id: string | number;
    ts: string;
    type: string;
    event_type?: string;
    payload?: Record<string, unknown>;
    application?: { id: string | number; title: string; status: string };
  }>;
}

export interface ApplicationDetailsResponse {
  application: Application;
  organization: Organization | null;
  final_customer_organization: Organization | null;
  events: Array<Record<string, unknown>>;
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

async function fetchEtablissementsIndex(): Promise<Map<string, EtablissementApi>> {
  const response = await axiosInstance.get<EtablissementApi[]>('/etablissements');
  return new Map(response.data.map((item) => [item.id, item]));
}

function mapEtablissementToOrganization(etablissement: EtablissementApi): Organization {
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
    probity_level:
      etablissement.probity_level === 'insuffisant' ||
      etablissement.probity_level === 'fiable' ||
      etablissement.probity_level === 'moyen' ||
      etablissement.probity_level === 'méfiance'
      ? etablissement.probity_level
        : 'insuffisant',
    name: etablissement.nom,
    type: (etablissement.type as Organization['type']) ?? 'AUTRE',
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
    title: candidature.poste,
    type: candidature.description ?? 'CDI',
    status: candidature.statut ?? 'en_attente',
    source: candidature.source,
    job_url: candidature.url_offre,
    applied_at: normalizeDate(candidature.date_candidature),
    next_followup_at: null,
    created_at: candidature.created_at,
    updated_at: candidature.updated_at,
    hidden: 0,
  };
}

function mapPayloadToSaas(data: ApplicationPayload): Partial<CandidatureApi> {
  return {
    etablissement_id: data.organization_id ? resolveOrganizationId(data.organization_id) : '',
    client_final_id: data.final_customer_organization_id ? resolveOrganizationId(data.final_customer_organization_id) : null,
    poste: data.title ?? '',
    description: data.type ?? null,
    statut: data.status ?? undefined,
    source: data.source ?? null,
    url_offre: data.job_url ?? null,
    date_candidature: data.applied_at ?? null,
  };
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
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await axiosInstance.get<EtablissementApi[]>('/etablissements', { params });
    return response.data.map(mapEtablissementToOrganization);
  },
  getById: async (id: number) => {
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
  update: async (id: number, data: Partial<Organization>) => {
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
    const response = await axiosInstance.post(`/etablissements/${id}/merge`, {
      target_organization_id: targetOrganizationId,
    });
    return response.data;
  },
  split: async (id: number, data: Partial<Organization> & { move_contacts?: boolean }) => {
    const response = await axiosInstance.post<{ id: number }>(`/etablissements/${id}/split`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.delete(`/etablissements/${resolvedId}`);
    return response.data;
  },
};

export const contactService = {
  getAll: async (params?: { organization_id?: number }) => {
    const response = await axiosInstance.get<ContactApi[]>('/contacts', {
      params: {
        organization_id: params?.organization_id ? resolveOrganizationId(params.organization_id) : undefined,
      },
    });
    return response.data.map(mapContactApiToContact);
  },
  getById: async (id: number) => {
    const resolvedId = await ensureContactIdResolved(id);
    const response = await axiosInstance.get<ContactDetailsApi>(`/contacts/${resolvedId}`);
    return {
      ...mapContactApiToContact(response.data),
      organization: response.data.organization,
      applications: response.data.applications,
      events: response.data.events,
    };
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
  checkout: async () => {
    const response = await axiosInstance.post<{ mode: 'simulated' | 'stripe'; checkout_url: string | null; message?: string }>('/subscription/checkout');
    return response.data;
  },
  portal: async () => {
    const response = await axiosInstance.post<{ portal_url: string }>('/subscription/portal');
    return response.data;
  },
};

export const applicationService = {
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
};

export const dashboardService = {
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
  getCompany: async (id: number) => {
    const response = await axiosInstance.get(`/api/companies/${id}`);
    return response.data;
  },
};

export default axiosInstance;
