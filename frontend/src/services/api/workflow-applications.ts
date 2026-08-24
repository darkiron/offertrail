import { axiosInstance } from './client';
import type {
  ApplicationWorkspace,
  CandidatureApi,
  WorkflowApplicationListParams,
  WorkflowApplicationPage,
} from './contracts';
import { ensureCandidatureIdResolved } from './identifiers';

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
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.get<ApplicationWorkspace>(
      `/me/candidatures/${candidatureId}/workspace`,
    );
    return response.data;
  },
  updateWorkflowStatus: async (id: string, status: string) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.patch(
      `/me/candidatures/${candidatureId}/status`,
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
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.post('/candidature-events', {
      candidature_id: candidatureId,
      type: 'note_ajout',
      contenu: content,
    });
    return response.data;
  },
  scheduleWorkflowAction: async (
    id: string,
    payload: { due_at: string; channel?: string; note?: string },
  ) => {
    const candidatureId = await ensureCandidatureIdResolved(id);
    const response = await axiosInstance.post(
      `/me/candidatures/${candidatureId}/actions`,
      payload,
    );
    return response.data;
  },
};
