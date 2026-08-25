import { useMutation } from '@tanstack/react-query';
import { profileApi } from '@entities/profile/api';
import type { ProfileUpdate } from '@entities/profile/model';

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (payload: ProfileUpdate) => profileApi.update(payload),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (password: string) => profileApi.changePassword(password),
  });
}
