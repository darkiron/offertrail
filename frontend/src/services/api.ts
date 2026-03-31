import axios from 'axios';
import type {
  Application,
  AuthResponse,
  Contact,
  DashboardData,
  LoginCredentials,
  MonthlyInsights,
  Organization,
  PaginatedResponse,
  RegisterPayload,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const AUTH_STORAGE_KEY = 'offertrail.auth.token';

export interface ApplicationListParams {
  status?: string;
  type?: string;
  source?: string;
  search?: string;
  show_hidden?: boolean;
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

export const axiosInstance = axios.create({
  baseURL: API_URL,
});

export function setAuthToken(token: string | null): void {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

const initialToken = localStorage.getItem(AUTH_STORAGE_KEY);
if (initialToken) {
  setAuthToken(initialToken);
}

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_STORAGE_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
};

export const organizationService = {
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await axiosInstance.get<Organization[]>('/api/organizations', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await axiosInstance.get<Organization>(`/api/organizations/${id}`);
    return response.data;
  },
  create: async (data: Partial<Organization>) => {
    const response = await axiosInstance.post<{ id: number }>('/api/organizations', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Organization>) => {
    const response = await axiosInstance.patch('/api/organizations/' + id, data);
    return response.data;
  },
  merge: async (id: number, targetOrganizationId: number) => {
    const response = await axiosInstance.post(`/api/organizations/${id}/merge`, {
      target_organization_id: targetOrganizationId,
    });
    return response.data;
  },
  split: async (id: number, data: Partial<Organization> & { move_contacts?: boolean }) => {
    const response = await axiosInstance.post<{ id: number }>(`/api/organizations/${id}/split`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/api/organizations/${id}`);
    return response.data;
  },
};

export const contactService = {
  getAll: async (params?: { organization_id?: number }) => {
    const response = await axiosInstance.get<Contact[]>('/api/contacts', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await axiosInstance.get<Contact>(`/api/contacts/${id}`);
    return response.data;
  },
  create: async (data: Partial<Contact>) => {
    const response = await axiosInstance.post<{ id: number }>('/api/contacts', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Contact>) => {
    const response = await axiosInstance.patch(`/api/contacts/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await axiosInstance.delete(`/api/contacts/${id}`);
    return response.data;
  },
  linkToApplication: async (contactId: number, applicationId: number) => {
    const response = await axiosInstance.post(`/api/applications/${applicationId}/link-contact`, {
      contact_id: contactId,
    });
    return response.data;
  },
};

export const applicationService = {
  getApplications: async (params?: ApplicationListParams) => {
    const response = await axiosInstance.get<PaginatedResponse<Application>>('/api/applications', { params });
    return response.data;
  },
  getApplication: async (id: number) => {
    const response = await axiosInstance.get<ApplicationDetailsResponse>(`/api/applications/${id}`);
    return response.data;
  },
  createApplication: async (data: ApplicationPayload) => {
    const response = await axiosInstance.post('/api/applications', data);
    return response.data;
  },
  updateApplication: async (id: number, data: ApplicationPayload) => {
    const response = await axiosInstance.patch(`/api/applications/${id}`, data);
    return response.data;
  },
  addNote: async (id: number, text: string) => {
    const response = await axiosInstance.post(`/api/applications/${id}/notes`, { text });
    return response.data;
  },
  markFollowup: async (id: number) => {
    const response = await axiosInstance.post(`/api/applications/${id}/followup`);
    return response.data;
  },
  addEvent: async (id: number, eventType: string) => {
    const response = await axiosInstance.post(`/api/applications/${id}/events`, { event_type: eventType });
    return response.data;
  },
  linkContact: async (appId: number, contactId: number) => {
    const response = await axiosInstance.post(`/api/applications/${appId}/link-contact`, { contact_id: contactId });
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
    const response = await axiosInstance.post(`/api/applications/${appId}/create-contact`, data);
    return response.data;
  },
  importTsv: async (tsv: string) => {
    const response = await axiosInstance.post<ImportResponse>('/api/import', { tsv });
    return response.data;
  },
};

export const dashboardService = {
  getDashboardData: async (params?: DashboardParams) => {
    const response = await axiosInstance.get<DashboardData>('/api/dashboard', { params });
    return response.data;
  },
  getMonthlyInsights: async (year?: number) => {
    const response = await axiosInstance.get<MonthlyInsights>('/api/insights/monthly-applications', {
      params: { year },
    });
    return response.data;
  },
};

export const api = {
  getCompany: async (id: number) => {
    const response = await axiosInstance.get(`/api/companies/${id}`);
    return response.data;
  },
};

export default axiosInstance;
