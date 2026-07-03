import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const NAME_KEY = 'nakama_display_name';

export function AuthProvider({ children }) {
  const [displayName, setDisplayNameState] = useState(
    () => localStorage.getItem(NAME_KEY) || 'Usuário'
  );

  const updateDisplayName = (name) => {
    const trimmed = (name || '').trim() || 'Usuário';
    localStorage.setItem(NAME_KEY, trimmed);
    setDisplayNameState(trimmed);
  };

  return (
    <AuthContext.Provider value={{
      user: null,
      session: null,
      loading: false,
      displayName,
      updateDisplayName,
      signOut: () => {},
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
