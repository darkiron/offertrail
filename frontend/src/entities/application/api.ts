import { http as axiosInstance } from '@shared/api/http';
import {
  applicationWorkspaceSchema,
  completeActionResponseSchema,
  todayDataSchema,
  workflowApplicationPageSchema,
  type CompleteActionPayload,
  type WorkflowApplicationListParams,
} from './model';

export const applicationApi = {
  list: async (params: WorkflowApplicationListParams) =>
    workflowApplicationPageSchema.parse(
      (await axiosInstance.get('/me/candidatures', { params })).data,
    ),
  workspace: async (id: string) => {
    return applicationWorkspaceSchema.parse(
      (await axiosInstance.get(`/me/candidatures/${id}/workspace`)).data,
    );
  },
  today: async () =>
    todayDataSchema.parse((await axiosInstance.get('/me/today')).data),
  completeAction: async (actionId: string, payload: CompleteActionPayload) =>
    completeActionResponseSchema.parse(
      (await axiosInstance.post(`/me/actions/${actionId}/complete`, payload))
        .data,
    ),
};
