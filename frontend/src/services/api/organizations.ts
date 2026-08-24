import type { Organization } from '../../types';
import { axiosInstance } from './client';
import type {
  EtablissementApi,
  OrganizationDetails,
  OrganizationPortfolioPage,
  OrganizationWorkspace,
  WorkflowOrganization,
} from './contracts';
import {
  ensureOrganizationIdResolved,
  toLegacyContactId,
  toLegacyId,
  toLegacyOrganizationId,
} from './identifiers';
import {
  mapEtablissementToOrganization,
  normalizeOrganizationType,
} from './mappers';

export const organizationService = {
  getPortfolio: async (params?: {
    page?: number;
    per_page?: number;
    q?: string;
    relationship_role?: string;
    sort?: string;
  }) => {
    const response = await axiosInstance.get<OrganizationPortfolioPage>(
      '/me/etablissements',
      { params },
    );
    return response.data;
  },
  getWorkspace: async (id: string) => {
    const response = await axiosInstance.get<OrganizationWorkspace>(
      `/me/etablissements/${id}/workspace`,
    );
    return response.data;
  },
  getWorkflowAll: async () => {
    const response =
      await axiosInstance.get<WorkflowOrganization[]>('/etablissements');
    return response.data;
  },
  searchWorkflow: async (query: string) => {
    const response = await axiosInstance.get<WorkflowOrganization[]>(
      '/etablissements',
      { params: { q: query, limit: 10 } },
    );
    return response.data;
  },
  createWorkflow: async (payload: { nom: string; type: string }) => {
    const response = await axiosInstance.post<WorkflowOrganization>(
      '/etablissements',
      payload,
    );
    return response.data;
  },
  updateWorkflow: async (
    id: string,
    payload: {
      nom: string;
      type: string;
      site_web: string | null;
      description: string | null;
    },
  ) => {
    const response = await axiosInstance.patch<EtablissementApi>(
      `/etablissements/${id}`,
      payload,
    );
    return response.data;
  },
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await axiosInstance.get<EtablissementApi[]>(
      '/etablissements',
      {
        params: {
          type: params?.type,
          q: params?.search,
          limit: params?.search ? 10 : undefined,
        },
      },
    );
    return response.data.map(mapEtablissementToOrganization);
  },
  getById: async (id: number | string) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.get<EtablissementApi>(
      `/etablissements/${resolvedId}`,
    );
    return mapEtablissementToOrganization(response.data);
  },
  create: async (data: Partial<Organization>) => {
    const response = await axiosInstance.post<EtablissementApi>(
      '/etablissements',
      {
        nom: data.name,
        type: data.type ?? 'AUTRE',
        site_web: data.website ?? null,
        description: data.notes ?? null,
      },
    );
    const mapped = mapEtablissementToOrganization(response.data);
    return { id: mapped.id };
  },
  update: async (id: number | string, data: Partial<Organization>) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.patch(
      `/etablissements/${resolvedId}`,
      {
        nom: data.name,
        type: data.type,
        site_web: data.website ?? null,
        description: data.notes ?? null,
      },
    );
    return mapEtablissementToOrganization(response.data);
  },
  merge: async (id: number, targetOrganizationId: number) => {
    const sourceId = await ensureOrganizationIdResolved(id);
    const targetId = await ensureOrganizationIdResolved(targetOrganizationId);
    const response = await axiosInstance.post(
      `/etablissements/${sourceId}/merge`,
      {
        target_organization_id: targetId,
      },
    );
    return response.data;
  },
  split: async (
    id: number,
    data: Partial<Organization> & { move_contacts?: boolean },
  ) => {
    const sourceId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.post<{ id: number }>(
      `/etablissements/${sourceId}/split`,
      {
        name: data.name,
        type: data.type,
        website: data.website ?? null,
        notes: data.notes ?? null,
        move_contacts: data.move_contacts,
      },
    );
    return response.data;
  },
  delete: async (id: number) => {
    const resolvedId = await ensureOrganizationIdResolved(id);
    const response = await axiosInstance.delete(
      `/etablissements/${resolvedId}`,
    );
    return response.data;
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

export type {
  OrganizationDetails,
  OrganizationPortfolioItem,
  OrganizationPortfolioPage,
  OrganizationWorkspace,
  WorkflowOrganization,
} from './contracts';
