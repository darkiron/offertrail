export interface DashboardModel {
  totalApps: number;
  activeApps: number;
  rejections: number;
  interviews: number;
  responseRate: number;
  monthlyStats: { month: string; count: number }[];
  followups: any[];
}

export const mapDashboardDtoToModel = (dto: any): DashboardModel => {
  return {
    totalApps: dto.kpis?.total_count || 0,
    activeApps: dto.kpis?.active_count || 0,
    rejections: dto.kpis?.rejected_count || 0,
    interviews: dto.kpis?.responded_count || 0, // Assuming responded means interview for now if not explicit
    responseRate: dto.kpis?.response_rate || 0,
    monthlyStats: (dto.monthly_kpis || []).map((m: any) => ({
      month: m.month,
      count: m.count,
    })),
    followups: dto.followups || [],
  };
};
