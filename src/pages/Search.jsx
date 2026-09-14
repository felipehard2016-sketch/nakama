import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon, X } from 'lucide-react';
import { queryAniList, SEARCH_MEDIA } from '../lib/anilist';
import MediaCard from '../components/ui/MediaCard';
import ErrorState from '../components/ui/ErrorState';
import { useTitle } from '../hooks/useTitle';
import { useAuth } from '../context/AuthContext';
import { useQuickList } from '../hooks/useQuickList';

const TYPES = [
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Mangá' },
];

// Gêneros "de verdade" da AniList (nomes exatos que a API espera no
// filtro `genre`) — lista fixa porque a AniList não tem um enum pra
// isso, é string livre validada contra a lista deles.
const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
];

const FORMATS_BY_TYPE = {
  ANIME: [['TV', 'TV'], ['TV_SHORT', 'TV Curta'], ['MOVIE', 'Filme'], ['OVA', 'OVA'], ['ONA', 'ONA'], ['SPECIAL', 'Especial']],
  MANGA: [['MANGA', 'Mangá'], ['NOVEL', 'Novel'], ['ONE_SHOT', 'One-shot']],
};

const STATUS_OPTIONS = [
  ['RELEASING', 'Em lançamento'],
  ['FINISHED', 'Finalizado'],
  ['NOT_YET_RELEASED', 'Ainda não lançado'],
  ['HIATUS', 'Em hiato'],
  ['CANCELLED', 'Cancelado'],
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1959 }, (_, i) => CURRENT_YEAR - i);

const selectClass = 'rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text)] outline-none focus:border-purple';

export default function Search() {
  useTitle('Buscar');
  const { user } = useAuth();
  const { listMap, applyListChange } = useQuickList(user?.id);
  const [params, setParams] = useSearchParams();

  const [term, setTerm]     = useState(params.get('q') || '');
  const [type, setType]     = useState(params.get('type') || 'ANIME');
  const [genre, setGenre]   = useState(params.get('genre') || '');
  const [year, setYear]     = useState(params.get('year') || '');
  const [format, setFormat] = useState(params.get('format') || '');
  const [status, setStatus] = useState(params.get('status') || '');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const debounceRef = useRef(null);

  const hasFilters = !!(genre || year || format || status);

  // Trocar de Anime <-> Mangá invalida o formato escolhido (os valores
  // não se sobrepõem: TV não existe pra mangá, por exemplo).
  useEffect(() => { setFormat(''); }, [type]);

  useEffect(() => {
    if (!term.trim() && !hasFilters) { setResults([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await queryAniList(SEARCH_MEDIA, {
          search: term.trim() || undefined,
          type,
          genre: genre || undefined,
          year: year ? Number(year) : undefined,
          format: format || undefined,
          status: status || undefined,
          page: 1, perPage: 30,
          // Sem termo de busca (navegando só por filtro), SEARCH_MATCH não
          // faz sentido pra AniList ordenar — usa popularidade nesse caso.
          sort: [term.trim() ? 'SEARCH_MATCH' : 'POPULARITY_DESC'],
        });
        setResults(data.Page.media);
      } catch {
        setError('Não deu para buscar agora. Tenta de novo em instantes.');
      } finally {
        setLoading(false);
      }
    }, 400);

    const next = { type };
    if (term.trim()) next.q = term.trim();
    if (genre) next.genre = genre;
    if (year) next.year = year;
    if (format) next.format = format;
    if (status) next.status = status;
    setParams(next, { replace: true });
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, type, genre, year, format, status, reloadKey]);

  const clearFilters = () => { setGenre(''); setYear(''); setFormat(''); setStatus(''); };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Buscar</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Animes e mangás via AniList.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              autoFocus
              type="text"
              value={term}
              onChange={e => setTerm(e.target.value)}
              placeholder="Nome do anime ou mangá…"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-purple"
            />
          </div>
          <div className="flex gap-2">
            {TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  type === t.value
                    ? 'bg-purple/20 text-[var(--text)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filtrar por gênero" value={genre} onChange={e => setGenre(e.target.value)} className={selectClass}>
            <option value="">Todos os gêneros</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select aria-label="Filtrar por ano" value={year} onChange={e => setYear(e.target.value)} className={selectClass}>
            <option value="">Todos os anos</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select aria-label="Filtrar por formato" value={format} onChange={e => setFormat(e.target.value)} className={selectClass}>
            <option value="">Todos os formatos</option>
            {FORMATS_BY_TYPE[type].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <select aria-label="Filtrar por status de exibição" value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
            <option value="">Qualquer status</option>
            {STATUS_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              <X size={13} /> Limpar filtros
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={() => setReloadKey(k => k + 1)} />}

      {!loading && !error && (term.trim() || hasFilters) && results.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Nada encontrado com esses filtros.</p>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map(media => (
            <MediaCard
              key={media.id}
              media={media}
              entry={listMap.get(String(media.id))}
              onEntryChange={user && (next => applyListChange(media.id, next))}
            />
          ))}
        </div>
      )}

      {!term.trim() && !hasFilters && !loading && (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Digite algo ou use os filtros para começar a busca.
        </p>
      )}
    </div>
  );
}
