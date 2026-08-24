import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '@entities/application/api';
import { applicationKeys } from '@entities/application/queryKeys';
import type { CompleteActionPayload } from '@entities/application/model';

export function useCompleteActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      actionId,
      payload,
    }: {
      actionId: string;
      payload: CompleteActionPayload;
    }) => applicationApi.completeAction(actionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: applicationKeys.today(),
      });
    },
  });
}
