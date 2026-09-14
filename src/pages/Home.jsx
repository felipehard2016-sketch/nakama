import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Flame, Plus } from 'lucide-react';
import { queryAniList, HOME_BATCH_QUERY, HOME_GENRE_ROWS_QUERY, RECOMMENDATION_QUERY } from '../lib/anilist';
import { preferredTitle, upsertListEntry } from '../lib/mediaList';
import { cleanAniListText } from '../lib/format';
import { computeTopGenres, excludeTracked } from '../lib/recommendations';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQuickList } from '../hooks/useQuickList';
import MediaRow from '../components/ui/MediaRow';
import { FRAME_CLIP } from '../components/ui/MediaCard';
import ErrorState from '../components/ui/ErrorState';
import LazyImg from '../components/ui/LazyImg';
import { useTitle } from '../hooks/useTitle';

// chave da query HOME_GENRE_ROWS_QUERY, rótulo em PT-BR, nome exato do
// gênero na AniList (pro link "Ver tudo" cair já filtrado na Busca).
const GENRE_LABELS = [
  ['action', 'Ação', 'Action'],
  ['romance', 'Romance', 'Romance'],
  ['comedy', 'Comédia', 'Comedy'],
  ['fantasy', 'Fantasia', 'Fantasy'],
  ['drama', 'Drama', 'Drama'],
  ['sliceOfLife', 'Slice of Life', 'Slice of Life'],
];

const STEP_CUT = 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)';

function currentSeason() {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
  return { season, year };
}

function HeroBanner({ media }) {
  if (!media) {
    return <div className="-mx-4 aspect-[16/9] w-[calc(100%+2rem)] animate-pulse rounded-b-2xl bg-[var(--bg-card)] sm:-mx-6 sm:aspect-[16/6] sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)] lg:rounded-2xl" />;
  }
  const title = preferredTitle(media.title);
  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden rounded-b-2xl sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)] lg:rounded-2xl">
      <div className="aspect-[16/9] w-full sm:aspect-[16/6]">
        <img src={media.bannerImage || media.coverImage?.extraLarge} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/70 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5 sm:max-w-lg sm:p-8">
        <span className="flex w-fit items-center gap-1 rounded bg-gradient-to-r from-purple to-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <Flame size={11} /> Em alta agora
        </span>
        <h1 className="text-2xl font-black italic leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-4xl">
          {title}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          {media.genres?.slice(0, 3).map(g => (
            <span key={g} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">{g}</span>
          ))}
        </div>
        <p className="line-clamp-2 text-xs text-white/70 sm:text-sm">{cleanAniListText(media.description)}</p>
        <Link
          to={`/anime/${media.id}`}
          className="mt-1 flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105"
        >
          <Play size={15} className="fill-black" /> Ver detalhes
        </Link>
      </div>
    </div>
  );
}

/**
 * Card de "continuar assistindo": diferente do MediaCard comum porque
 * o ponto principal aqui não é descobrir algo novo, é ver onde parou e
 * avançar — por isso mostra "EP progresso/total" e um botão de +1 de
 * episódio direto ali, sem precisar abrir o detalhe.
 */
function ContinueWatchingCard({ entry, onAdvance, advancing }) {
  const m = entry.media_items;
  const total = m.metadata?.episodes;
  const atMax = total != null && entry.progress >= total;

  return (
    <div className="flex flex-col gap-2" style={{ width: '9rem' }}>
      <Link to={`/anime/${m.external_id}`} className="group block">
        <div
          className="relative aspect-[2/3] w-full overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] transition-[filter,transform] duration-200 group-hover:-translate-y-1 group-hover:[filter:drop-shadow(0_0_14px_var(--purple-glow))]"
          style={{ clipPath: FRAME_CLIP }}
        >
          <LazyImg src={m.cover_url} alt={m.title} style={{ width: '100%', height: '100%' }} />
        </div>
        <p className="mt-2 line-clamp-1 text-[13px] font-medium leading-snug text-[var(--text)] group-hover:text-purple-light">
          {m.title}
        </p>
      </Link>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold text-[var(--text)]">
          EP {entry.progress}{total ? ` / ${total}` : ''}
        </span>
        <button
          onClick={onAdvance}
          disabled={advancing || atMax}
          aria-label="Avançar 1 episódio"
          style={{ clipPath: STEP_CUT }}
          className="flex h-6 w-6 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-purple-light transition-[filter] hover:[filter:drop-shadow(0_0_8px_var(--purple-glow))] disabled:opacity-30"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  useTitle('Home');
  const { user } = useAuth();
  const { showToast } = useToast();
  const { listMap, listLoaded, applyListChange } = useQuickList(user?.id);

  const [homeData, setHomeData] = useState(null);
  const [homeError, setHomeError] = useState(false);
  const [genreRows, setGenreRows] = useState(null);
  const [recommended, setRecommended] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [advancingId, setAdvancingId] = useState(null);

  // Espelha `listMap` num ref, atualizado em efeito (nunca direto no
  // corpo do render) — só pra o efeito de recomendação abaixo poder ler
  // o valor mais recente sem precisar re-rodar toda vez que o mapa muda.
  const listMapRef = useRef(listMap);
  useEffect(() => { listMapRef.current = listMap; }, [listMap]);

  // Recomendação simples: gêneros favoritos calculados uma vez, quando a
  // lista termina de carregar — não a cada mudança dela (senão cada
  // clique no botão de status do card dispararia uma busca nova na
  // AniList). Sem lista/gênero suficiente (não logado, lista vazia),
  // `recommended` fica [] e a fileira simplesmente não aparece.
  useEffect(() => {
    if (!listLoaded) return;
    const topGenres = computeTopGenres([...listMapRef.current.values()], 3);
    if (topGenres.length === 0) { setRecommended([]); return; }

    queryAniList(RECOMMENDATION_QUERY, { genres: topGenres, page: 1, perPage: 20 })
      .then(data => {
        const trackedIds = new Set(listMapRef.current.keys());
        setRecommended(excludeTracked(data.Page.media, trackedIds).slice(0, 15));
      })
      .catch(() => setRecommended([]));
  }, [listLoaded]);

  useEffect(() => {
    setHomeError(false);
    const { season, year } = currentSeason();
    // HOME_BATCH_QUERY é o conteúdo principal da Home (hero + top 10 +
    // trending + mangás) — se falhar, mostra erro de verdade em vez de
    // só deixar a tela vazia pra sempre.
    queryAniList(HOME_BATCH_QUERY, { season, year })
      .then(setHomeData)
      .catch(() => setHomeError(true));
    // As fileiras por gênero são conteúdo complementar: se falharem,
    // a Home continua útil sem elas — só não mostra essas fileiras.
    queryAniList(HOME_GENRE_ROWS_QUERY, {})
      .then(setGenreRows)
      .catch(() => setGenreRows({}));
  }, [reloadKey]);

  // "Continuar assistindo" vem do mesmo mapa usado pelo botão de
  // adicionar/status dos cards (useQuickList) — antes disso, a Home
  // fazia uma segunda consulta só pra essa fileira.
  const watchingEntries = [...listMap.values()]
    .filter(e => e.status === 'watching')
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 15);

  const handleAdvance = async (entry) => {
    const m = entry.media_items;
    setAdvancingId(m.id);
    const nextProgress = entry.progress + 1;
    const { data, error } = await upsertListEntry(user.id, m.id, {
      status: entry.status,
      progress: nextProgress,
      rating: entry.rating,
      favorite: entry.favorite,
    });
    setAdvancingId(null);
    if (error) { showToast('Não deu para atualizar o progresso.', 'error'); return; }
    // upsertListEntry não devolve o media_items relacionado — sem
    // recompor aqui, o próximo render perderia capa/título/metadata
    // desse item no mapa (ver mesmo comentário em QuickAddControl).
    applyListChange(m.external_id, { ...data, media_items: m });
  };

  const handleEntryChange = (externalId, newEntry) => applyListChange(externalId, newEntry);

  const hero = homeData?.trending?.media?.[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      {!homeError && <HeroBanner media={hero} />}

      {watchingEntries.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-purple to-blue" />
            <h2 className="text-lg font-bold italic tracking-tight text-[var(--text)]">Continuar assistindo</h2>
          </div>
          <div className="scrollbar-none flex gap-3 overflow-x-auto scroll-smooth pb-1">
            {watchingEntries.map(entry => (
              <div key={entry.id} className="shrink-0">
                <ContinueWatchingCard
                  entry={entry}
                  advancing={advancingId === entry.media_items.id}
                  onAdvance={() => handleAdvance(entry)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {recommended?.length > 0 && (
        <MediaRow title="Recomendado pra você" items={recommended} listMap={listMap} onEntryChange={handleEntryChange} />
      )}

      {homeError && (
        <ErrorState
          message="Não deu para carregar os destaques agora — a AniList pode estar fora do ar."
          onRetry={() => setReloadKey(k => k + 1)}
        />
      )}

      {!homeError && !homeData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {homeData?.topAnime?.media?.length > 0 && (
        <MediaRow title="Top 10 da semana" items={homeData.topAnime.media.slice(0, 10)} ranked listMap={listMap} onEntryChange={handleEntryChange} />
      )}

      {homeData?.trending?.media?.length > 0 && (
        <MediaRow title="Em alta agora" items={homeData.trending.media} listMap={listMap} onEntryChange={handleEntryChange} />
      )}

      {GENRE_LABELS.map(([key, label, aniListGenre]) => (
        genreRows?.[key]?.media?.length > 0 && (
          <MediaRow
            key={key}
            title={label}
            items={genreRows[key].media}
            listMap={listMap}
            onEntryChange={handleEntryChange}
            seeAllHref={`/buscar?genre=${encodeURIComponent(aniListGenre)}&type=ANIME`}
          />
        )
      ))}

      {homeData?.topManga?.media?.length > 0 && (
        <MediaRow title="Mangás em alta" items={homeData.topManga.media} listMap={listMap} onEntryChange={handleEntryChange} />
      )}
    </div>
  );
}
