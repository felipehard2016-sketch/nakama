import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryAniList, HOME_BATCH_QUERY } from '../lib/anilist';
import { getUserTopGenres, fetchRecommendationsByGenre } from '../lib/recommendations';
import { getByListStatus } from '../lib/storage';
import { useTitle } from '../hooks/useTitle';
import { ChevronLeft, ChevronRight, Info, Star, Flame, Tv, Sparkles, Play } from 'lucide-react';

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return 'WINTER';
  if (m <= 6) return 'SPRING';
  if (m <= 9) return 'SUMMER';
  return 'FALL';
}

/* ─── Netflix-style card ─── */
function NCard({ media }) {
  const navigate = useNavigate();
  const title = media.title?.english || media.title?.romaji || '';
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  const cover = media.coverImage?.extraLarge || media.coverImage?.large;

  return (
    <div
      onClick={() => navigate(`/anime/${media.id}`)}
      className="ncard"
      style={{
        width: 160, flexShrink: 0,
        cursor: 'pointer',
        scrollSnapAlign: 'start',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {/* Capa */}
      <div style={{ position: 'relative', width: 160, height: 240, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
        {cover ? (
          <img
            src={cover}
            alt={title}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-card)' }} />
        )}
        {score && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            borderRadius: 5, padding: '2px 6px',
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700, color: '#fbbf24',
          }}>
            <Star size={9} fill="#fbbf24" color="#fbbf24" /> {score}
          </div>
        )}
      </div>
      {/* Título abaixo da capa */}
      <p style={{
        marginTop: 8, fontSize: 12.5, fontWeight: 600,
        color: 'var(--text)', lineHeight: 1.35,
        overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {title}
      </p>
    </div>
  );
}

/* ─── Card "Continuar assistindo" (com progresso) ─── */
function ContinueCard({ item }) {
  const navigate = useNavigate();
  const title = item.title?.english || item.title?.romaji || '';
  const cover = item.coverImage?.extraLarge || item.coverImage?.large;
  const isAnime = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(item.format);
  const total = isAnime ? item.episodes : item.chapters;
  const pct = total ? Math.min(100, Math.round((item.progress / total) * 100)) : 0;

  return (
    <div
      onClick={() => navigate(`/anime/${item.id}`)}
      style={{
        width: 160, flexShrink: 0,
        cursor: 'pointer',
        scrollSnapAlign: 'start',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      <div style={{ position: 'relative', width: 160, height: 240, borderRadius: 10, overflow: 'hidden' }}>
        {cover ? (
          <img src={cover} alt={title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-card)' }} />
        )}
        {/* Gradiente no rodapé da capa */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(10,10,15,0.9), transparent)',
          pointerEvents: 'none',
        }} />
        {/* Barra de progresso na base da capa */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--purple)', transition: 'width 0.3s' }} />
        </div>
        {/* Ícone play no hover */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.3)', opacity: 0,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(124,58,237,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
          </div>
        </div>
        {/* ep info */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          {item.progress}/{total || '?'} {isAnime ? 'eps' : 'caps'}
        </div>
      </div>
      <p style={{
        marginTop: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--text)',
        lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
      }}>
        {title}
      </p>
    </div>
  );
}

/* ─── Carrossel estilo Netflix ─── */
function Carousel({ title, icon: Icon, children, count }) {
  const trackRef = useRef(null);
  const scroll = dir => trackRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });

  if (!count) return null;

  return (
    <section style={{ marginBottom: 44 }}>
      {/* Header da seção */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} color="var(--purple-light)" strokeWidth={2} />
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[ChevronLeft, ChevronRight].map((Btn, i) => (
            <button
              key={i}
              onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-secondary)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Btn size={13} />
            </button>
          ))}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingInline: '24px',
          paddingBottom: 12,
          scrollbarWidth: 'none',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ─── Skeleton ─── */
function SkeletonHero() {
  return (
    <div className="skeleton" style={{ height: 320, width: '100%', borderRadius: 0 }} />
  );
}

function SkeletonCarousel() {
  return (
    <section style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 24px', marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: 140, height: 18, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, paddingInline: '24px', overflow: 'hidden' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ flexShrink: 0 }}>
            <div className="skeleton" style={{ width: 160, height: 240, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 4, marginTop: 8 }} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Hero (banner principal) ─── */
function Hero({ media }) {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const items = media.slice(0, 5);
  const current = items[idx];

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!current) return null;

  const title = current.title?.english || current.title?.romaji || '';
  const score = current.averageScore ? (current.averageScore / 10).toFixed(1) : null;

  return (
    <div style={{ position: 'relative', height: 320, overflow: 'hidden', marginBottom: 36 }}>
      {/* Imagem de fundo */}
      <div
        key={current.id}
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${current.bannerImage || current.coverImage?.extraLarge})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          animation: 'fadeIn 0.7s ease',
        }}
      />

      {/* Gradientes: lateral + inferior */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(10,10,15,0.92) 35%, rgba(10,10,15,0.3) 70%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.4) 40%, transparent 75%)',
      }} />

      {/* Conteúdo */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 32px 24px',
      }}>
        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
          <span style={{
            background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
            borderRadius: 20, padding: '2px 10px',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', color: '#fff',
          }}>EM DESTAQUE</span>
          {current.format && (
            <span style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'rgba(255,255,255,0.7)',
            }}>{current.format}</span>
          )}
          {current.seasonYear && (
            <span style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '2px 8px', fontSize: 10, color: 'rgba(255,255,255,0.7)',
            }}>{current.seasonYear}</span>
          )}
        </div>

        {/* Título */}
        <h1 style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1.15,
          letterSpacing: '-0.02em', maxWidth: 480, marginBottom: 8,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title}
        </h1>

        {/* Score + genres */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {score && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>
              <Star size={13} fill="#fbbf24" /> {score}
            </div>
          )}
          {current.episodes && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{current.episodes} eps</span>
          )}
          {current.genres?.slice(0, 3).map(g => (
            <span key={g} style={{
              background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(124,58,237,0.4)',
              borderRadius: 20, padding: '2px 9px', fontSize: 11, color: 'var(--purple-light)',
            }}>{g}</span>
          ))}
        </div>

        {/* Botão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(`/anime/${current.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
              color: '#fff', borderRadius: 9, padding: '9px 20px',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Info size={14} /> Ver Detalhes
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 20 : 6, height: 6,
                  borderRadius: 3, border: 'none', padding: 0,
                  background: i === idx ? 'var(--purple)' : 'rgba(255,255,255,0.25)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── API offline banner ─── */
function ApiOfflineBanner() {
  return (
    <div style={{
      margin: '0 24px 28px',
      background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fbbf24' }}>AniList API temporariamente indisponível</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          Os servidores da AniList estão instáveis. As seções voltarão quando a API se recuperar.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        style={{
          flexShrink: 0,
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 8, padding: '6px 12px',
          color: '#fbbf24', fontSize: 12, fontWeight: 600,
        }}
      >Recarregar</button>
    </div>
  );
}

/* ════════════════════════════════════════
   HOME
════════════════════════════════════════ */
export default function Home() {
  useTitle('Home');
  const [trending, setTrending] = useState([]);
  const [seasonal, setSeasonal] = useState([]);
  const [recItems, setRecItems] = useState([]);
  const [recGenre, setRecGenre] = useState('');
  const [watching, setWatching] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);

  const topGenres = getUserTopGenres(3);
  const hasRecs   = topGenres.length > 0;

  useEffect(() => {
    /* "Continuar assistindo" vem do localStorage — síncrono */
    setWatching(getByListStatus('WATCHING'));

    const year   = new Date().getFullYear();
    const season = getCurrentSeason();
    const genre  = topGenres[0] || '';
    if (genre) setRecGenre(genre);

    const homeQuery = queryAniList(HOME_BATCH_QUERY, { season, year });
    const recQuery  = hasRecs ? fetchRecommendationsByGenre(genre, 20) : Promise.resolve([]);

    Promise.allSettled([homeQuery, recQuery]).then(([home, rec]) => {
      if (home.status === 'fulfilled') {
        const d = home.value;
        setTrending(d.trending?.media || []);
        setSeasonal(d.seasonal?.media || []);
      } else {
        console.warn('[Nakama] Home batch falhou:', home.reason?.message);
        setApiError(true);
      }
      if (rec.status === 'fulfilled' && Array.isArray(rec.value)) {
        setRecItems(rec.value.slice(0, 20));
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        <SkeletonHero />
        <div style={{ paddingTop: 8 }}>
          <SkeletonCarousel />
          <SkeletonCarousel />
          <SkeletonCarousel />
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.35s ease', paddingBottom: 48 }}>
      <Hero media={trending} />

      {apiError && <ApiOfflineBanner />}

      {/* 1. Continuar assistindo */}
      {watching.length > 0 && (
        <Carousel title="Continuar Assistindo" icon={Play} count={watching.length}>
          {watching.map(item => <ContinueCard key={item.id} item={item} />)}
        </Carousel>
      )}

      {/* 2. Em Alta */}
      {trending.length > 0 && (
        <Carousel title="Em Alta" icon={Flame} count={trending.length}>
          {trending.map(m => <NCard key={m.id} media={m} />)}
        </Carousel>
      )}

      {/* 3. Temporada Atual */}
      {seasonal.length > 0 && (
        <Carousel title="Temporada Atual" icon={Tv} count={seasonal.length}>
          {seasonal.map(m => <NCard key={m.id} media={m} />)}
        </Carousel>
      )}

      {/* 4. Recomendado para você */}
      {recItems.length > 0 && (
        <Carousel title={`Recomendado — ${recGenre}`} icon={Sparkles} count={recItems.length}>
          {recItems.map(m => <NCard key={m.id} media={m} />)}
        </Carousel>
      )}
    </div>
  );
}
