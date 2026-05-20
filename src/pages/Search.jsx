import { useState, useEffect, useCallback, useRef } from 'react';
import { queryAniList, SEARCH_MEDIA } from '../lib/anilist';
import SearchCard from '../components/ui/SearchCard';
import { useTitle } from '../hooks/useTitle';
import {
  Search as SearchIcon, X, SlidersHorizontal,
  ChevronDown, Loader2, FileSearch, Filter
} from 'lucide-react';

/* ─── Constantes ─── */
const GENRES = [
  'Action','Adventure','Comedy','Drama','Ecchi','Fantasy',
  'Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological',
  'Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
];

const STATUSES = [
  { value: 'RELEASING',        label: 'Em lançamento' },
  { value: 'FINISHED',         label: 'Finalizado' },
  { value: 'NOT_YET_RELEASED', label: 'Em breve' },
  { value: 'CANCELLED',        label: 'Cancelado' },
  { value: 'HIATUS',           label: 'Hiato' },
];

const SCORES = [
  { value: 59, label: '6+' },
  { value: 69, label: '7+' },
  { value: 79, label: '8+' },
  { value: 89, label: '9+' },
];

const SORTS = [
  { value: 'POPULARITY_DESC', label: 'Mais populares' },
  { value: 'SCORE_DESC',      label: 'Melhor nota' },
  { value: 'TRENDING_DESC',   label: 'Em alta' },
  { value: 'UPDATED_AT_DESC', label: 'Atualizados' },
  { value: 'START_DATE_DESC', label: 'Mais recentes' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1959 }, (_, i) => CURRENT_YEAR - i);

/* ─── Hook debounce ─── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Skeleton card ─── */
function SkeletonCard() {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', height: 130,
    }}>
      <div className="skeleton" style={{ width: 90, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 16, borderRadius: 6, width: '70%' }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '40%' }} />
        <div className="skeleton" style={{ height: 12, borderRadius: 6, width: '90%' }} />
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
          {[60, 70, 50].map(w => (
            <div key={w} className="skeleton" style={{ height: 18, borderRadius: 5, width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Chip de filtro ativo ─── */
function ActiveChip({ label, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(124,58,237,0.15)',
      border: '1px solid rgba(124,58,237,0.35)',
      borderRadius: 20, padding: '3px 10px 3px 12px',
      fontSize: 12, color: 'var(--purple-light)', fontWeight: 500,
      whiteSpace: 'nowrap',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          display: 'flex', alignItems: 'center',
          color: 'var(--purple-light)', opacity: 0.7,
          padding: 1,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
      >
        <X size={11} />
      </button>
    </div>
  );
}

/* ─── Select estilizado ─── */
function StyledSelect({ value, onChange, children, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          background: 'var(--bg-card)',
          border: `1px solid ${value ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
          borderRadius: 9,
          padding: '9px 34px 9px 13px',
          color: value ? 'var(--text)' : 'var(--text-secondary)',
          fontSize: 13, cursor: 'pointer', outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = value ? 'rgba(124,58,237,0.5)' : 'var(--border)'}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown
        size={13}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
      />
    </div>
  );
}

/* ─── Pill button ─── */
function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 9,
        border: `1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
        background: active ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
        color: active ? '#fff' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      {children}
    </button>
  );
}

/* ─── Empty state ─── */
function EmptyState({ hasFilters }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <FileSearch size={32} color="var(--purple-light)" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
        {hasFilters ? 'Nenhum resultado encontrado' : 'Comece sua busca'}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>
        {hasFilters
          ? 'Tente outros termos ou remova alguns filtros.'
          : 'Digite o nome de um anime ou mangá, ou use os filtros para explorar.'}
      </p>
    </div>
  );
}

/* ─── Página principal ─── */
export default function Search() {
  useTitle('Buscar');
  const inputRef = useRef(null);

  const [query, setQuery]   = useState('');
  const [type, setType]     = useState('ANIME');
  const [genre, setGenre]   = useState('');
  const [year, setYear]     = useState('');
  const [status, setStatus] = useState('');
  const [score, setScore]   = useState('');
  const [sort, setSort]     = useState('POPULARITY_DESC');

  const [results, setResults]         = useState([]);
  const [total, setTotal]             = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);

  const debouncedQuery = useDebounce(query, 420);

  const hasFilters = !!(debouncedQuery || genre || year || status || score);

  const buildVars = useCallback((p = 1) => ({
    search:   debouncedQuery || undefined,
    type,
    genre:    genre || undefined,
    year:     year ? parseInt(year) : undefined,
    status:   status || undefined,
    minScore: score ? parseInt(score) : undefined,
    sort:     [sort],
    page:     p,
    perPage:  24,
  }), [debouncedQuery, type, genre, year, status, score, sort]);

  /* Busca inicial / ao mudar filtros */
  useEffect(() => {
    setPage(1);
    setLoading(true);
    setError(null);
    setResults([]);
    queryAniList(SEARCH_MEDIA, buildVars(1))
      .then(data => {
        setResults(data.Page.media);
        setTotal(data.Page.pageInfo.total);
        setHasNextPage(data.Page.pageInfo.hasNextPage);
      })
      .catch(err => {
        console.error('Search error:', err);
        setError('Erro ao carregar resultados. Tente novamente.');
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, type, genre, year, status, score, sort]);

  /* Carregar mais */
  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    queryAniList(SEARCH_MEDIA, buildVars(nextPage))
      .then(data => {
        setResults(prev => [...prev, ...data.Page.media]);
        setPage(nextPage);
        setHasNextPage(data.Page.pageInfo.hasNextPage);
      })
      .finally(() => setLoadingMore(false));
  };

  /* Chips de filtros ativos */
  const activeChips = [
    genre  && { label: genre,                             onRemove: () => setGenre('') },
    year   && { label: year,                              onRemove: () => setYear('') },
    status && { label: STATUSES.find(s => s.value === status)?.label, onRemove: () => setStatus('') },
    score  && { label: `Nota ≥ ${(parseInt(score) + 1) / 10}`, onRemove: () => setScore('') },
  ].filter(Boolean);

  /* Focar input com atalho */
  useEffect(() => {
    const onKey = e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero de busca ── */}
      <div style={{
        padding: '40px 40px 32px',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Explorar
        </h1>

        {/* Barra de busca */}
        <div style={{ position: 'relative', maxWidth: 720, marginBottom: 20 }}>
          <SearchIcon
            size={18}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar anime, mangá, personagem..."
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 44px 14px 48px',
              color: 'var(--text)',
              fontSize: 15,
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--purple)';
              e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.18)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={15} />
            </button>
          )}
          <kbd style={{
            position: 'absolute', right: query ? 40 : 12, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)',
            display: query ? 'none' : 'block',
          }}>/</kbd>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Type pills */}
          <div style={{
            display: 'flex', gap: 4, background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 10, padding: 3,
          }}>
            <Pill active={type === 'ANIME'} onClick={() => setType('ANIME')}>Anime</Pill>
            <Pill active={type === 'MANGA'} onClick={() => setType('MANGA')}>Mangá</Pill>
          </div>

          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

          <StyledSelect value={genre} onChange={setGenre} placeholder="Gênero">
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </StyledSelect>

          <StyledSelect value={year} onChange={setYear} placeholder="Ano">
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </StyledSelect>

          <StyledSelect value={status} onChange={setStatus} placeholder="Status">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </StyledSelect>

          {/* Score pills */}
          <div style={{ display: 'flex', gap: 4 }}>
            {SCORES.map(s => (
              <Pill key={s.value} active={score === String(s.value)} onClick={() => setScore(prev => prev === String(s.value) ? '' : String(s.value))}>
                {s.label}
              </Pill>
            ))}
          </div>

          <div style={{ width: 1, height: 28, background: 'var(--border)' }} />

          <StyledSelect value={sort} onChange={setSort} placeholder="Ordenar">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </StyledSelect>
        </div>
      </div>

      {/* ── Resultados ── */}
      <div style={{ padding: '24px 40px 48px' }}>

        {/* Barra de status + chips ativos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap', minHeight: 28 }}>
          {!loading && total !== null && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>
              {total.toLocaleString()} resultado{total !== 1 ? 's' : ''}
            </span>
          )}
          {activeChips.map((chip, i) => (
            <ActiveChip key={i} label={chip.label} onRemove={chip.onRemove} />
          ))}
          {activeChips.length > 1 && (
            <button
              onClick={() => { setGenre(''); setYear(''); setStatus(''); setScore(''); }}
              style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Grid de resultados */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
            <p style={{ fontSize: 15, color: '#f87171', fontWeight: 600 }}>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); queryAniList(SEARCH_MEDIA, buildVars(1)).then(data => { setResults(data.Page.media); setTotal(data.Page.pageInfo.total); setHasNextPage(data.Page.pageInfo.hasNextPage); }).catch(err => setError('Erro ao carregar resultados.')).finally(() => setLoading(false)); }}
              style={{ padding: '9px 22px', background: 'rgba(124,58,237,0.15)', border: '1px solid var(--purple)', borderRadius: 9, color: 'var(--purple-light)', fontSize: 13, fontWeight: 600 }}
            >Tentar novamente</button>
          </div>
        ) : results.length === 0 ? (
          <EmptyState hasFilters={hasFilters} />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
              {results.map(media => (
                <SearchCard key={media.id} media={media} />
              ))}
            </div>

            {/* Carregar mais */}
            {hasNextPage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, padding: '11px 28px',
                    color: loadingMore ? 'var(--text-muted)' : 'var(--text)',
                    fontSize: 14, fontWeight: 500,
                    cursor: loadingMore ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple-light)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
                >
                  {loadingMore
                    ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Carregando...</>
                    : 'Carregar mais'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
