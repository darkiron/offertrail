import { http as axiosInstance } from '@shared/api/http';

export const dashboardService = {
  completeAction: async (
    actionId: string,
    payload: {
      outcome: string;
      note?: string;
      next_action?: { due_at: string; channel?: string } | null;
    },
  ) => {
    const response = await axiosInstance.post(
      `/me/actions/${actionId}/complete`,
      payload,
    );
    return response.data;
  },
};
