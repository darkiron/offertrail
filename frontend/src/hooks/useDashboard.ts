import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService, applicationService, organizationService, subscriptionService } from '../services/api';

interface UseDashboardOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  showHidden?: boolean;
}

export function useDashboard({
  search = '',
  status = '',
  page = 1,
  limit = 10,
  showHidden = false,
}: UseDashboardOptions = {}) {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboardData(),
  });

  // Clé stable — le backend ne pagine pas côté serveur, on récupère tout une fois.
  const appsQuery = useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 2 * 60 * 1000,
  });

  const orgsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const subQuery = useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionService.getMe(),
    staleTime: 60 * 1000,
  });

  const insightsQuery = useQuery({
    queryKey: ['insights'],
    queryFn: () => dashboardService.getMonthlyInsights(),
    enabled: false,
  });

  const filtered = useMemo(() => {
    let items = appsQuery.data?.items ?? [];

    if (!showHidden && status !== 'refusee') {
      items = items.filter((item) => item.status !== 'refusee');
    }

    if (status) {
      items = items.filter((item) => item.status === status);
    }

    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      items = items.filter(
        (item) =>
          item.company.toLowerCase().includes(needle) ||
          item.title.toLowerCase().includes(needle),
      );
    }

    return items;
  }, [appsQuery.data, showHidden, status, search]);

  // Pagination client-side
  const paginatedApps = useMemo(
    () => filtered.slice((page - 1) * limit, page * limit),
    [filtered, page, limit],
  );

  const orgMap = useMemo(
    () => new Map((orgsQuery.data ?? []).map((o) => [o.id, o])),
    [orgsQuery.data],
  );

  const markFollowupMutation = useMutation({
    mutationFn: (id: number) => applicationService.markFollowup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const loadInsights = () => insightsQuery.refetch();

  return {
    dashboardData: dashboardQuery.data ?? null,
    kpis: dashboardQuery.data?.kpis ?? {
      total_count: 0, active_count: 0, due_followups: 0,
      rejected_rate: 0, rejected_count: 0, response_rate: 0,
      responded_count: 0, avg_response_time: null,
    },
    followups: dashboardQuery.data?.followups ?? [],
    apps: paginatedApps,
    total: filtered.length,
    orgMap,
    sub: subQuery.data ?? null,
    insights: insightsQuery.data ?? null,
    loading: dashboardQuery.isLoading || appsQuery.isLoading,
    isFirstLoad: (dashboardQuery.isLoading && !dashboardQuery.data) || (appsQuery.isLoading && !appsQuery.data),
    loadingInsights: insightsQuery.isFetching,
    error: dashboardQuery.error ?? appsQuery.error,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
    markFollowup: markFollowupMutation.mutateAsync,
    loadInsights,
  };
}
