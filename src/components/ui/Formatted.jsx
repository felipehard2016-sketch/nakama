/** Renderiza texto com `__negrito__` (marcação da AniList) como <strong> de verdade. */
export default function Formatted({ text }) {
  const parts = (text || '').split(/(__[^_]+__)/g);
  return parts.map((part, i) => {
    const m = part.match(/^__([^_]+)__$/);
    return m
      ? <strong key={i} className="font-semibold text-[var(--text)]">{m[1]}</strong>
      : <span key={i}>{part}</span>;
  });
}
