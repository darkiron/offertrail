import { useQuery } from '@tanstack/react-query';
import { organizationService } from '../services/api';

export function useOrganizations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    organizations: data ?? [],
    loading: isLoading,
    error,
    refetch,
  };
}
