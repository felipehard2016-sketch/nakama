/*
 * Barras horizontais "top gêneros". Paleta categórica validada
 * (dataviz skill: 8 matizes, ordem fixa, nunca ciclada — aqui só
 * usamos os 6 primeiros slots, o suficiente pro top 6 gêneros).
 * Rótulo direto em cada barra em vez de legenda (mitiga o contraste
 * baixo de alguns tons no tema claro).
 */
const SLOTS = [
  { light: '#2a78d6', dark: '#3987e5' },
  { light: '#eb6834', dark: '#d95926' },
  { light: '#1baf7a', dark: '#199e70' },
  { light: '#eda100', dark: '#c98500' },
  { light: '#e87ba4', dark: '#d55181' },
  { light: '#4a3aa7', dark: '#9085e9' },
];

export default function GenreBars({ data }) {
  if (!data?.length) return <p className="text-sm text-[var(--text-muted)]">Sem dados suficientes ainda.</p>;
  const max = Math.max(...data.map(d => d.count));

  return (
    <div className="flex flex-col gap-2.5">
      <style>{`
        .genre-bar-fill { background: var(--genre-color-light); }
        :root:not([data-theme="light"]) .genre-bar-fill { background: var(--genre-color-dark); }
        [data-theme="dark"] .genre-bar-fill { background: var(--genre-color-dark); }
      `}</style>
      {data.map((d, i) => {
        const slot = SLOTS[i % SLOTS.length];
        const pct = Math.max(6, Math.round((d.count / max) * 100));
        return (
          <div key={d.genre} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-xs text-[var(--text-secondary)]">{d.genre}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-white/5">
              <div
                className="genre-bar-fill h-full rounded transition-all"
                style={{ width: `${pct}%`, '--genre-color-light': slot.light, '--genre-color-dark': slot.dark }}
              />
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-xs font-medium tabular-nums text-[var(--text)]">{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}
