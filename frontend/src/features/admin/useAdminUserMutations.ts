import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@entities/admin/api';
import { adminKeys } from '@entities/admin/queryKeys';
import type { AdminUserPlanUpdate } from '@entities/admin/model';

export function useUpdateUserPlanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      update,
    }: {
      userId: string;
      update: AdminUserPlanUpdate;
    }) => adminApi.updateUserPlan(userId, update),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}

export function useToggleUserActiveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.toggleUserActive(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
