import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  prenom: string | null;
  nom: string | null;
  subscription_status: string;
  role: string;
  plan_started_at: string | null;
  created_at: string | null;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signUp: (
    email: string,
    password: string,
    meta?: { prenom?: string; nom?: string; plan?: string; period?: string },
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
