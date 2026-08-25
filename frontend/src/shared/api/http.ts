import axios from 'axios';
import { env } from '@shared/config/env';
import { toApiError } from '@shared/api/ApiError';

export const http = axios.create({ baseURL: env.apiUrl });

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

localStorage.removeItem('offertrail.auth.token');

export function setHttpAuthToken(token: string | null): void {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}
