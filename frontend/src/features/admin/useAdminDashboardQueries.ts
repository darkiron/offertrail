import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/api';
import { adminKeys } from '@entities/admin/queryKeys';

export function useAdminStatsQuery() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminApi.stats,
  });
}

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: adminApi.users,
  });
}

export function useAdminMrrHistoryQuery() {
  return useQuery({
    queryKey: adminKeys.mrrHistory(),
    queryFn: adminApi.mrrHistory,
  });
}

export function useAdminSignupsQuery() {
  return useQuery({
    queryKey: adminKeys.signups(),
    queryFn: adminApi.signups,
  });
}

export function useAdminPlanDistributionQuery() {
  return useQuery({
    queryKey: adminKeys.planDistribution(),
    queryFn: adminApi.planDistribution,
  });
}

export function useAdminCandidaturesDailyQuery() {
  return useQuery({
    queryKey: adminKeys.candidaturesDaily(),
    queryFn: adminApi.candidaturesDaily,
  });
}

export function useAdminPromosQuery() {
  return useQuery({
    queryKey: adminKeys.promos(),
    queryFn: adminApi.promos,
  });
}
