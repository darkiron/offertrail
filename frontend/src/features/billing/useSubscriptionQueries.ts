import { useQuery } from '@tanstack/react-query';
import { planApi } from '@entities/plan/api';
import { planKeys } from '@entities/plan/queryKeys';

export function useSubscriptionStatusQuery() {
  return useQuery({
    queryKey: planKeys.subscriptionStatus(),
    queryFn: planApi.subscriptionStatus,
  });
}
