import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queryAniList, STUDIO_DETAILS } from '../lib/anilist';
import { useTitle } from '../hooks/useTitle';
import AnimeCard from '../components/ui/AnimeCard';
import { ArrowLeft, Clapperboard, Star, Film, Tv, BookOpen } from 'lucide-react';

const FORMAT_GROUPS = {
  TV:     ['TV', 'TV_SHORT'],
  Filme:  ['MOVIE'],
  OVA:    ['OVA', 'ONA', 'SPECIAL', 'MUSIC'],
};

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', flexDirection: 'column', gap: 14 }}>
      <div style={{ width: 44, height: 44, border: '3px solid rgba(124,58,237,0.2)', borderTop: '3px solid var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando estúdio...</p>
    </div>
  );
}

export default function StudioPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [studio, setStudio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('TV');
  const [pageTitle, setPageTitle] = useState(null);
  useTitle(pageTitle);

  useEffect(() => {
    setLoading(true);
    queryAniList(STUDIO_DETAILS, { id: parseInt(id) })
      .then(data => {
        setStudio(data.Studio);
        setPageTitle(data.Studio.name);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!studio) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Estúdio não encontrado.</div>;

  const allMedia = studio.media?.nodes || [];
  const avgScore = allMedia.length
    ? (allMedia.filter(m => m.averageScore).reduce((s, m) => s + m.averageScore, 0) /
       allMedia.filter(m => m.averageScore).length / 10).toFixed(1)
    : null;

  const years = allMedia.map(m => m.seasonYear).filter(Boolean);
  const firstYear = years.length ? Math.min(...years) : null;

  const filteredMedia = allMedia.filter(m =>
    FORMAT_GROUPS[activeGroup]?.includes(m.format)
  );

  return (
    <div style={{ animation: 'fadeIn 0.35s ease', paddingBottom: 60 }}>

      {/* ── Banner-like header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.06))',
        borderBottom: '1px solid var(--border)',
        padding: '32px 40px 28px',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--text-muted)', fontSize: 13, marginBottom: 20,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--purple), #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
          }}>
            <Clapperboard size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, letterSpacing: '-0.025em' }}>
              {studio.name}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {studio.isAnimationStudio ? 'Estúdio de Animação' : 'Estúdio de Produção'}
              {firstYear && ` · Desde ${firstYear}`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { icon: Film, label: 'Obras', value: allMedia.length },
            avgScore && { icon: Star, label: 'Nota média', value: avgScore, accent: '#fbbf24' },
            { icon: BookOpen, label: 'Favoritos', value: studio.favourites?.toLocaleString() },
          ].filter(Boolean).map(({ icon: Icon, label, value, accent }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon size={14} color={accent || 'var(--purple-light)'} />
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: accent || 'var(--text)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filtros por formato ── */}
      <div style={{ padding: '24px 40px 0', display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        {Object.entries(FORMAT_GROUPS).map(([label, fmts]) => {
          const count = allMedia.filter(m => fmts.includes(m.format)).length;
          if (!count) return null;
          return (
            <button
              key={label}
              onClick={() => setActiveGroup(label)}
              style={{
                padding: '10px 18px', fontSize: 13.5, fontWeight: 600,
                color: activeGroup === label ? 'var(--purple-light)' : 'var(--text-muted)',
                borderBottom: activeGroup === label ? '2px solid var(--purple)' : '2px solid transparent',
                marginBottom: -1, background: 'none', transition: 'color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              <span style={{
                background: activeGroup === label ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                color: activeGroup === label ? 'var(--purple-light)' : 'var(--text-muted)',
                borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid de obras ── */}
      <div style={{ padding: '0 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 16 }}>
        {filteredMedia.map(m => (
          <AnimeCard key={m.id} media={m} size="md" />
        ))}
        {filteredMedia.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Nenhuma obra nesta categoria.
          </div>
        )}
      </div>
    </div>
  );
}
