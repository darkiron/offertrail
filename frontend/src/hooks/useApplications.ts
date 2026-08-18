import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePaginatedListing } from './useListingController';
import { applicationService, organizationService } from '../services/api';

interface UseApplicationsOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  showHidden?: boolean;
}

export function useWorkflowApplications(params: import('../services/api').WorkflowApplicationListParams) {
  return usePaginatedListing(
    ['workflow-applications', params],
    () => applicationService.getWorkflowApplications(params),
  );
}

export function useApplications({
  search = '',
  status = '',
  page = 1,
  limit = 20,
  showHidden = false,
}: UseApplicationsOptions = {}) {
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

  const orgMap = useMemo(
    () => new Map((orgsQuery.data ?? []).map((o) => [o.id, o])),
    [orgsQuery.data],
  );

  const filtered = useMemo(() => {
    let items = appsQuery.data?.items ?? [];

    // Filtre refusée : masquée par défaut, visible si showHidden ou filtre statut = refusee
    if (!showHidden && status !== 'refusee') {
      items = items.filter((item) => item.status !== 'refusee');
    }

    // Filtre statut
    if (status) {
      items = items.filter((item) => item.status === status);
    }

    // Filtre recherche (company + title)
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      items = items.filter((item) => {
        const organization = item.organization_id ? orgMap.get(item.organization_id) : null;
        const finalCustomer = item.final_customer_organization_id ? orgMap.get(item.final_customer_organization_id) : null;
        return [
          item.company,
          item.title,
          item.source,
          item.type,
          item.status,
          item.applied_at,
          item.next_followup_at,
          item.final_customer_name,
          organization?.name,
          organization?.city,
          finalCustomer?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      });
    }

    return items;
  }, [appsQuery.data, showHidden, status, search, orgMap]);

  // Pagination client-side
  const paginatedApps = useMemo(
    () => filtered.slice((page - 1) * limit, page * limit),
    [filtered, page, limit],
  );

  return {
    apps: paginatedApps,
    total: filtered.length,
    organizations: orgsQuery.data ?? [],
    orgMap,
    loading: appsQuery.isLoading,
    isFirstLoad: appsQuery.isLoading && !appsQuery.data,
    error: appsQuery.error,
    refetch: appsQuery.refetch,
  };
}
