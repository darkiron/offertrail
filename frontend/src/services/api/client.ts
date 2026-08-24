import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const axiosInstance = axios.create({
  baseURL: API_URL,
});

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
