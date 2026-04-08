import { useQuery } from '@tanstack/react-query';
import { contactService } from '../services/api';

export function useContacts(options?: { organization_id?: number }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contacts', options],
    queryFn: () => contactService.getAll(options),
    staleTime: 2 * 60 * 1000,
  });

  return {
    contacts: data ?? [],
    loading: isLoading,
    error,
    refetch,
  };
}
