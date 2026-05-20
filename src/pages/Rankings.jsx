import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryAniList } from '../lib/anilist';
import { useTitle } from '../hooks/useTitle';
import { getSavedMediaIds } from '../lib/recommendations';
import {
  Tv, BookOpen, Film, Star, ChevronDown, Loader2,
  Trophy, TrendingUp, Tag, Calendar, CheckCircle2,
} from 'lucide-react';

/* ─── Configurações de modo ─── */
const GENRES = [
  'Action','Adventure','Comedy','Drama','Fantasy','Horror',
  'Mahou Shoujo','Mecha','Mystery','Psychological','Romance',
  'Sci-Fi','Slice of Life','Sports','Supernatural','Thriller',
];

const DECADES = [
  { label: '2020s', start: 2020, end: 2029 },
  { label: '2010s', start: 2010, end: 2019 },
  { label: '2000s', start: 2000, end: 2009 },
  { label: '1990s', start: 1990, end: 1999 },
  { label: '1980s', start: 1980, end: 1989 },
];

const TABS = [
  { key: 'anime',   label: 'Anime',   icon: Tv,       type: 'ANIME', format: null, sort: 'SCORE_DESC' },
  { key: 'manga',   label: 'Mangá',   icon: BookOpen, type: 'MANGA', format: null, sort: 'SCORE_DESC' },
  { key: 'manhwa',  label: 'Manhwa',  icon: BookOpen, type: 'MANGA', format: null, sort: 'SCORE_DESC', country: 'KR' },
  { key: 'manhua',  label: 'Manhua',  icon: BookOpen, type: 'MANGA', format: null, sort: 'SCORE_DESC', country: 'CN' },
  { key: 'movies',  label: 'Filmes',  icon: Film,     type: 'ANIME', format: 'MOVIE', sort: 'SCORE_DESC' },
  { key: 'ova',     label: 'OVA/ONA', icon: Star,     type: 'ANIME', format: 'OVA', sort: 'SCORE_DESC' },
  { key: 'popular', label: 'Popular', icon: TrendingUp, type: 'ANIME', format: null, sort: 'POPULARITY_DESC' },
  { key: 'genre',   label: 'Gênero',  icon: Tag,      type: null, format: null, sort: 'SCORE_DESC' },
  { key: 'decade',  label: 'Década',  icon: Calendar, type: null, format: null, sort: 'SCORE_DESC' },
];

/* ─── Query flexível ─── */
const RANKINGS_QUERY = `
  query ($type: MediaType, $format: MediaFormat, $genre: String,
         $yearStart: Int, $yearEnd: Int, $sort: [MediaSort],
         $page: Int, $perPage: Int, $formatIn: [MediaFormat], $country: CountryCode) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage total }
      media(
        type: $type, format: $format, genre: $genre,
        startDate_greater: $yearStart, startDate_lesser: $yearEnd,
        sort: $sort, isAdult: false, formatIn: $formatIn, countryOfOrigin: $country
      ) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        popularity
        episodes
        chapters
        format
        seasonYear
        status
        genres
        rankings { rank type context allTime }
      }
    }
  }
`;

/* ─── Helpers ─── */
function buildVars(tab, genre, decade, page) {
  const base = { page, perPage: 25, sort: [tab.sort] };

  if (tab.key === 'genre') {
    return { ...base, type: 'ANIME', genre: genre || 'Action' };
  }
  if (tab.key === 'decade') {
    const d = DECADES.find(d => d.label === decade) || DECADES[0];
    return { ...base, type: 'ANIME', yearStart: d.start * 10000, yearEnd: d.end * 10000 + 1231 };
  }
  if (tab.key === 'ova') {
    // OVA, ONA, Special grouped
    return { ...base, type: 'ANIME', formatIn: ['OVA','ONA','SPECIAL'] };
  }
  if (tab.country) {
    return { ...base, type: tab.type, country: tab.country };
  }
  return {
    ...base,
    type: tab.type,
    format: tab.format || undefined,
  };
}

/* ─── Rank badge ─── */
function RankBadge({ rank }) {
  const colors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#f97316' };
  const c = colors[rank] || 'var(--text-muted)';
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: rank <= 3 ? `${c}18` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${rank <= 3 ? `${c}40` : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: rank <= 3 ? 16 : 13,
      fontWeight: 800, color: c,
    }}>
      {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}
    </div>
  );
}

/* ─── Skeleton ─── */
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
      <div className="skeleton" style={{ width: 44, height: 60, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 14, borderRadius: 5, width: '60%' }} />
        <div className="skeleton" style={{ height: 11, borderRadius: 5, width: '35%' }} />
      </div>
      <div className="skeleton" style={{ width: 44, height: 22, borderRadius: 6 }} />
    </div>
  );
}

/* ─── Row de mídia ─── */
function MediaRow({ media, rank, savedIds }) {
  const navigate = useNavigate();
  const title    = media.title?.english || media.title?.romaji || '—';
  const score    = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
  const isAnime  = !['MANGA','NOVEL','ONE_SHOT'].includes(media.format);
  const total    = isAnime ? media.episodes : media.chapters;
  const saved    = savedIds.has(String(media.id));

  return (
    <div onClick={() => navigate(`/anime/${media.id}`)} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px',
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, cursor: 'pointer',
      transition: 'border-color 0.15s, background 0.1s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>

      <RankBadge rank={rank} />

      <img
        src={media.coverImage?.large}
        alt={title}
        loading="lazy"
        style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{media.format}</span>
          {media.seasonYear && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>· {media.seasonYear}</span>}
          {total && <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>· {total} {isAnime ? 'ep' : 'cap'}</span>}
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
              <CheckCircle2 size={10} /> Na lista
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <Star size={12} fill="#fbbf24" color="#fbbf24" />
        <span style={{ fontSize: 14, fontWeight: 800, color: score !== '—' ? '#fbbf24' : 'var(--text-muted)' }}>{score}</span>
      </div>
    </div>
  );
}

/* ─── StyledSelect ─── */
function StyledSelect({ value, onChange, children, placeholder }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', background: 'var(--bg-card)',
        border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10,
        padding: '10px 36px 10px 14px', color: 'var(--text)',
        fontSize: 14, cursor: 'pointer', outline: 'none', fontWeight: 500,
        transition: 'border-color 0.15s',
      }}
        onFocus={e => e.target.style.borderColor = 'var(--purple)'}
        onBlur={e => e.target.style.borderColor = 'rgba(124,58,237,0.4)'}>
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════ */
export default function Rankings() {
  useTitle('Rankings');

  const [activeTab, setActiveTab] = useState('anime');
  const [genre, setGenre]   = useState('Action');
  const [decade, setDecade] = useState('2020s');
  const [page, setPage]     = useState(1);
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(null);
  const [hasNext, setHasNext]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const savedIds = getSavedMediaIds();
  const tab = TABS.find(t => t.key === activeTab);

  const fetchData = useCallback((p = 1, append = false) => {
    const vars = buildVars(tab, genre, decade, p);
    if (append) setLoadingMore(true);
    else { setLoading(true); setResults([]); }

    queryAniList(RANKINGS_QUERY, vars)
      .then(data => {
        const items = data.Page.media;
        if (append) setResults(prev => [...prev, ...items]);
        else setResults(items);
        setTotal(data.Page.pageInfo.total);
        setHasNext(data.Page.pageInfo.hasNextPage);
        setPage(p);
      })
      .catch(err => console.error('[Rankings]', err))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, [tab, genre, decade]);

  useEffect(() => { fetchData(1); }, [activeTab, genre, decade]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
    setResults([]);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: '36px 40px 0',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Trophy size={22} color="#fbbf24" />
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Rankings</h1>
        </div>
        {total !== null && !loading && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            {total.toLocaleString()} títulos · ordenados por {tab?.sort === 'SCORE_DESC' ? 'nota' : 'popularidade'}
          </p>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', whiteSpace: 'nowrap',
              borderBottom: activeTab === t.key ? '2px solid var(--purple)' : '2px solid transparent',
              background: activeTab === t.key ? 'rgba(124,58,237,0.08)' : 'transparent',
              color: activeTab === t.key ? 'var(--purple-light)' : 'var(--text-muted)',
              fontWeight: activeTab === t.key ? 600 : 400, fontSize: 13.5,
              borderRadius: '8px 8px 0 0', transition: 'all 0.15s',
            }}>
              <t.icon size={14} strokeWidth={activeTab === t.key ? 2.2 : 1.8} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTROS (gênero / década) ── */}
      {(activeTab === 'genre' || activeTab === 'decade') && (
        <div style={{ padding: '20px 40px 0', display: 'flex', gap: 12, alignItems: 'center' }}>
          {activeTab === 'genre' && (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gênero:</span>
              <StyledSelect value={genre} onChange={setGenre}>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </StyledSelect>
            </>
          )}
          {activeTab === 'decade' && (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Década:</span>
              <StyledSelect value={decade} onChange={setDecade}>
                {DECADES.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
              </StyledSelect>
            </>
          )}
        </div>
      )}

      {/* ── LISTA ── */}
      <div style={{ padding: '24px 40px 60px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 15 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <>
            {/* Duas colunas em desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 10 }}>
              {results.map((media, i) => (
                <MediaRow
                  key={media.id}
                  media={media}
                  rank={(page - 1) * 25 + i + 1}
                  savedIds={savedIds}
                />
              ))}
            </div>

            {/* Load more */}
            {hasNext && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
                <button onClick={() => fetchData(page + 1, true)} disabled={loadingMore} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '11px 28px',
                  color: loadingMore ? 'var(--text-muted)' : 'var(--text)',
                  fontSize: 14, fontWeight: 500, cursor: loadingMore ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { if (!loadingMore) { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple-light)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}>
                  {loadingMore
                    ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Carregando...</>
                    : `Ver próximos 25`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
