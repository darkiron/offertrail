import axios from 'axios';
import type {Application, DashboardData, PaginatedResponse, MonthlyInsights} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const httpClient = axios.create({
  baseURL: API_URL,
});

export const applicationService = {
  getApplications: async (params?: any) => {
    const response = await httpClient.get<PaginatedResponse<Application>>('/api/applications', { params });
    return response.data;
  },
  getApplication: async (id: number) => {
    const response = await httpClient.get<any>(`/api/applications/${id}`);
    return response.data;
  },
  createApplication: async (data: any) => {
    const response = await httpClient.post('/api/applications', data);
    return response.data;
  },
  updateApplication: async (id: number, data: any) => {
    const response = await httpClient.patch(`/api/applications/${id}`, data);
    return response.data;
  },
  addNote: async (id: number, text: string) => {
    const response = await httpClient.post(`/api/applications/${id}/notes`, { text });
    return response.data;
  },
  markFollowup: async (id: number) => {
    const response = await httpClient.post(`/api/applications/${id}/followup`);
    return response.data;
  },
  recordResponse: async (id: number) => {
    const response = await httpClient.post(`/api/applications/${id}/response`);
    return response.data;
  },
  addEvent: async (id: number, event_type: string) => {
    const response = await httpClient.post(`/api/applications/${id}/events`, { event_type });
    return response.data;
  },
  linkContact: async (appId: number, contactId: number) => {
    const response = await httpClient.post(`/api/applications/${appId}/link-contact`, { contact_id: contactId });
    return response.data;
  },
  createContact: async (appId: number, data: any) => {
    const response = await httpClient.post(`/api/applications/${appId}/create-contact`, data);
    return response.data;
  },
  importTsv: async (tsv: string) => {
    const response = await httpClient.post('/api/import', { tsv });
    return response.data;
  }
};

export const companyService = {
  getCompanies: async (params?: any) => {
    // Standardize to use /api/companies which is the standard JSON endpoint
    const response = await httpClient.get<any[]>('/api/companies', { params });
    return response.data;
  },
  getCompany: async (id: number) => {
    const response = await httpClient.get<any>(`/api/companies/${id}`);
    return response.data;
  },
  searchCompanies: async (q: string) => {
    const response = await httpClient.get<any[]>('/companies/search', { params: { q } });
    return response.data;
  },
  updateCompany: async (id: number, data: any) => {
    const response = await httpClient.put(`/api/companies/${id}`, data);
    return response.data;
  }
};

export const dashboardService = {
  getDashboardData: async (params?: any) => {
    const response = await httpClient.get<DashboardData>('/api/dashboard', { params });
    return response.data;
  },
  getMonthlyInsights: async (year?: number) => {
    const response = await httpClient.get<MonthlyInsights>('/api/insights/monthly-applications', { params: { year } });
    return response.data;
  },
};

export const api = {
  ...applicationService,
  ...companyService,
  ...dashboardService,
};
