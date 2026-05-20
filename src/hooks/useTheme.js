import { useState, useEffect } from 'react';

const THEME_KEY = 'nakama_theme';

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return { theme, toggle, isDark: theme === 'dark' };
}

/** Aplica o tema salvo imediatamente (evita flash) — chamar antes do React montar */
export function applyStoredTheme() {
  const t = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', t);
}
