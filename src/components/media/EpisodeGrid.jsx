import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, Info } from 'lucide-react';
import LazyImg from '../ui/LazyImg';
import { formatCountdown } from '../../lib/format';
import { getEpisodeList, getEpisodeSynopsis } from '../../lib/jikan';

// Sites que a AniList agrega e que costumam ter dado mais completo/confiável
// pra imagem (Jikan/MAL não tem thumbnail de episódio, só título/data).
const PREFERRED_SITES = ['Crunchyroll', 'Funimation', 'HIDIVE', 'Netflix', 'Hulu'];

function parseEpisodeNumber(title) {
  const match = title?.match(/(?:episode|ep\.?)\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

/*
 * A ordem de media.streamingEpisodes (AniList) NÃO é garantida por
 * episódio — alguns sites listam do mais recente pro mais antigo — daí
 * extrair o número de dentro do título em vez de usar a posição no
 * array. Serve só de base; o título é substituído pelo do Jikan/MAL
 * assim que a lista de lá carrega (número lá vem estruturado, não por
 * regex — mais confiável).
 */
function buildAniListMap(episodesInfo) {
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

function EpisodeRow({ ep, title, thumbnail, fallbackImage, watched, notYetAired, countdown, malId, onSelect, disabled }) {
  const [expanded, setExpanded] = useState(false);
  const [synopsis, setSynopsis] = useState(undefined); // undefined = não buscado ainda
  const [loadingSynopsis, setLoadingSynopsis] = useState(false);

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

  const toggleExpand = async () => {
    if (!expanded && synopsis === undefined && malId) {
      setLoadingSynopsis(true);
      const text = await getEpisodeSynopsis(malId, ep);
      setSynopsis(text);
      setLoadingSynopsis(false);
    }
    setExpanded(x => !x);
  };

  return (
    <div className={`rounded-lg ${watched ? 'bg-purple/15' : ''}`}>
      <div className="flex w-full items-center gap-2.5 p-2">
        <button
          onClick={() => onSelect(ep)}
          disabled={disabled}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-black/30">
            {thumbnail ? (
              <LazyImg src={thumbnail} alt="" style={{ width: '100%', height: '100%' }} />
            ) : fallbackImage ? (
              // Sem foto própria do episódio: usa a capa do anime como reserva
              // (opacidade menor pra deixar claro que não é uma cena real do ep).
              <LazyImg src={fallbackImage} alt="" style={{ width: '100%', height: '100%', opacity: 0.45 }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--text-muted)]">EP</div>
            )}
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {ep}
            </span>
          </div>
          <p className={`min-w-0 flex-1 truncate text-xs leading-snug ${watched ? 'font-medium text-white' : 'text-[var(--text-secondary)]'}`}>
            {title || `Episódio ${ep}`}
          </p>
        </button>
        {watched && <Check size={16} className="shrink-0 text-purple-light" />}
        {malId && (
          <button
            onClick={toggleExpand}
            aria-label="Ver sinopse do episódio"
            className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text)]"
          >
            {expanded ? <ChevronUp size={14} /> : <Info size={14} />}
          </button>
        )}
      </div>
      {expanded && (
        <p className="px-2 pb-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
          {loadingSynopsis ? 'Carregando sinopse…' : (synopsis || 'Sem sinopse disponível para este episódio.')}
        </p>
      )}
    </div>
  );
}

export default function EpisodeGrid({ total, progress, episodesInfo = [], nextAiringEpisode, malId, fallbackImage, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [visibleExtra, setVisibleExtra] = useState(24);
  const [jikanEpisodes, setJikanEpisodes] = useState(null); // null = ainda não buscou

  const aniListMap = useMemo(() => buildAniListMap(episodesInfo), [episodesInfo]);
  const jikanMap = useMemo(() => {
    const map = new Map();
    for (const ep of jikanEpisodes || []) map.set(ep.number, ep);
    return map;
  }, [jikanEpisodes]);

  // Busca a lista do Jikan só quando a grade é aberta pela primeira vez
  // (evita gastar chamada de API em anime que o usuário nunca expande).
  useEffect(() => {
    if (!open || !malId || jikanEpisodes !== null) return;
    let cancelled = false;
    getEpisodeList(malId).then(list => { if (!cancelled) setJikanEpisodes(list); });
    return () => { cancelled = true; };
  }, [open, malId, jikanEpisodes]);

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
          {malId && jikanEpisodes === null && (
            <p className="px-1 pb-1 text-[10px] text-[var(--text-muted)]">Carregando dados de episódio…</p>
          )}
          {episodes.map(ep => (
            <EpisodeRow
              key={ep}
              ep={ep}
              title={jikanMap.get(ep)?.title || aniListMap.get(ep)?.title}
              thumbnail={aniListMap.get(ep)?.thumbnail}
              fallbackImage={fallbackImage}
              watched={ep <= progress}
              notYetAired={upcomingEp === ep}
              countdown={upcomingEp === ep ? formatCountdown(nextAiringEpisode.timeUntilAiring) : null}
              malId={malId}
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
