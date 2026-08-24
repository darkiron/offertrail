import { axiosInstance } from './client';

export interface ProfileUpdate {
  prenom?: string;
  nom?: string;
}

export interface ProfileResponse extends ProfileUpdate {
  id: string;
  subscription_status: string;
  role: string;
  plan_started_at: string | null;
  created_at: string | null;
}

export const authService = {
  updateMe: async (payload: ProfileUpdate) => {
    const response = await axiosInstance.patch<ProfileResponse>(
      '/auth/me',
      payload,
    );
    return response.data;
  },
};
