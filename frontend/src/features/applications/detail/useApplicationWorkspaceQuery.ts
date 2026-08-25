import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '@entities/application/api';
import { applicationKeys } from '@entities/application/queryKeys';

export function useApplicationWorkspaceQuery(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => applicationApi.workspace(id!),
    enabled: Boolean(id),
  });
}
