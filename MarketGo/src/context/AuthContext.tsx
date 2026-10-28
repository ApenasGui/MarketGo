import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    let previousUserId: string | null = null;
    function applySession(next: Session | null) {
      if (!active) return;
      const nextUserId = next?.user.id ?? null;
      if (previousUserId !== nextUserId || !next) queryClient.clear();
      previousUserId = nextUserId;
      setSession(next);
      setLoading(false);
    }
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      authEventReceived = true;
      applySession(next);
    });
    // Uma resposta antiga de getSession não pode sobrescrever login/logout mais recente.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!authEventReceived) applySession(error ? null : data.session);
      })
      .catch(() => {
        if (!authEventReceived) applySession(null);
      });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      signUp: async (name, email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;

        return { needsConfirmation: data.session === null };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
