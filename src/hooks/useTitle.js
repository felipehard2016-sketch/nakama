import { useEffect } from 'react';

/**
 * Define o título da página.
 * @param {string} title — Ex: "One Piece" → resultado: "One Piece — Nakama"
 */
export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — Nakama` : 'Nakama';
    return () => { document.title = 'Nakama'; };
  }, [title]);
}
