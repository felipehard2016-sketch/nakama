import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

/*
 * Autenticação real via Supabase Auth (e-mail/senha). O perfil público
 * (tabela `profiles`) é criado sozinho no signup por um trigger no banco
 * (ver supabase/schema.sql → handle_new_user) — aqui só buscamos e
 * expomos os dois: `user` (sessão do Supabase Auth) e `profile` (linha
 * de public.profiles, com username/avatar/level).
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return; }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, level, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (!error) setProfile(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      loadProfile(data.session?.user?.id).finally(() => setLoading(false));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      loadProfile(newSession?.user?.id);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: username ? { username } : undefined },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = () => supabase.auth.signOut();

  const updateProfile = async (patch) => {
    if (!session?.user?.id) return { error: new Error('Não autenticado') };
    const { data, error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', session.user.id)
      .select()
      .single();
    if (!error) setProfile(data);
    return { data, error };
  };

  return (
    <AuthContext.Provider value={{
      user: session?.user ?? null,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile: () => loadProfile(session?.user?.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
