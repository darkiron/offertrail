import type { Contact, ContactDetails } from '../../types';
import { http as axiosInstance } from '@shared/api/http';
import type {
  ContactApi,
  ContactDetailsApi,
  ContactPortfolioPage,
} from './contracts';
import { resolveCandidatureId, resolveOrganizationId } from './identifiers';
import { mapContactApiToContact } from './mappers';

export const contactService = {
  getPortfolio: async (params: {
    page: number;
    per_page: number;
    q?: string;
    view?: string;
  }) => {
    const response = await axiosInstance.get<ContactPortfolioPage>(
      '/me/contacts',
      { params },
    );
    return response.data;
  },
  getAll: async (params?: { organization_id?: number }) => {
    const response = await axiosInstance.get<ContactApi[]>('/contacts', {
      params: {
        organization_id: params?.organization_id
          ? resolveOrganizationId(params.organization_id)
          : undefined,
      },
    });
    return response.data.map(mapContactApiToContact);
  },
  getById: async (id: string) => {
    const response = await axiosInstance.get<ContactDetailsApi>(
      `/contacts/${id}`,
    );
    return {
      ...mapContactApiToContact(response.data),
      organization: response.data.organization,
      applications: response.data.applications.map((application) => ({
        id: String(application.id),
        title: application.title,
        company:
          application.company ??
          response.data.organization?.name ??
          'Entreprise',
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
      organization_id: data.organization_id
        ? resolveOrganizationId(data.organization_id)
        : null,
    });
    return { id: response.data.id };
  },
  update: async (id: string, data: Partial<Contact>) => {
    const response = await axiosInstance.patch(`/contacts/${id}`, {
      ...data,
      organization_id: data.organization_id
        ? resolveOrganizationId(data.organization_id)
        : null,
    });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/contacts/${id}`);
    return response.data;
  },
  linkToApplication: async (contactId: string, applicationId: number) => {
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: resolveCandidatureId(applicationId),
      type: 'contact_ajout',
      contenu: `Contact lie: ${contactId}`,
    });
    return response.data;
  },
};

export type { ContactPortfolioPage } from './contracts';
