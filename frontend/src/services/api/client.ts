import axios from 'axios';
import { env } from '@shared/config/env';
import { toApiError } from '@shared/api/ApiError';

export const axiosInstance = axios.create({
  baseURL: env.apiUrl,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

// Nettoyage de l'ancien token legacy (pré-Supabase) si présent en localStorage
localStorage.removeItem('offertrail.auth.token');

// Réexportée par AuthContext via applySession — pas de localStorage
export function setAxiosAuthToken(token: string | null): void {
  if (token) {
    axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common.Authorization;
  }
}
