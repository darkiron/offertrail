import axios from 'axios';
import type {
  Application,
  Organization,
  Contact,
  DashboardData,
  PaginatedResponse,
  MonthlyInsights,
  JobSearch,
  JobSource,
  JobBacklogItem,
  JobBacklogRun,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

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
    const response = await axiosInstance.patch(`/api/organizations/${id}`, data);
    return response.data;
  },
  merge: async (id: number, target_organization_id: number) => {
    const response = await axiosInstance.post(`/api/organizations/${id}/merge`, { target_organization_id });
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
    const response = await axiosInstance.post(`/api/applications/${applicationId}/link-contact`, { contact_id: contactId });
    return response.data;
  },
};

export const applicationService = {
  getApplications: async (params?: any) => {
    const response = await axiosInstance.get<PaginatedResponse<Application>>('/api/applications', { params });
    return response.data;
  },
  getApplication: async (id: number) => {
    const response = await axiosInstance.get<any>(`/api/applications/${id}`);
    return response.data;
  },
  createApplication: async (data: any) => {
    const response = await axiosInstance.post('/api/applications', data);
    return response.data;
  },
  updateApplication: async (id: number, data: any) => {
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
  addEvent: async (id: number, event_type: string) => {
    const response = await axiosInstance.post(`/api/applications/${id}/events`, { event_type });
    return response.data;
  },
  linkContact: async (appId: number, contactId: number) => {
    const response = await axiosInstance.post(`/api/applications/${appId}/link-contact`, { contact_id: contactId });
    return response.data;
  },
  createContact: async (appId: number, data: any) => {
    const response = await axiosInstance.post(`/api/applications/${appId}/create-contact`, data);
    return response.data;
  },
  importTsv: async (tsv: string) => {
    const response = await axiosInstance.post('/api/import', { tsv });
    return response.data;
  }
};

export const dashboardService = {
  getDashboardData: async (params?: any) => {
    const response = await axiosInstance.get<DashboardData>('/api/dashboard', { params });
    return response.data;
  },
  getMonthlyInsights: async (year?: number) => {
    const response = await axiosInstance.get<MonthlyInsights>('/api/insights/monthly-applications', { params: { year } });
    return response.data;
  },
};

export const jobBacklogService = {
  getSources: async () => {
    const response = await axiosInstance.get<JobSource[]>('/api/job-sources');
    return response.data;
  },
  createSource: async (data: Partial<JobSource> & { name: string; slug: string; kind: string }) => {
    const response = await axiosInstance.post<JobSource>('/api/job-sources', data);
    return response.data;
  },
  updateSource: async (id: number, data: Partial<JobSource>) => {
    const response = await axiosInstance.patch(`/api/job-sources/${id}`, data);
    return response.data;
  },
  deleteSource: async (id: number) => {
    const response = await axiosInstance.delete(`/api/job-sources/${id}`);
    return response.data;
  },
  getSearches: async () => {
    const response = await axiosInstance.get<JobSearch[]>('/api/job-searches');
    return response.data;
  },
  createSearch: async (data: Partial<JobSearch> & { keywords: string[] }) => {
    const response = await axiosInstance.post<JobSearch>('/api/job-searches', data);
    return response.data;
  },
  updateSearch: async (id: number, data: Partial<JobSearch>) => {
    const response = await axiosInstance.patch(`/api/job-searches/${id}`, data);
    return response.data;
  },
  deleteSearch: async (id: number) => {
    const response = await axiosInstance.delete(`/api/job-searches/${id}`);
    return response.data;
  },
  runSearch: async (id: number) => {
    const response = await axiosInstance.post<{
      run_id: number;
      fetched_count: number;
      created_count: number;
      imported_count: number;
      items: JobBacklogItem[];
    }>(`/api/job-searches/${id}/run`);
    return response.data;
  },
  getBacklog: async (params?: { search_id?: number; source_id?: number; status?: string }) => {
    const response = await axiosInstance.get<{ items: JobBacklogItem[]; runs: JobBacklogRun[] }>('/api/job-backlog', { params });
    return response.data;
  },
  importItem: async (itemId: number) => {
    const response = await axiosInstance.post<{ application_id: number; already_imported: boolean }>(`/api/job-backlog/${itemId}/import`);
    return response.data;
  },
};

// Lightweight named API for legacy components expecting `api.getCompany`
export const api = {
  getCompany: async (id: number) => {
    const response = await axiosInstance.get(`/api/companies/${id}`);
    return response.data;
  }
};

export default axiosInstance;
