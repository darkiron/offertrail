import { http as axiosInstance } from '@shared/api/http';
import type {
  ApplicationWorkspace,
  CandidatureApi,
  WorkflowApplicationListParams,
  WorkflowApplicationPage,
} from './contracts';

export const workflowApplicationService = {
  createWorkflowApplication: async (payload: {
    etablissement_id: string;
    client_final_id?: string | null;
    poste: string;
    statut: string;
    date_candidature?: string | null;
    source?: string | null;
    url_offre?: string | null;
    type_contrat?: string | null;
  }) => {
    const response = await axiosInstance.post<CandidatureApi>(
      '/me/candidatures',
      payload,
    );
    return response.data;
  },
  getWorkflowApplications: async (params: WorkflowApplicationListParams) => {
    const response = await axiosInstance.get<WorkflowApplicationPage>(
      '/me/candidatures',
      { params },
    );
    return response.data;
  },
  getWorkspace: async (id: string) => {
    const response = await axiosInstance.get<ApplicationWorkspace>(
      `/me/candidatures/${id}/workspace`,
    );
    return response.data;
  },
  updateWorkflowStatus: async (id: string, status: string) => {
    const response = await axiosInstance.patch(
      `/me/candidatures/${id}/status`,
      { status },
    );
    return response.data;
  },
  updateWorkflowDetails: async (
    id: string,
    payload: Partial<CandidatureApi>,
  ) => {
    const response = await axiosInstance.patch<CandidatureApi>(
      `/candidatures/${id}`,
      payload,
    );
    return response.data;
  },
  addWorkflowNote: async (id: string, content: string) => {
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: id,
      type: 'note_ajout',
      contenu: content,
    });
    return response.data;
  },
  scheduleWorkflowAction: async (
    id: string,
    payload: { due_at: string; channel?: string; note?: string },
  ) => {
    const response = await axiosInstance.post(
      `/me/candidatures/${id}/actions`,
      payload,
    );
    return response.data;
  },
};
