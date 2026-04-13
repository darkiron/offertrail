import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { setAxiosAuthToken } from '../services/api'

interface Profile {
  id: string
  prenom: string | null
  nom: string | null
  plan: string
  role: string
  plan_started_at: string | null
  created_at: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  signUp: (email: string, password: string, meta?: { prenom?: string; nom?: string }) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get<Profile>('/auth/me')
      setProfile(res.data)
    } catch {
      // profil pas encore créé ou token expiré — ignorer
    }
  }

  const applySession = (s: Session | null) => {
    setSession(s)
    setUser(s?.user ?? null)
    setAxiosAuthToken(s?.access_token ?? null)
    if (!s) setProfile(null)
  }

  useEffect(() => {
    // Récupère la session au chargement
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s)
      if (s?.access_token) {
        fetchProfile().finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    // Écoute les changements d'auth (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      applySession(s)
      if (s?.access_token) {
        void fetchProfile()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, meta?: { prenom?: string; nom?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta ?? {} },
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    await fetchProfile()
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isAuthenticated: !!user,
      isLoading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
