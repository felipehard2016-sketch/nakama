import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { migrateLocalToSupabase, loadFromSupabase } from '../lib/storage';

const AuthContext = createContext(null);

/* ── Garante que o perfil existe no banco (upsert seguro) ── */
async function ensureProfile(user) {
  if (!user) return;
  await supabase
    .from('user_profiles')
    .upsert(
      { user_id: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // true até getSession() resolver

  /* Referência para saber se é o primeiro evento SIGNED_IN desta sessão */
  const isNewSignupRef = useRef(false);

  /* ── Chamado sempre que o usuário muda ── */
  async function onUserChange(newUser, event) {
    setUser(newUser);

    if (newUser) {
      /* Cria perfil se não existir (belt-and-suspenders; trigger faz no DB) */
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        ensureProfile(newUser);
      }
      /* Sincroniza lista salva localmente → Supabase */
      migrateLocalToSupabase(newUser.id);
      loadFromSupabase(newUser.id);
    }
  }

  useEffect(() => {
    /* Lê sessão persistida (aba aberta / refresh) */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      onUserChange(session?.user ?? null, 'INITIAL');
      setLoading(false);
    });

    /* Escuta mudanças: login, logout, refresh de token, etc. */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        onUserChange(session?.user ?? null, event);

        /* Termina o loading caso ainda não tenha sido resolvido */
        if (loading) setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Cadastro ─── */
  const signUp = async ({ name, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });
    if (error) throw error;
    return data; // data.session = null se e-mail não confirmado
  };

  /* ─── Login ─── */
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data; // data.session sempre preenchida aqui
  };

  /* ─── Logout ─── */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  /* ─── Recuperação de senha ─── */
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  /* ─── Nova senha (após link de reset) ─── */
  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  /* Nome para exibição — prioriza display_name definido no cadastro */
  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'Usuário';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      displayName,
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
