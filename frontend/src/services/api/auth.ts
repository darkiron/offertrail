import type {
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
} from '../../types';
import { axiosInstance } from './client';

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await axiosInstance.post<AuthResponse>(
      '/auth/login',
      new URLSearchParams({
        username: credentials.email,
        password: credentials.password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );
    return response.data;
  },
  register: async (payload: RegisterPayload) => {
    const response = await axiosInstance.post<AuthResponse>(
      '/auth/register',
      payload,
    );
    return response.data;
  },
  me: async () => {
    const response = await axiosInstance.get<AuthResponse['user']>('/auth/me');
    return response.data;
  },
  updateMe: async (payload: Pick<RegisterPayload, 'prenom' | 'nom'>) => {
    const response = await axiosInstance.patch<AuthResponse['user']>(
      '/auth/me',
      payload,
    );
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axiosInstance.post<{ message: string }>(
      '/auth/change-password',
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
    );
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await axiosInstance.post<{ message: string }>(
      '/auth/forgot-password',
      { email },
    );
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await axiosInstance.post<{ message: string }>(
      '/auth/reset-password',
      {
        token,
        new_password: newPassword,
      },
    );
    return response.data;
  },
};
