import type { Application, PaginatedResponse } from '../../types';
import { http as axiosInstance } from '@shared/api/http';
import { contactService } from './contacts';
import type {
  ApplicationDetailsResponse,
  ApplicationListParams,
  ApplicationPayload,
  CandidatureApi,
  EventApi,
  EventUpdatePayload,
  ImportResponse,
  RelanceApi,
} from './contracts';
import {
  fetchEtablissementsIndex,
  mapCandidatureToApplication,
  mapEtablissementToOrganization,
  mapPayloadToSaas,
} from './mappers';
import { workflowApplicationService } from './workflow-applications';

export const applicationService = {
  ...workflowApplicationService,
  getApplications: async (params?: ApplicationListParams) => {
    const etablissementIndex = await fetchEtablissementsIndex();
    const response = await axiosInstance.get<CandidatureApi[]>(
      '/candidatures',
      { params },
    );
    const items = response.data.map((item) =>
      mapCandidatureToApplication(
        item,
        etablissementIndex.get(item.etablissement_id),
        item.client_final_id
          ? (etablissementIndex.get(item.client_final_id) ?? null)
          : null,
      ),
    );
    return {
      items,
      total: items.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? items.length,
    } satisfies PaginatedResponse<Application>;
  },
  getApplication: async (id: string) => {
    const etablissementIndex = await fetchEtablissementsIndex();
    const candidatureResponse = await axiosInstance.get<CandidatureApi>(
      `/candidatures/${id}`,
    );
    const historyResponse = await axiosInstance.get<EventApi[]>(
      `/candidatures/${id}/events`,
    );
    const candidature = candidatureResponse.data;
    const etablissement =
      etablissementIndex.get(candidature.etablissement_id) ?? null;
    const finalCustomer = candidature.client_final_id
      ? (etablissementIndex.get(candidature.client_final_id) ?? null)
      : null;
    const application = mapCandidatureToApplication(
      candidature,
      etablissement ?? undefined,
      finalCustomer,
    );

    const contactsResponse = await contactService.getAll({
      organization_id: etablissement ? etablissement.id : undefined,
    });

    return {
      application,
      organization: etablissement
        ? {
            id: etablissement.id,
            organization_id: etablissement.id,
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
      final_customer_organization: finalCustomer
        ? mapEtablissementToOrganization(finalCustomer)
        : null,
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
  updateApplication: async (id: string, data: ApplicationPayload) => {
    const payload = mapPayloadToSaas(data);
    const response = await axiosInstance.patch(`/candidatures/${id}`, payload);
    return response.data;
  },
  addNote: async (id: string, text: string) => {
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: id,
      type: 'note_ajout',
      contenu: text,
    });
    return response.data;
  },
  markFollowup: async (id: string) => {
    const relances = await axiosInstance.get<RelanceApi[]>('/relances');
    const target = relances.data.find(
      (item) => item.candidature_id === id && item.statut === 'a_faire',
    );
    if (!target) {
      return { success: true };
    }
    const response = await axiosInstance.patch(`/relances/${target.id}`, {
      statut: 'faite',
      date_effectuee: new Date().toISOString(),
    });
    return response.data;
  },
  addEvent: async (id: string, eventType: string) => {
    const eventTypeMap: Record<string, string> = {
      RESPONSE_RECEIVED: 'note_ajout',
    };
    const contentMap: Record<string, string> = {
      RESPONSE_RECEIVED: 'Reponse recue',
    };
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: id,
      type: eventTypeMap[eventType] ?? eventType.toLowerCase(),
      contenu: contentMap[eventType] ?? eventType,
    });
    return response.data;
  },
  linkContact: async (appId: string, contactId: string) => {
    const response = await contactService.linkToApplication(contactId, appId);
    return response.data;
  },
  createContact: async (
    appId: string,
    data: {
      first_name?: string;
      last_name?: string;
      email?: string | null;
      phone?: string | null;
      organization_id?: string | null;
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
    const response = await axiosInstance.post<ImportResponse>('/api/import', {
      tsv,
    });
    return response.data;
  },
  updateEvent: async (eventId: string, data: EventUpdatePayload) => {
    const response = await axiosInstance.patch(
      `/candidature-events/${eventId}`,
      data,
    );
    return response.data;
  },
  deleteEvent: async (eventId: string) => {
    await axiosInstance.delete(`/candidature-events/${eventId}`);
  },
};

export type {
  ApplicationListParams,
  ApplicationPayload,
  ApplicationWorkspace,
  EventUpdatePayload,
  ImportResponse,
} from './contracts';
