import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { migrateLocalToSupabase, loadFromSupabase } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Ao obter/mudar usuário → sincroniza dados */
  async function onUserChange(newUser) {
    setUser(newUser);
    if (newUser) {
      /* Faz em paralelo, não bloqueia a UI */
      migrateLocalToSupabase(newUser.id);
      loadFromSupabase(newUser.id);
    }
  }

  useEffect(() => {
    /* Sessão inicial */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      onUserChange(session?.user ?? null);
      setLoading(false);
    });

    /* Mudanças de auth (login / logout / refresh) */
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      onUserChange(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ─── Ações ─── */
  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Usuário';

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
