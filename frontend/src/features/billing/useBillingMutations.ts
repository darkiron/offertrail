import { useMutation, useQueryClient } from '@tanstack/react-query';
import { planApi } from '@entities/plan/api';
import { planKeys } from '@entities/plan/queryKeys';
import type { CheckoutPayload } from '@entities/plan/model';

export function useCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckoutPayload) => planApi.checkout(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: planKeys.all }),
  });
}

export function usePortalMutation() {
  return useMutation({
    mutationFn: () => planApi.portal(),
  });
}
