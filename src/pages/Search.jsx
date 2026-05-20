import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  queryAniList, SEARCH_MEDIA, SEARCH_CHARACTERS,
  SEARCH_STAFF, SEARCH_STUDIOS,
} from '../lib/anilist';
import { getSavedMediaIds } from '../lib/recommendations';
import SearchCard from '../components/ui/SearchCard';
import { useTitle } from '../hooks/useTitle';
import {
  Search as SearchIcon, X, ChevronDown, Loader2,
  FileSearch, User, Mic2, Building2, Tag, Heart,
  Star, CheckCircle2, EyeOff,
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

const SEARCH_MODES = [
  { key: 'media',      label: 'Anime / Mangá', icon: SearchIcon },
  { key: 'characters', label: 'Personagens',   icon: User },
  { key: 'staff',      label: 'Seiyuus',       icon: Mic2 },
  { key: 'studios',    label: 'Estúdios',      icon: Building2 },
  { key: 'tags',       label: 'Tags',          icon: Tag },
];

/* Popular AniList tags organized by category */
const TAG_CATEGORIES = [
  {
    name: 'Premissa',
    color: '#a78bfa',
    tags: ['Isekai','Reincarnation','Time Travel','Transported to Another World','Parallel Universe',
           'Alternate Universe','Amnesia','Hidden Identity','Anti-Hero','Revenge'],
  },
  {
    name: 'Ambiente',
    color: '#60a5fa',
    tags: ['School','Military','Office','Workplace','Medieval','Post-Apocalyptic','Dystopian',
           'Steampunk','Cyberpunk','Space','Rural','Urban Fantasy'],
  },
  {
    name: 'Relacionamentos',
    color: '#f472b6',
    tags: ['Love Triangle','Harem','Reverse Harem','Age Gap','Childhood Friends','Forbidden Love',
           'Unrequited Love','Arranged Marriage','Enemies to Lovers'],
  },
  {
    name: 'Fantasia / Ficção',
    color: '#34d399',
    tags: ['Magic','Sword and Sorcery','Super Power','Mecha','Robot','Virtual Reality',
           'Video Games','Card Games','Witchcraft','Demons','Vampires','Dragons'],
  },
  {
    name: 'Tom',
    color: '#fbbf24',
    tags: ['Psychological','Dark Fantasy','Gore','Body Horror','Tragedy','Survival',
           'Philosophical','Slice of Life','Healing','Feel Good','Parody'],
  },
  {
    name: 'Estrutura',
    color: '#fb7185',
    tags: ['Anthology','Short Episodes','Episodic','Non-Linear','Ensemble Cast',
           'Found Family','Coming of Age','Crossover','Adaptation'],
  },
];

/* ─── Hooks ─── */
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Skeleton ─── */
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

function SkeletonPerson() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div className="skeleton" style={{ height: 200 }} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, borderRadius: 6, width: '80%' }} />
        <div className="skeleton" style={{ height: 11, borderRadius: 6, width: '50%' }} />
      </div>
    </div>
  );
}

/* ─── Chips / filtros ativos ─── */
function ActiveChip({ label, onRemove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'rgba(124,58,237,0.15)',
      border: '1px solid rgba(124,58,237,0.35)',
      borderRadius: 20, padding: '3px 10px 3px 12px',
      fontSize: 12, color: 'var(--purple-light)', fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {label}
      <button onClick={onRemove} style={{ display: 'flex', alignItems: 'center', color: 'var(--purple-light)', opacity: 0.7, padding: 1 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}>
        <X size={11} />
      </button>
    </div>
  );
}

/* ─── Select ─── */
function StyledSelect({ value, onChange, children, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', background: 'var(--bg-card)',
        border: `1px solid ${value ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
        borderRadius: 9, padding: '9px 34px 9px 13px',
        color: value ? 'var(--text)' : 'var(--text-secondary)',
        fontSize: 13, cursor: 'pointer', outline: 'none', transition: 'border-color 0.15s',
      }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = value ? 'rgba(124,58,237,0.5)' : 'var(--border)'}>
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
    </div>
  );
}

/* ─── Pill ─── */
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 9,
      border: `1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
      background: active ? 'rgba(124,58,237,0.2)' : 'var(--bg-card)',
      color: active ? '#fff' : 'var(--text-secondary)',
      fontSize: 13, fontWeight: active ? 600 : 400, transition: 'all 0.15s', whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}>
      {children}
    </button>
  );
}

/* ─── Empty state ─── */
function EmptyState({ hasFilters, mode }) {
  const msgs = {
    media:      { empty: 'Comece sua busca',        filtered: 'Nenhum resultado encontrado', hint: 'Digite o nome de um anime ou mangá, ou use os filtros para explorar.' },
    characters: { empty: 'Busque por personagens',  filtered: 'Nenhum personagem encontrado', hint: 'Digite o nome de um personagem de anime ou mangá.' },
    staff:      { empty: 'Busque por seiyuus',      filtered: 'Nenhum seiyuu encontrado', hint: 'Digite o nome de um dublador ou artista japonês.' },
    studios:    { empty: 'Busque por estúdios',     filtered: 'Nenhum estúdio encontrado', hint: 'Digite o nome de um estúdio de animação.' },
  };
  const m = msgs[mode] || msgs.media;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14 }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(124,58,237,0.08)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <FileSearch size={32} color="var(--purple-light)" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{hasFilters ? m.filtered : m.empty}</p>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 320 }}>
        {hasFilters ? 'Tente outros termos ou ajuste sua busca.' : m.hint}
      </p>
    </div>
  );
}

/* ─── Card de Personagem ─── */
function CharacterCard({ char }) {
  const navigate = useNavigate();
  const name = char.name?.full || 'Desconhecido';
  const animes = char.media?.nodes?.slice(0, 3) || [];

  return (
    <div onClick={() => navigate(`/character/${char.id}`)} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.18s, transform 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>

      {/* Foto */}
      <div style={{ position: 'relative', paddingBottom: '120%', overflow: 'hidden' }}>
        <img src={char.image?.large} alt={name} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 55%)' }} />
        {char.favourites > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#f472b6', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Heart size={9} fill="#f472b6" color="#f472b6" /> {char.favourites.toLocaleString()}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {animes.map(a => (
            <p key={a.id} style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.title?.english || a.title?.romaji}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Card de Seiyuu ─── */
function StaffCard({ staff }) {
  const navigate = useNavigate();
  const name = staff.name?.full || 'Desconhecido';
  const roles = staff.characters?.nodes?.slice(0, 3) || [];
  const occupation = staff.primaryOccupations?.[0] || staff.languageV2 || 'Voice Actor';

  return (
    <div onClick={() => navigate(`/character/${staff.id}?type=staff`)} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.18s, transform 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>

      {/* Foto */}
      <div style={{ position: 'relative', paddingBottom: '120%', overflow: 'hidden' }}>
        <img src={staff.image?.large} alt={name} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,15,0.9) 0%, transparent 55%)' }} />
        {staff.favourites > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Heart size={9} fill="#60a5fa" color="#60a5fa" /> {staff.favourites.toLocaleString()}
          </div>
        )}
        {/* Microfone badge */}
        <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '2px 6px' }}>
            {occupation}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
        <div style={{ display: 'flex', gap: 4, overflow: 'hidden' }}>
          {roles.map(r => r.image?.large && (
            <img key={r.id} src={r.image.large} alt={r.name?.full}
              title={`${r.name?.full} — ${r.media?.nodes?.[0]?.title?.english || r.media?.nodes?.[0]?.title?.romaji || ''}`}
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Card de Estúdio ─── */
function StudioCard({ studio }) {
  const navigate = useNavigate();
  const works = studio.media?.nodes?.slice(0, 4) || [];

  return (
    <div onClick={() => navigate(`/studio/${studio.id}`)} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
      transition: 'border-color 0.18s, transform 0.18s', padding: '16px',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(52,211,153,0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{studio.name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {studio.isAnimationStudio && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 5, padding: '1px 7px' }}>
                Animação
              </span>
            )}
            {studio.favourites > 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Heart size={9} color="#f472b6" fill="#f472b6" /> {studio.favourites.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <Building2 size={18} color="var(--text-muted)" strokeWidth={1.5} />
      </div>

      {/* Obras */}
      <div style={{ display: 'flex', gap: 6 }}>
        {works.map(w => (
          <div key={w.id} style={{ flex: 1, minWidth: 0 }}>
            <img src={w.coverImage?.large} alt={w.title?.romaji}
              title={w.title?.english || w.title?.romaji}
              loading="lazy"
              style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)' }} />
          </div>
        ))}
        {works.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhuma obra encontrada</p>
        )}
      </div>
    </div>
  );
}

/* ─── Tags Browser ─── */
function TagsBrowser({ onTagSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
          Selecione uma tag para explorar animes com essa temática.
        </p>
      </div>
      {TAG_CATEGORIES.map(cat => (
        <div key={cat.name}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, borderRadius: 2, background: cat.color }} />
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{cat.name}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cat.tags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                onMouseEnter={() => setHovered(tag)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: `1px solid ${hovered === tag ? cat.color : 'var(--border)'}`,
                  background: hovered === tag ? `${cat.color}18` : 'var(--bg-card)',
                  color: hovered === tag ? cat.color : 'var(--text-secondary)',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Load More button ─── */
function LoadMoreBtn({ onClick, loading }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
      <button onClick={onClick} disabled={loading} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '11px 28px',
        color: loading ? 'var(--text-muted)' : 'var(--text)',
        fontSize: 14, fontWeight: 500,
        cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s',
      }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple-light)'; } }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}>
        {loading
          ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Carregando...</>
          : 'Carregar mais'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA PRINCIPAL
═══════════════════════════════════════════ */
export default function Search() {
  useTitle('Buscar');
  const inputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── Estado de modo ── */
  const [mode, setMode] = useState(searchParams.get('mode') || 'media');

  /* ── Estado media ── */
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [type, setType]     = useState('ANIME');
  const [genre, setGenre]   = useState('');
  const [tag, setTag]       = useState(searchParams.get('tag') || '');
  const [year, setYear]     = useState('');
  const [status, setStatus] = useState('');
  const [score, setScore]   = useState('');
  const [sort, setSort]     = useState('POPULARITY_DESC');
  const [hideWatched, setHideWatched] = useState(false);

  const [results, setResults]         = useState([]);
  const [total, setTotal]             = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState(null);

  /* ── Estado pessoas/estúdios ── */
  const [pResults, setPResults]         = useState([]);
  const [pTotal, setPTotal]             = useState(null);
  const [pHasNext, setPHasNext]         = useState(false);
  const [pPage, setPPage]               = useState(1);
  const [pLoading, setPLoading]         = useState(false);
  const [pLoadingMore, setPLoadingMore] = useState(false);

  const debouncedQuery = useDebounce(query, 420);
  const savedIds = getSavedMediaIds();

  const hasFilters = !!(debouncedQuery || genre || tag || year || status || score);

  /* ── Sync URL params ── */
  useEffect(() => {
    const p = {};
    if (mode !== 'media') p.mode = mode;
    if (query) p.q = query;
    if (tag)   p.tag = tag;
    setSearchParams(p, { replace: true });
  }, [mode, query, tag]);

  /* ── Busca de media ── */
  const buildMediaVars = useCallback((p = 1) => ({
    search:   debouncedQuery || undefined,
    type,
    genre:    genre || undefined,
    tag:      tag || undefined,
    year:     year ? parseInt(year) : undefined,
    status:   status || undefined,
    minScore: score ? parseInt(score) : undefined,
    sort:     [sort],
    page:     p,
    perPage:  24,
  }), [debouncedQuery, type, genre, tag, year, status, score, sort]);

  useEffect(() => {
    if (mode !== 'media') return;
    setPage(1);
    setLoading(true);
    setError(null);
    setResults([]);
    queryAniList(SEARCH_MEDIA, buildMediaVars(1))
      .then(data => {
        setResults(data.Page.media);
        setTotal(data.Page.pageInfo.total);
        setHasNextPage(data.Page.pageInfo.hasNextPage);
      })
      .catch(err => { console.error(err); setError('Erro ao carregar resultados.'); })
      .finally(() => setLoading(false));
  }, [debouncedQuery, type, genre, tag, year, status, score, sort, mode]);

  const loadMoreMedia = () => {
    const next = page + 1;
    setLoadingMore(true);
    queryAniList(SEARCH_MEDIA, buildMediaVars(next))
      .then(data => {
        setResults(prev => [...prev, ...data.Page.media]);
        setPage(next);
        setHasNextPage(data.Page.pageInfo.hasNextPage);
      })
      .finally(() => setLoadingMore(false));
  };

  /* ── Busca de pessoas/estúdios ── */
  const QUERY_MAP = { characters: SEARCH_CHARACTERS, staff: SEARCH_STAFF, studios: SEARCH_STUDIOS };
  const RESULT_KEY = { characters: 'characters', staff: 'staff', studios: 'studios' };

  useEffect(() => {
    if (!['characters', 'staff', 'studios'].includes(mode)) return;
    if (!debouncedQuery.trim()) { setPResults([]); setPTotal(null); return; }
    setPPage(1);
    setPLoading(true);
    setPResults([]);
    queryAniList(QUERY_MAP[mode], { search: debouncedQuery, page: 1, perPage: 20 })
      .then(data => {
        const key = RESULT_KEY[mode];
        setPResults(data.Page[key]);
        setPTotal(data.Page.pageInfo.total);
        setPHasNext(data.Page.pageInfo.hasNextPage);
      })
      .catch(err => console.error(err))
      .finally(() => setPLoading(false));
  }, [debouncedQuery, mode]);

  const loadMorePeople = () => {
    const next = pPage + 1;
    setPLoadingMore(true);
    queryAniList(QUERY_MAP[mode], { search: debouncedQuery, page: next, perPage: 20 })
      .then(data => {
        const key = RESULT_KEY[mode];
        setPResults(prev => [...prev, ...data.Page[key]]);
        setPPage(next);
        setPHasNext(data.Page.pageInfo.hasNextPage);
      })
      .finally(() => setPLoadingMore(false));
  };

  /* ── Chips de filtros ativos ── */
  const activeChips = [
    genre  && { label: genre, onRemove: () => setGenre('') },
    tag    && { label: `Tag: ${tag}`, onRemove: () => setTag('') },
    year   && { label: year, onRemove: () => setYear('') },
    status && { label: STATUSES.find(s => s.value === status)?.label, onRemove: () => setStatus('') },
    score  && { label: `Nota ≥ ${(parseInt(score) + 1) / 10}`, onRemove: () => setScore('') },
  ].filter(Boolean);

  /* ── Atalho de teclado ── */
  useEffect(() => {
    const onKey = e => { if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ── Media exibida (com filtro de assistidos) ── */
  const displayedResults = hideWatched
    ? results.filter(m => !savedIds.has(String(m.id)))
    : results;

  /* ─── Tag select → switch to media mode ─── */
  const handleTagSelect = (t) => {
    setTag(t);
    setMode('media');
    setQuery('');
  };

  /* ─── Troca de modo ─── */
  const handleModeChange = (m) => {
    setMode(m);
    setQuery('');
    setTag('');
    setResults([]);
    setPResults([]);
    setTotal(null);
    setPTotal(null);
  };

  /* ─── Placeholder por modo ─── */
  const placeholders = {
    media:      'Buscar anime, mangá...',
    characters: 'Buscar personagem (ex: Goku, Naruto...)',
    staff:      'Buscar seiyuu (ex: Kana Hanazawa...)',
    studios:    'Buscar estúdio (ex: Mappa, Ufotable...)',
    tags:       '',
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <div style={{
        padding: '40px 40px 0',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Explorar
        </h1>

        {/* ── Tabs de modo ── */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {SEARCH_MODES.map(m => (
            <button key={m.key} onClick={() => handleModeChange(m.key)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: '10px 10px 0 0', whiteSpace: 'nowrap',
              background: mode === m.key ? 'rgba(124,58,237,0.12)' : 'transparent',
              borderBottom: mode === m.key ? '2px solid var(--purple)' : '2px solid transparent',
              color: mode === m.key ? 'var(--purple-light)' : 'var(--text-muted)',
              fontWeight: mode === m.key ? 600 : 400, fontSize: 13.5, transition: 'all 0.15s',
            }}>
              <m.icon size={14} strokeWidth={mode === m.key ? 2.2 : 1.8} />
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Barra de busca (exceto tags) ── */}
        {mode !== 'tags' && (
          <div style={{ position: 'relative', maxWidth: 720, marginBottom: 20 }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholders[mode]}
              style={{
                width: '100%', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 12,
                padding: '14px 44px 14px 48px', color: 'var(--text)',
                fontSize: 15, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--purple)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.18)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <X size={15} />
              </button>
            )}
            {!query && (
              <kbd style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)' }}>/</kbd>
            )}
          </div>
        )}

        {/* ── Filtros (só no modo media) ── */}
        {mode === 'media' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
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

            {/* Ocultar assistidos */}
            <button onClick={() => setHideWatched(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 500,
              border: `1px solid ${hideWatched ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
              background: hideWatched ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
              color: hideWatched ? 'var(--purple-light)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}>
              {hideWatched ? <CheckCircle2 size={13} /> : <EyeOff size={13} />}
              Não assistidos
            </button>
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ padding: '24px 40px 60px' }}>

        {/* Tags Browser */}
        {mode === 'tags' && (
          <TagsBrowser onTagSelect={handleTagSelect} />
        )}

        {/* Media results */}
        {mode === 'media' && (
          <>
            {/* Chips + contagem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap', minHeight: 28 }}>
              {!loading && total !== null && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>
                  {total.toLocaleString()} resultado{total !== 1 ? 's' : ''}
                  {hideWatched && displayedResults.length < results.length
                    ? ` · ${displayedResults.length} não assistidos`
                    : ''}
                </span>
              )}
              {activeChips.map((chip, i) => <ActiveChip key={i} label={chip.label} onRemove={chip.onRemove} />)}
              {activeChips.length > 1 && (
                <button onClick={() => { setGenre(''); setYear(''); setStatus(''); setScore(''); setTag(''); }}
                  style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline', padding: 0 }}>
                  Limpar tudo
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0', gap: 12 }}>
                <p style={{ fontSize: 15, color: '#f87171', fontWeight: 600 }}>{error}</p>
              </div>
            ) : displayedResults.length === 0 ? (
              <EmptyState hasFilters={hasFilters} mode="media" />
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 12 }}>
                  {displayedResults.map(media => <SearchCard key={media.id} media={media} />)}
                </div>
                {hasNextPage && <LoadMoreBtn onClick={loadMoreMedia} loading={loadingMore} />}
              </>
            )}
          </>
        )}

        {/* Characters / Staff / Studios */}
        {['characters', 'staff', 'studios'].includes(mode) && (
          <>
            {/* Contagem */}
            {!pLoading && pTotal !== null && debouncedQuery && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                {pTotal.toLocaleString()} resultado{pTotal !== 1 ? 's' : ''} para "{debouncedQuery}"
              </p>
            )}

            {pLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: mode === 'studios' ? 'repeat(auto-fill, minmax(300px, 1fr))' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                {Array.from({ length: 12 }).map((_, i) => <SkeletonPerson key={i} />)}
              </div>
            ) : !debouncedQuery.trim() ? (
              <EmptyState hasFilters={false} mode={mode} />
            ) : pResults.length === 0 ? (
              <EmptyState hasFilters={true} mode={mode} />
            ) : (
              <>
                {mode === 'studios' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {pResults.map(s => <StudioCard key={s.id} studio={s} />)}
                  </div>
                ) : mode === 'characters' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {pResults.map(c => <CharacterCard key={c.id} char={c} />)}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                    {pResults.map(s => <StaffCard key={s.id} staff={s} />)}
                  </div>
                )}
                {pHasNext && <LoadMoreBtn onClick={loadMorePeople} loading={pLoadingMore} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
