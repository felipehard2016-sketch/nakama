import { useNavigate } from 'react-router-dom';
import { Star, Play } from 'lucide-react';

export default function AnimeCard({ media, size = 'md' }) {
  const navigate = useNavigate();

  /* Guard: dados podem vir incompletos da API ou do cache */
  if (!media?.id) return null;

  const title       = media.title?.english || media.title?.romaji || 'Sem título';
  const score       = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  const accentColor = media.coverImage?.color || 'var(--purple)';
  const coverSrc    = media.coverImage?.extraLarge || media.coverImage?.large || null;

  const isLg = size === 'lg';

  return (
    <div
      onClick={() => navigate(`/anime/${media.id}`)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: isLg ? 14 : 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        flexShrink: 0,
        width: isLg ? 200 : 150,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px ${accentColor}55`;
        e.currentTarget.style.borderColor = `${accentColor}88`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      <div style={{ position: 'relative', paddingBottom: '145%', overflow: 'hidden' }}>
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={title}
            loading="lazy"
            decoding="async"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          /* Placeholder quando não há capa */
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.06))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={28} color="rgba(124,58,237,0.3)" />
          </div>
        )}

        {/* Score badge */}
        {score && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 7,
            padding: '3px 7px',
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11.5, fontWeight: 700, color: '#fbbf24',
          }}>
            <Star size={9} fill="#fbbf24" color="#fbbf24" />
            {score}
          </div>
        )}

        {/* Format badge */}
        {media.format && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            borderRadius: 5,
            padding: '2px 7px',
            fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
            letterSpacing: '0.04em',
          }}>
            {media.format}
          </div>
        )}

        {/* Hover overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = '0'}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(124,58,237,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={16} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />
          </div>
        </div>
      </div>

      <div style={{ padding: isLg ? '12px 14px' : '9px 11px' }}>
        <p style={{
          fontSize: isLg ? 13.5 : 12.5,
          fontWeight: 600,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.4,
        }}>
          {title}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>
          {media.seasonYear || '—'}
          {media.episodes ? ` · ${media.episodes} eps` : ''}
          {media.chapters  ? ` · ${media.chapters} caps` : ''}
        </p>
      </div>
    </div>
  );
}
