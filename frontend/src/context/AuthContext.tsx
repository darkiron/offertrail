import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import axios from 'axios';
import { authService, setAuthToken } from '../services/api';
import type { AuthResponse, AuthUser, LoginCredentials, RegisterPayload } from '../types';

const USER_STORAGE_KEY = 'offertrail.auth.user';
const TOKEN_STORAGE_KEY = 'offertrail.auth.token';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  setUserData: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 409) return 'Cet email est déjà utilisé.';
    if (error.response?.status === 429) return "Trop de tentatives. Réessaie dans quelques instants.";
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (!error.response) return "Impossible de joindre l'API OfferTrail. Vérifie que le backend tourne sur http://localhost:8000.";
  }
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function persistAuth(response: AuthResponse): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, response.access_token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  setAuthToken(response.access_token);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));

  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  // Stable refs — must not be defined inside useMemo to avoid infinite loop in useRestoreAuth
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
    setToken(null);
  }, []);

  const setUserData = useCallback((nextUser: AuthUser | null) => {
    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUser(nextUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login: async (email: string, password: string) => {
        try {
          const response = await authService.login({ email, password });
          persistAuth(response);
          setUser(response.user);
          setToken(response.access_token);
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Connexion impossible'));
        }
      },
      register: async (payload: RegisterPayload) => {
        try {
          const response = await authService.register(payload);
          persistAuth(response);
          setUser(response.user);
          setToken(response.access_token);
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Inscription impossible'));
        }
      },
      setUserData,
      refreshUser: async () => {
        try {
          const me = await authService.me();
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
          setUser(me);
        } catch (error) {
          throw new Error(getErrorMessage(error, 'Impossible de rafraichir le profil'));
        }
      },
      logout,
    }),
    [token, user, logout, setUserData],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useRestoreAuth() {
  const { logout, setUserData } = useAuth();

  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) return;
      try {
        const me = await authService.me();
        setUserData(me);
      } catch {
        logout();
      }
    };
    void restore();
  }, [logout, setUserData]); // stable refs — won't re-run
}
