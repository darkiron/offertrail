import React, { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { axiosInstance, setAxiosAuthToken } from '../services/api/client';
import { AuthContext, type Profile } from './auth-context';
import {
  clearPasswordRecoveryMarker,
  createPasswordRecoveryMarker,
  hasValidPasswordRecoveryMarker,
  savePasswordRecoveryMarker,
} from '../utils/passwordRecovery';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get<Profile>('/auth/me');
      setProfile(res.data);
    } catch {
      // profil pas encore créé ou token expiré — ignorer
    }
  };

  const applySession = (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    setAxiosAuthToken(s?.access_token ?? null);
    if (!s) setProfile(null);
  };

  useEffect(() => {
    // Récupère la session au chargement
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
      setIsPasswordRecovery(
        hasValidPasswordRecoveryMarker(sessionStorage, s?.user.id),
      );
      if (s?.access_token) {
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Écoute les changements d'auth (login, logout, refresh token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY' && s) {
        savePasswordRecoveryMarker(
          sessionStorage,
          createPasswordRecoveryMarker(s.user.id, s.expires_at),
        );
        setIsPasswordRecovery(true);
      }
      if (event === 'SIGNED_OUT') {
        clearPasswordRecoveryMarker(sessionStorage);
        setIsPasswordRecovery(false);
      }
      applySession(s);
      if (s?.access_token) {
        fetchProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    meta?: { prenom?: string; nom?: string; plan?: string; period?: string },
  ) => {
    const plan =
      meta?.plan === 'pro' || meta?.plan === 'ultimate' ? meta.plan : 'free';
    const period = meta?.period === 'yearly' ? 'yearly' : 'monthly';
    const destination =
      plan === 'free' ? '/app' : `/app/checkout?plan=${plan}&period=${period}`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta ?? {},
        emailRedirectTo: `${window.location.origin}${destination}`,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.session) {
        applySession(data.session);
        await fetchProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isPasswordRecovery,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
