import { http as axiosInstance } from '@shared/api/http';
import {
  adminCandidaturesDailySchema,
  adminMrrHistorySchema,
  adminPlanDistributionSchema,
  adminPromosResponseSchema,
  adminSignupsSchema,
  adminStatsSchema,
  adminUsersResponseSchema,
  type AdminUserPlanUpdate,
} from './model';

export const adminApi = {
  stats: async () =>
    adminStatsSchema.parse((await axiosInstance.get('/admin/stats')).data),
  users: async () =>
    adminUsersResponseSchema.parse(
      (await axiosInstance.get('/admin/users')).data,
    ),
  mrrHistory: async () =>
    adminMrrHistorySchema.parse(
      (await axiosInstance.get('/admin/analytics/mrr-history')).data,
    ),
  signups: async () =>
    adminSignupsSchema.parse(
      (await axiosInstance.get('/admin/analytics/signups')).data,
    ),
  planDistribution: async () =>
    adminPlanDistributionSchema.parse(
      (await axiosInstance.get('/admin/analytics/plan-distribution')).data,
    ),
  candidaturesDaily: async () =>
    adminCandidaturesDailySchema.parse(
      (await axiosInstance.get('/admin/analytics/candidatures-daily')).data,
    ),
  promos: async () =>
    adminPromosResponseSchema.parse(
      (await axiosInstance.get('/admin/promos')).data,
    ).promos,
  updateUserPlan: async (userId: string, update: AdminUserPlanUpdate) => {
    await axiosInstance.patch(`/admin/users/${userId}/status`, update);
  },
  toggleUserActive: async (userId: string) => {
    await axiosInstance.patch(`/admin/users/${userId}/toggle-active`);
  },
  exportUsersCsv: async () => {
    const res = await axiosInstance.get<Blob>('/admin/export-users', {
      responseType: 'blob',
    });
    return res.data;
  },
};
