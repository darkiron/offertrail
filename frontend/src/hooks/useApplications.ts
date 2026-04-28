import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationService, organizationService } from '../services/api';

interface UseApplicationsOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  showHidden?: boolean;
}

export function useApplications({
  search = '',
  status = '',
  page = 1,
  limit = 20,
  showHidden = false,
}: UseApplicationsOptions = {}) {
  const appsQuery = useQuery({
    queryKey: ['applications', { search, status, page, limit }],
    queryFn: () => applicationService.getApplications({ search, status, page, limit }),
  });

  const orgsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const apps = useMemo(() => {
    const items = appsQuery.data?.items ?? [];
    const includeRejected = showHidden || status === 'refusee';
    return includeRejected ? items : items.filter((item) => item.status !== 'refusee');
  }, [appsQuery.data, showHidden, status]);

  const orgMap = useMemo(
    () => new Map((orgsQuery.data ?? []).map((o) => [o.id, o])),
    [orgsQuery.data],
  );

  return {
    apps,
    total: apps.length,
    organizations: orgsQuery.data ?? [],
    orgMap,
    loading: appsQuery.isLoading,
    error: appsQuery.error,
    refetch: appsQuery.refetch,
  };
}
