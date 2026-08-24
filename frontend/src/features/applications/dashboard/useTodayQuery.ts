import { useQuery } from '@tanstack/react-query';
import { applicationApi } from '@entities/application/api';
import { applicationKeys } from '@entities/application/queryKeys';

export function useTodayQuery() {
  return useQuery({
    queryKey: applicationKeys.today(),
    queryFn: applicationApi.today,
  });
}
