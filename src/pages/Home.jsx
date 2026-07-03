import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryAniList, HOME_BATCH_QUERY } from '../lib/anilist';
import {
  getUserTopGenres,
  fetchRecommendationsByGenre,
} from '../lib/recommendations';
import AnimeCard from '../components/ui/AnimeCard';
import { useTitle } from '../hooks/useTitle';
import {
  TrendingUp, Tv, ChevronLeft, ChevronRight,
  Info, Star, BookOpen, Flame, Sparkles, Compass,
} from 'lucide-react';

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'WINTER';
  if (m <= 6) return 'SPRING';
  if (m <= 9) return 'SUMMER';
  return 'FALL';
}

/* ════════════════════════════════════════
   SKELETON COMPONENTS
════════════════════════════════════════ */
function SkeletonBox({ w, h, r = 8, style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />;
}

function SkeletonCarousel({ cardW = 150, cardH = 225, count = 7 }) {
  return (
    <section style={{ marginBottom: 48 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, padding: '0 24px' }}>
        <SkeletonBox w={18} h={18} r={4} />
        <SkeletonBox w={160} h={20} r={6} />
      </div>
      {/* cards */}
      <div style={{ display: 'flex', gap: 14, paddingInline: '24px', overflowX: 'hidden' }}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBox key={i} w={cardW} h={cardH} r={12} />
        ))}
      </div>
    </section>
  );
}

function SkeletonRankRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
      <SkeletonBox w={22} h={16} r={4} />
      <SkeletonBox w={36} h={50} r={5} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox w="80%" h={13} r={4} />
        <SkeletonBox w="50%" h={11} r={4} />
      </div>
    </div>
  );
}

function SkeletonRankList() {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <SkeletonBox w={16} h={16} r={4} />
        <SkeletonBox w={100} h={16} r={4} />
      </div>
      {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}
function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
      <SkeletonBox w={22} h={16} r={4} />
      <SkeletonBox w={36} h={50} r={5} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox w="78%" h={13} r={4} />
        <SkeletonBox w="45%" h={11} r={4} />
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Hero skeleton */}
      <div style={{ height: 280, background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
        <div className="skeleton" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,15,0.92) 30%, rgba(10,10,15,0.4) 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 60, left: 48, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBox w={90} h={22} r={20} />
            <SkeletonBox w={60} h={22} r={20} />
          </div>
          <SkeletonBox w={340} h={46} r={8} />
          <SkeletonBox w={220} h={24} r={8} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <SkeletonBox w={140} h={44} r={10} />
            <SkeletonBox w={120} h={44} r={10} />
          </div>
        </div>
      </div>

      {/* Carousels */}
      <div style={{ paddingTop: 40 }}>
        <SkeletonCarousel cardW={200} cardH={295} count={6} />
        <SkeletonCarousel cardW={150} cardH={225} count={8} />
        <SkeletonCarousel cardW={150} cardH={225} count={8} />
      </div>

    </div>
  );
}

/* ─── Hero ─── */
function Hero({ media }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const items = media.slice(0, 5);
  const current = items[idx];
  const title = current?.title?.english || current?.title?.romaji || '';

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!current) return null;

  return (
    <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
      {/* Background — eager load para o hero (above the fold) */}
      <div
        key={current.id}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${current.bannerImage || current.coverImage.extraLarge})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          animation: 'fadeIn 0.8s ease',
        }}
      />

      {/* Gradients */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(10,10,15,0.95) 30%, rgba(10,10,15,0.5) 65%, rgba(10,10,15,0.15) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0) 50%)',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '60px 48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        {/* Status badge */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <div style={{
            background: 'linear-gradient(90deg, var(--purple), var(--blue))',
            borderRadius: 20, padding: '3px 12px',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#fff',
          }}>
            EM DESTAQUE
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '3px 10px',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            {current.format}
          </div>
          {current.seasonYear && (
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '3px 10px',
              fontSize: 11, color: 'var(--text-secondary)',
            }}>
              {current.seasonYear}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(22px, 2.8vw, 36px)', fontWeight: 900,
          lineHeight: 1.1, letterSpacing: '-0.02em',
          maxWidth: 500, marginBottom: 10,
          textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h1>

        {/* Score + genres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {current.averageScore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>
              <Star size={14} fill="#fbbf24" />
              {(current.averageScore / 10).toFixed(1)}
            </div>
          )}
          {current.episodes && (
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{current.episodes} episódios</span>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {current.genres?.slice(0, 3).map(g => (
              <span key={g} style={{
                background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 20, padding: '2px 10px',
                fontSize: 11.5, color: 'var(--purple-light)', fontWeight: 500,
              }}>{g}</span>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate(`/anime/${current.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
              color: '#fff', borderRadius: 10, padding: '11px 22px',
              fontSize: 13.5, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Info size={15} /> Ver Detalhes
          </button>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, marginTop: 22 }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 24 : 7, height: 7,
                borderRadius: 4,
                background: i === idx ? 'var(--purple)' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s', border: 'none', padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Carrossel horizontal ─── */
function Carousel({ title, icon: Icon, items, cardSize = 'md' }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 640, behavior: 'smooth' });

  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon size={18} color="var(--purple-light)" strokeWidth={2} />
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[ChevronLeft, ChevronRight].map((Btn, i) => (
            <button
              key={i}
              onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Btn size={14} />
            </button>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingInline: '24px', paddingBottom: 8, scrollbarWidth: 'none' }}
      >
        {items.map(media => (
          <AnimeCard key={media.id} media={media} size={cardSize} />
        ))}
      </div>
    </section>
  );
}

/* ─── Rankings ─── */
function RankingList({ title, icon: Icon, items, type }) {
  const navigate = useNavigate();
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 16, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        background: 'rgba(124,58,237,0.06)',
      }}>
        <Icon size={16} color="var(--purple-light)" />
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>

      {items.slice(0, 10).map((media, i) => {
        const t = media.title?.english || media.title?.romaji || 'Sem título';
        const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '—';
        const rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : 'var(--text-muted)';

        return (
          <div
            key={media.id}
            onClick={() => navigate(`/anime/${media.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              borderBottom: i < 9 ? '1px solid var(--border-subtle)' : 'none',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: 22, fontSize: 13, fontWeight: 800, color: rankColor, textAlign: 'center', flexShrink: 0 }}>
              {i + 1}
            </span>
            <img
              src={media.coverImage.large}
              alt=""
              loading="lazy"
              decoding="async"
              style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {media.format} · {type === 'anime' ? (media.episodes ? `${media.episodes} eps` : '—') : (media.chapters ? `${media.chapters} caps` : '—')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <Star size={10} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{score}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── API offline banner ─── */
function ApiOfflineBanner() {
  return (
    <div style={{
      margin: '0 40px 32px',
      background: 'rgba(251,191,36,0.08)',
      border: '1px solid rgba(251,191,36,0.25)',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: '#fbbf24' }}>AniList API temporariamente indisponível</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>
          Os servidores da AniList estão instáveis. As seções voltarão quando a API se recuperar.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          marginLeft: 'auto', flexShrink: 0,
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 8, padding: '7px 14px',
          color: '#fbbf24', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap',
        }}
      >
        Recarregar
      </button>
    </div>
  );
}

/* ════════════════════════════════════════
   HOME
════════════════════════════════════════ */
export default function Home() {
  useTitle('Home');
  const navigate = useNavigate();
  const [trending, setTrending] = useState([]);
  const [seasonal, setSeasonal] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [topManga, setTopManga] = useState([]);
  const [recItems, setRecItems] = useState([]);
  const [recGenre, setRecGenre] = useState('');
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);

  const topGenres = getUserTopGenres(3);
  const hasRecs   = topGenres.length > 0;

  useEffect(() => {
    const year  = new Date().getFullYear();
    const season = getCurrentSeason();
    const genre  = topGenres[0] || '';
    if (genre) setRecGenre(genre);

    /* ─── 1 request HTTP para trending + seasonal + top anime + top mangá ─── */
    const homeQuery = queryAniList(HOME_BATCH_QUERY, { season, year });

    /* ─── recomendações em paralelo (só se usuário tem histórico) ─── */
    const recQuery = hasRecs
      ? fetchRecommendationsByGenre(genre, 16)
      : Promise.resolve([]);

    Promise.allSettled([homeQuery, recQuery]).then(([home, rec]) => {
      if (home.status === 'fulfilled') {
        const d = home.value;
        setTrending(d.trending?.media  || []);
        setSeasonal(d.seasonal?.media  || []);
        setTopAnime(d.topAnime?.media  || []);
        setTopManga(d.topManga?.media  || []);
      } else {
        console.warn('[Nakama] Home batch falhou:', home.reason?.message);
        setApiError(true);
      }

      if (rec.status === 'fulfilled' && Array.isArray(rec.value)) {
        setRecItems(rec.value.slice(0, 16));
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Mostra skeleton enquanto carrega (muito mais fluido que spinner) */
  if (loading) return <HomeSkeleton />;

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      <Hero media={trending} />

      <div style={{ paddingTop: 40 }}>
        {apiError && <ApiOfflineBanner />}

        {recItems.length > 0 && (
          <Carousel
            title={`Recomendado — ${recGenre}`}
            icon={Sparkles}
            items={recItems}
            cardSize="md"
          />
        )}

        {trending.length > 0 && <Carousel title="Em Alta" icon={Flame} items={trending} cardSize="lg" />}
        {seasonal.length > 0 && <Carousel title="Temporada Atual" icon={Tv} items={seasonal} cardSize="md" />}

      </div>
    </div>
  );
}
