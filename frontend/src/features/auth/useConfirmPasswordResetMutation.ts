import { useMutation } from '@tanstack/react-query';
import { sessionApi } from '@entities/session/api';

export function useConfirmPasswordResetMutation() {
  return useMutation({
    mutationFn: (password: string) => sessionApi.confirmPasswordReset(password),
  });
}
