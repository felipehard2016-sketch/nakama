import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SidebarContext = createContext(null);

/**
 * Controla a gaveta (drawer) de navegação mobile. No desktop a sidebar é
 * fixa e não usa este estado; isso serve só para telas pequenas, como
 * solução provisória até a tab bar do passo 10.
 *
 * `toggle`/`close` usam useCallback para manter identidade estável entre
 * renders — Layout depende de `close` num useEffect (fecha ao trocar de
 * rota); sem isso, toda mudança de `open` recriava a função e reabria o
 * efeito, fechando a gaveta no mesmo instante em que ela abria.
 */
export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(o => !o), []);
  const close = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ open, toggle, close }), [open, toggle, close]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar precisa ser usado dentro de <SidebarProvider>');
  return ctx;
}
