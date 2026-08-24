import type { TodayData } from '../../types';
import { axiosInstance } from './client';

export const dashboardService = {
  getToday: async () => {
    const response = await axiosInstance.get<TodayData>('/me/today');
    return response.data;
  },
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
