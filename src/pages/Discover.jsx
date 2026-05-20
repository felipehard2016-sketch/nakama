import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryAniList, SEARCH_MEDIA } from '../lib/anilist';
import {
  getUserTopGenres,
  getSavedMediaIds,
  fetchRecommendationsByGenre,
  getRecommendationReason,
} from '../lib/recommendations';
import AnimeCard from '../components/ui/AnimeCard';
import { useTitle } from '../hooks/useTitle';
import {
  Compass, Sparkles, Star, Clock, Shuffle, Gem,
  ChevronLeft, ChevronRight, ArrowRight, Zap,
} from 'lucide-react';

/* ─── Deterministic "anime do dia" por dia do ano ─── */
function getDayIndex() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  return Math.floor((Date.now() - start) / 86_400_000);
}

/* ─── Skeleton card ─── */
function SkeletonCard({ tall = false }) {
  return (
    <div className="skeleton" style={{
      borderRadius: 12, flexShrink: 0,
      width: tall ? 150 : 150, height: tall ? 225 : 225,
    }} />
  );
}

/* ─── Seção com carrossel ─── */
function Section({ title, icon: Icon, accent, children, action, actionLabel }) {
  const [ref, setRef] = useState(null);
  const scroll = dir => ref?.scrollBy({ left: dir * 600, behavior: 'smooth' });

  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Icon size={17} color={accent || 'var(--purple-light)'} />
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {action && (
            <button
              onClick={action}
              style={{
                fontSize: 12.5, fontWeight: 600, color: 'var(--purple-light)',
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 8, padding: '5px 12px', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
            >
              {actionLabel} <ArrowRight size={12} />
            </button>
          )}
          {[ChevronLeft, ChevronRight].map((Btn, i) => (
            <button key={i} onClick={() => scroll(i === 0 ? -1 : 1)} style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Btn size={13} />
            </button>
          ))}
        </div>
      </div>
      <div ref={setRef} style={{
        display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none',
        paddingInline: '40px', paddingBottom: 6,
      }}>
        {children}
      </div>
    </section>
  );
}

/* ─── Card Anime do Dia ─── */
function AnimeOfDayCard({ media }) {
  const navigate = useNavigate();
  if (!media) return null;
  const title = media.title?.english || media.title?.romaji;
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;

  return (
    <div style={{
      margin: '0 40px 56px',
      position: 'relative', overflow: 'hidden', borderRadius: 20,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      cursor: 'pointer', minHeight: 220,
      display: 'flex', alignItems: 'stretch',
    }}
      onClick={() => navigate(`/anime/${media.id}`)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* Background blur */}
      {(media.bannerImage || media.coverImage?.extraLarge) && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${media.bannerImage || media.coverImage?.extraLarge})`,
          backgroundSize: 'cover', backgroundPosition: 'center top',
          filter: 'blur(0px)', opacity: 0.18,
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, var(--bg-card) 30%, transparent 70%)',
      }} />

      {/* Cover */}
      <img
        src={media.coverImage?.extraLarge || media.coverImage?.large}
        alt={title}
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '35%', objectFit: 'cover',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, transparent 100%)',
        }}
      />

      {/* Info */}
      <div style={{ position: 'relative', zIndex: 2, padding: '28px 32px', flex: 1, maxWidth: '65%' }}>
        <div style={{
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--purple-light)', textTransform: 'uppercase', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Sparkles size={12} /> Anime do Dia
        </div>
        <h3 style={{ fontSize: 'clamp(18px, 2vw, 26px)', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 10 }}>
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {score && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>
              <Star size={13} fill="#fbbf24" /> {score}
            </div>
          )}
          {media.format && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{media.format}</span>
          )}
          {media.episodes && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{media.episodes} eps</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {media.genres?.slice(0, 3).map(g => (
            <span key={g} style={{
              background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: 20, padding: '3px 10px', fontSize: 11.5, color: 'var(--purple-light)',
            }}>{g}</span>
          ))}
        </div>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
          color: '#fff', borderRadius: 10, padding: '10px 20px',
          fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
        }}>
          Ver detalhes <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─── Botão Surpreenda-me ─── */
function SurpriseButton({ onClick, loading }) {
  return (
    <div style={{
      margin: '0 40px 56px',
      background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.06))',
      border: '1px dashed rgba(124,58,237,0.4)',
      borderRadius: 16,
      padding: '28px 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      flexWrap: 'wrap',
    }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          ✨ Surpreenda-me
        </h3>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', maxWidth: 420 }}>
          Abre um anime aleatório dos seus gêneros favoritos que você ainda não assistiu. Deixa o destino decidir!
        </p>
      </div>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0,
          background: loading ? 'rgba(124,58,237,0.25)' : 'linear-gradient(90deg, var(--purple), #4f46e5)',
          color: '#fff', borderRadius: 12, padding: '13px 26px',
          fontSize: 14, fontWeight: 700,
          boxShadow: loading ? 'none' : '0 4px 20px rgba(124,58,237,0.4)',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {loading
          ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          : <Shuffle size={16} />
        }
        {loading ? 'Procurando...' : 'Sortear anime'}
      </button>
    </div>
  );
}

/* ─── Página principal ─── */
export default function Discover() {
  useTitle('Descobrir');
  const navigate = useNavigate();

  const [animeOfDay, setAnimeOfDay]     = useState(null);
  const [hidden, setHidden]             = useState([]);
  const [classics, setClassics]         = useState([]);
  const [recommended, setRecommended]   = useState([]);
  const [topGenre, setTopGenre]         = useState('');
  const [loading, setLoading]           = useState(true);
  const [surpriseLoading, setSurprise]  = useState(false);

  const topGenres = getUserTopGenres(3);
  const hasGenres = topGenres.length > 0;

  useEffect(() => {
    const saved  = getSavedMediaIds();
    const genre  = topGenres[0] || 'Action';
    setTopGenre(genre);

    Promise.allSettled([
      /* Anime do dia: Top 50 históricos */
      queryAniList(SEARCH_MEDIA, { type: 'ANIME', sort: ['SCORE_DESC'], minScore: 79, page: 1, perPage: 50 }),
      /* Gemas escondidas: alta nota, página 4-6 (menos popular) */
      queryAniList(SEARCH_MEDIA, { type: 'ANIME', sort: ['SCORE_DESC'], minScore: 79, page: 4, perPage: 20 }),
      /* Clássicos: anterior a 2010 */
      queryAniList(SEARCH_MEDIA, { type: 'ANIME', sort: ['SCORE_DESC'], minScore: 74, page: 1, perPage: 40 }),
      /* Recomendados: gênero favorito */
      hasGenres
        ? fetchRecommendationsByGenre(genre, 16)
        : queryAniList(SEARCH_MEDIA, { type: 'ANIME', sort: ['TRENDING_DESC'], page: 1, perPage: 16 })
          .then(d => d.Page.media),
    ]).then(([aod, gems, cls, rec]) => {
      if (aod.status === 'fulfilled') {
        const list = aod.value.Page.media;
        setAnimeOfDay(list[getDayIndex() % list.length] || null);
      }
      if (gems.status === 'fulfilled') {
        setHidden(gems.value.Page.media.filter(m => !saved.has(String(m.id))).slice(0, 14));
      }
      if (cls.status === 'fulfilled') {
        const pre2010 = cls.value.Page.media.filter(m => m.seasonYear && m.seasonYear <= 2010 && !saved.has(String(m.id)));
        setClassics(pre2010.slice(0, 14));
      }
      if (rec.status === 'fulfilled') {
        const list = Array.isArray(rec.value) ? rec.value : rec.value.Page?.media || [];
        setRecommended(list.filter(m => !saved.has(String(m.id))).slice(0, 14));
      }
    }).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSurprise = useCallback(async () => {
    setSurprise(true);
    try {
      const genres = getUserTopGenres(3);
      const genre  = genres.length
        ? genres[Math.floor(Math.random() * genres.length)]
        : 'Action';
      const page = Math.floor(Math.random() * 5) + 1;
      const data = await queryAniList(SEARCH_MEDIA, {
        type: 'ANIME', genre, sort: ['SCORE_DESC'], minScore: 69, page, perPage: 20,
      });
      const saved  = getSavedMediaIds();
      const unseen = (data.Page.media || []).filter(m => !saved.has(String(m.id)));
      if (unseen.length > 0) {
        navigate(`/anime/${unseen[Math.floor(Math.random() * unseen.length)].id}`);
      }
    } finally {
      setSurprise(false);
    }
  }, [navigate]);

  const skeletons = n => Array.from({ length: n }, (_, i) => <SkeletonCard key={i} />);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', paddingBottom: 60 }}>

      {/* ── Hero header ── */}
      <div style={{
        padding: '40px 40px 32px',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
        marginBottom: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
          <Compass size={26} color="var(--purple-light)" />
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.03em' }}>Descobrir</h1>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520 }}>
          Explore títulos que você ainda não conhece, baseados nos seus gostos e nas maiores notas da comunidade.
        </p>
      </div>

      {/* ── Anime do Dia ── */}
      {(loading || animeOfDay) && (
        <>
          <div style={{ padding: '0 40px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color="#fbbf24" />
              <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Anime do Dia</h2>
            </div>
          </div>
          {loading
            ? <div className="skeleton" style={{ height: 220, borderRadius: 20, margin: '0 40px 56px' }} />
            : <AnimeOfDayCard media={animeOfDay} />
          }
        </>
      )}

      {/* ── Surpreenda-me ── */}
      <SurpriseButton onClick={handleSurprise} loading={surpriseLoading} />

      {/* ── Recomendado para você ── */}
      {hasGenres && (
        <Section
          title={`Baseado em ${topGenre}`}
          icon={Zap}
          accent="#a78bfa"
        >
          {loading
            ? skeletons(8)
            : recommended.map(m => <AnimeCard key={m.id} media={m} size="md" subtitle={getRecommendationReason(m, topGenres)} />)
          }
        </Section>
      )}

      {/* ── Gemas escondidas ── */}
      <Section title="Gemas Escondidas" icon={Gem} accent="#fbbf24">
        {loading
          ? skeletons(8)
          : hidden.map(m => <AnimeCard key={m.id} media={m} size="md" />)
        }
      </Section>

      {/* ── Clássicos que você perdeu ── */}
      <Section title="Clássicos — Antes de 2010" icon={Clock} accent="#60a5fa">
        {loading
          ? skeletons(8)
          : classics.map(m => <AnimeCard key={m.id} media={m} size="md" />)
        }
      </Section>
    </div>
  );
}
