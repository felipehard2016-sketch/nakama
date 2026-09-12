import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Check, Clock } from 'lucide-react';
import LazyImg from '../ui/LazyImg';
import { formatCountdown } from '../../lib/format';

// Sites que a AniList agrega e que costumam ter dado mais completo/confiável.
// Quando mais de um site cobre o mesmo episódio, o primeiro da lista vence.
const PREFERRED_SITES = ['Crunchyroll', 'Funimation', 'HIDIVE', 'Netflix', 'Hulu'];

function parseEpisodeNumber(title) {
  const match = title?.match(/(?:episode|ep\.?)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/*
 * A ordem de media.streamingEpisodes (AniList) NÃO é garantida por
 * episódio — alguns sites listam do mais recente pro mais antigo. Usar
 * a posição no array como número do episódio dá número errado (foi
 * exatamente o bug reportado: badge e título batendo em episódios
 * diferentes). Por isso o número de verdade vem do texto do título.
 */
function buildEpisodeMap(episodesInfo) {
  const map = new Map();
  const sorted = [...episodesInfo].sort((a, b) => {
    const ai = PREFERRED_SITES.indexOf(a.site);
    const bi = PREFERRED_SITES.indexOf(b.site);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  for (const ep of sorted) {
    const num = parseEpisodeNumber(ep.title);
    if (num != null && !map.has(num)) map.set(num, ep);
  }
  return map;
}

function EpisodeRow({ ep, info, watched, notYetAired, countdown, onSelect, disabled }) {
  if (notYetAired) {
    return (
      <div className="flex w-full items-center gap-3 rounded-lg p-2 opacity-70">
        <div className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-medium text-[var(--text-muted)]">
          EP {ep}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--text-muted)]">Ainda não lançado</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-purple-light">
            <Clock size={11} /> {countdown}
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(ep)}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors ${
        watched ? 'bg-purple/15' : 'hover:bg-white/5'
      }`}
    >
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-black/30">
        {info?.thumbnail ? (
          <LazyImg src={info.thumbnail} alt="" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-muted)]">EP</div>
        )}
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {ep}
        </span>
      </div>
      <p className={`min-w-0 flex-1 truncate text-xs leading-snug ${watched ? 'font-medium text-white' : 'text-[var(--text-secondary)]'}`}>
        {info?.title || `Episódio ${ep}`}
      </p>
      {watched && <Check size={16} className="shrink-0 text-purple-light" />}
    </button>
  );
}

export default function EpisodeGrid({ total, progress, episodesInfo = [], nextAiringEpisode, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  // Quando nem o total nem a próxima estreia são conhecidos, mostra uma
  // folga além do progresso atual e deixa expandir manualmente — sem
  // isso a grade "adivinharia" um total e cortaria episódios de verdade.
  const [visibleExtra, setVisibleExtra] = useState(24);

  const episodeMap = useMemo(() => buildEpisodeMap(episodesInfo), [episodesInfo]);

  // Anime em exibição sem contagem fechada: o episódio "nextAiringEpisode"
  // ainda não saiu — usamos ele como fronteira em vez de adivinhar.
  const upcomingEp = !total ? nextAiringEpisode?.episode : null;
  const count = total || (upcomingEp ? upcomingEp : Math.max(progress, 0) + visibleExtra);
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
        <div className="flex max-h-[28rem] flex-col gap-0.5 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
          {episodes.map(ep => (
            <EpisodeRow
              key={ep}
              ep={ep}
              info={episodeMap.get(ep)}
              watched={ep <= progress}
              notYetAired={upcomingEp === ep}
              countdown={upcomingEp === ep ? formatCountdown(nextAiringEpisode.timeUntilAiring) : null}
              onSelect={onSelect}
              disabled={disabled}
            />
          ))}

          {!total && !upcomingEp && (
            <button
              onClick={() => setVisibleExtra(c => c + 24)}
              className="mt-1 w-full rounded-md bg-white/5 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Carregar mais…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
