import { useMutation } from '@tanstack/react-query';
import { sessionApi } from '@entities/session/api';

export function useRequestPasswordResetMutation() {
  return useMutation({
    mutationFn: (email: string) => sessionApi.requestPasswordReset(email),
  });
}
