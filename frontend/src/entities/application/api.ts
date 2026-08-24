import { http as axiosInstance } from '@shared/api/http';
import { ensureCandidatureIdResolved } from '../../services/api/identifiers';
import {
  applicationWorkspaceSchema,
  todayDataSchema,
  workflowApplicationPageSchema,
  type WorkflowApplicationListParams,
} from './model';

export const applicationApi = {
  list: async (params: WorkflowApplicationListParams) =>
    workflowApplicationPageSchema.parse(
      (await axiosInstance.get('/me/candidatures', { params })).data,
    ),
  workspace: async (id: string) => {
    const resolvedId = await ensureCandidatureIdResolved(id);
    return applicationWorkspaceSchema.parse(
      (await axiosInstance.get(`/me/candidatures/${resolvedId}/workspace`))
        .data,
    );
  },
  today: async () =>
    todayDataSchema.parse((await axiosInstance.get('/me/today')).data),
};
