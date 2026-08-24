import type { DashboardData, TodayData } from '../../types';
import { applicationService } from './applications';
import { axiosInstance } from './client';
import type {
  CandidatureApi,
  DashboardParams,
  MeStatsApi,
  RelanceApi,
} from './contracts';
import { resolveCandidatureId } from './identifiers';

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
  getDashboardData: async (params?: DashboardParams) => {
    const [statsResponse, relancesResponse, applicationsResponse] =
      await Promise.all([
        axiosInstance.get<MeStatsApi>('/me/stats', { params }),
        axiosInstance.get<RelanceApi[]>('/me/relances/dues'),
        applicationService.getApplications(),
      ]);

    const stats = statsResponse.data;
    const followups = applicationsResponse.items.filter((item) =>
      relancesResponse.data.some(
        (relance) => resolveCandidatureId(item.id) === relance.candidature_id,
      ),
    );

    return {
      kpis: {
        total_count: stats.total_candidatures,
        active_count: stats.pipeline_actif,
        due_followups: stats.relances_dues,
        rejected_rate: stats.taux_refus,
        rejected_count: Math.round(
          (stats.total_candidatures * stats.taux_refus) / 100,
        ),
        response_rate: stats.taux_reponse,
        responded_count: Math.round(
          (stats.total_candidatures * stats.taux_reponse) / 100,
        ),
        avg_response_time:
          stats.temps_moyen_reponse ?? stats.delai_moyen_reponse,
      },
      monthly_kpis: {
        created: stats.total_candidatures,
        responses: Math.round(
          (stats.total_candidatures * stats.taux_reponse) / 100,
        ),
        rejected: Math.round(
          (stats.total_candidatures * stats.taux_refus) / 100,
        ),
        followups_due: stats.relances_dues,
      },
      sources: [],
      followups,
    } satisfies DashboardData;
  },
  getMonthlyInsights: async (year?: number) => {
    const targetYear = year ?? new Date().getFullYear();
    const response = await axiosInstance.get<CandidatureApi[]>('/candidatures');
    const monthCounts = new Array<number>(12).fill(0);
    response.data.forEach((item) => {
      const rawDate = item.date_candidature ?? item.created_at;
      if (!rawDate) {
        return;
      }
      const parsed = new Date(rawDate);
      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.getFullYear() !== targetYear
      ) {
        return;
      }
      monthCounts[parsed.getMonth()] += 1;
    });
    const monthLabels = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return {
      year: targetYear,
      months: monthLabels.map((month, index) => ({
        month,
        count: monthCounts[index],
      })),
    };
  },
};

export type { DashboardParams } from './contracts';
