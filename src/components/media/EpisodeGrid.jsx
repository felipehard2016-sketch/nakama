import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

/*
 * Grade de episódios pra marcar progresso de forma rápida em animes
 * longos. Clicar no episódio N marca progresso = N (tudo até ali fica
 * "assistido" de uma vez, já que progresso é só "assisti até aqui" —
 * não precisa marcar um por um). Clicar num episódio já assistido volta
 * o progresso pra ele (útil se marcou passado do que devia).
 */
export default function EpisodeGrid({ total, progress, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  // Quando o total de episódios ainda não é conhecido (anime em exibição
  // sem contagem fechada), mostra uma folga além do progresso atual e
  // deixa expandir manualmente — sem isso já marcaria episódios sozinho.
  const [visibleCount, setVisibleCount] = useState(() => Math.max(progress + 12, 12));

  const count = total || visibleCount;
  const episodes = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)]"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? 'Esconder episódios' : `Ver episódios${total ? ` (${total})` : ''}`}
      </button>

      {open && (
        <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2.5 sm:grid-cols-8">
          {episodes.map(ep => {
            const watched = ep <= progress;
            return (
              <button
                key={ep}
                onClick={() => onSelect(ep)}
                disabled={disabled}
                title={`Episódio ${ep}`}
                className={`aspect-square rounded-md text-[11px] font-medium transition-colors ${
                  watched
                    ? 'bg-purple text-white'
                    : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text)]'
                }`}
              >
                {ep}
              </button>
            );
          })}
          {!total && (
            <button
              onClick={() => setVisibleCount(c => c + 24)}
              className="col-span-6 mt-1 rounded-md bg-white/5 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)] sm:col-span-8"
            >
              Carregar mais…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
