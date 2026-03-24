import axios from 'axios';
import type {Application, Organization, Contact, DashboardData, PaginatedResponse, MonthlyInsights} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const organizationService = {
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await api.get<Organization[]>('/api/organizations', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Organization>(`/api/organizations/${id}`);
    return response.data;
  },
  create: async (data: Partial<Organization>) => {
    const response = await api.post<{ id: number }>('/api/organizations', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Organization>) => {
    const response = await api.patch(`/api/organizations/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/api/organizations/${id}`);
    return response.data;
  },
};

export const contactService = {
  getAll: async (params?: { organization_id?: number }) => {
    const response = await api.get<Contact[]>('/api/contacts', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<Contact>(`/api/contacts/${id}`);
    return response.data;
  },
  create: async (data: Partial<Contact>) => {
    const response = await api.post<{ id: number }>('/api/contacts', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Contact>) => {
    const response = await api.patch(`/api/contacts/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/api/contacts/${id}`);
    return response.data;
  },
  linkToApplication: async (contactId: number, applicationId: number) => {
    const response = await api.post(`/api/applications/${applicationId}/link-contact`, { contact_id: contactId });
    return response.data;
  },
};

export const applicationService = {
  getApplications: async (params?: any) => {
    const response = await api.get<PaginatedResponse<Application>>('/api/applications', { params });
    return response.data;
  },
  getApplication: async (id: number) => {
    const response = await api.get<any>(`/api/applications/${id}`);
    return response.data;
  },
  createApplication: async (data: any) => {
    const response = await api.post('/api/applications', data);
    return response.data;
  },
  updateApplication: async (id: number, data: any) => {
    const response = await api.patch(`/api/applications/${id}`, data);
    return response.data;
  },
  addNote: async (id: number, text: string) => {
    const response = await api.post(`/api/applications/${id}/notes`, { text });
    return response.data;
  },
  markFollowup: async (id: number) => {
    const response = await api.post(`/api/applications/${id}/followup`);
    return response.data;
  },
  addEvent: async (id: number, event_type: string) => {
    const response = await api.post(`/api/applications/${id}/events`, { event_type });
    return response.data;
  },
  linkContact: async (appId: number, contactId: number) => {
    const response = await api.post(`/api/applications/${appId}/link-contact`, { contact_id: contactId });
    return response.data;
  },
  createContact: async (appId: number, data: any) => {
    const response = await api.post(`/api/applications/${appId}/create-contact`, data);
    return response.data;
  },
  importTsv: async (tsv: string) => {
    const response = await api.post('/api/import', { tsv });
    return response.data;
  }
};

export const dashboardService = {
  getDashboardData: async (params?: any) => {
    const response = await api.get<DashboardData>('/api/dashboard', { params });
    return response.data;
  },
  getMonthlyInsights: async (year?: number) => {
    const response = await api.get<MonthlyInsights>('/api/insights/monthly-applications', { params: { year } });
    return response.data;
  },
};
