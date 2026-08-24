import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '@entities/application/api';
import { applicationKeys } from '@entities/application/queryKeys';
import type { WorkflowApplicationListParams } from '@entities/application/model';

export function useApplicationsQuery(params: WorkflowApplicationListParams) {
  return useQuery({
    queryKey: applicationKeys.list(params),
    queryFn: () => applicationApi.list(params),
  });
}
