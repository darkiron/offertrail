import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login: async (email: string, password: string) => {
        const response = await authService.login({ email, password });
        persistAuth(response);
        setUser(response.user);
        setToken(response.access_token);
      },
      register: async (payload: RegisterPayload) => {
        const response = await authService.register(payload);
        persistAuth(response);
        setUser(response.user);
        setToken(response.access_token);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuthToken(null);
        setUser(null);
        setToken(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function useRestoreAuth() {
  const { logout } = useAuth();

  useEffect(() => {
    const restore = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        return;
      }
      try {
        const me = await authService.me();
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(me));
      } catch {
        logout();
      }
    };

    void restore();
  }, [logout]);
}
