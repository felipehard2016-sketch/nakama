import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchIcon } from 'lucide-react';
import { queryAniList, SEARCH_MEDIA } from '../lib/anilist';
import MediaCard from '../components/ui/MediaCard';
import { useTitle } from '../hooks/useTitle';

const TYPES = [
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Mangá' },
];

export default function Search() {
  useTitle('Buscar');
  const [params, setParams] = useSearchParams();
  const initialQuery = params.get('q') || '';

  const [term, setTerm]       = useState(initialQuery);
  const [type, setType]       = useState(params.get('type') || 'ANIME');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!term.trim()) { setResults([]); return; }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await queryAniList(SEARCH_MEDIA, {
          search: term.trim(), type, page: 1, perPage: 30, sort: ['SEARCH_MATCH'],
        });
        setResults(data.Page.media);
      } catch {
        setError('Não deu para buscar agora. Tenta de novo em instantes.');
      } finally {
        setLoading(false);
      }
    }, 400);

    setParams(term.trim() ? { q: term.trim(), type } : {}, { replace: true });
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, type]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Buscar</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Animes e mangás via AniList.</p>
      </div>

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

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && term.trim() && results.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Nada encontrado para "{term}".</p>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {results.map(media => <MediaCard key={media.id} media={media} />)}
        </div>
      )}

      {!term.trim() && !loading && (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Digite algo para começar a busca.
        </p>
      )}
    </div>
  );
}
