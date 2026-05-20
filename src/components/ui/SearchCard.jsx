import { useNavigate } from 'react-router-dom';
import { Star, Tv, BookOpen, Plus, Check } from 'lucide-react';

const STATUS_LABEL = {
  FINISHED: 'Finalizado',
  RELEASING: 'Em lançamento',
  NOT_YET_RELEASED: 'Em breve',
  CANCELLED: 'Cancelado',
  HIATUS: 'Hiato',
};

const STATUS_COLOR = {
  FINISHED: '#64748b',
  RELEASING: '#22c55e',
  NOT_YET_RELEASED: '#f59e0b',
  CANCELLED: '#ef4444',
  HIATUS: '#f97316',
};

const LIST_STATUS_STYLE = {
  WATCHING:       { label: 'Assistindo',    bg: 'rgba(124,58,237,0.2)',  color: '#a78bfa', border: 'rgba(124,58,237,0.4)' },
  COMPLETED:      { label: 'Completo',      bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  ON_HOLD:        { label: 'Em pausa',      bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  DROPPED:        { label: 'Abandonado',    bg: 'rgba(239,68,68,0.15)',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  PLAN_TO_WATCH:  { label: 'Planejado',     bg: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
};

export default function SearchCard({ media, listStatus = null }) {
  const navigate = useNavigate();
  const title = media.title.english || media.title.romaji;
  const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  const isAnime = media.format !== 'MANGA' && media.format !== 'NOVEL' && media.format !== 'ONE_SHOT';
  const desc = media.description
    ? media.description.replace(/<[^>]*>/g, '').slice(0, 120).trimEnd() + '…'
    : null;

  const ls = listStatus ? LIST_STATUS_STYLE[listStatus] : null;

  return (
    <div
      onClick={() => navigate(`/anime/${media.id}`)}
      style={{
        display: 'flex',
        gap: 0,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.55)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Cover */}
      <div style={{ position: 'relative', width: 90, flexShrink: 0 }}>
        <img
          src={media.coverImage.large}
          alt={title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Score overlay */}
        {score && (
          <div style={{
            position: 'absolute', bottom: 6, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.82)',
              backdropFilter: 'blur(4px)',
              borderRadius: 6,
              padding: '2px 8px',
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: 11.5, fontWeight: 700, color: '#fbbf24',
            }}>
              <Star size={9} fill="#fbbf24" color="#fbbf24" />
              {score}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, padding: '13px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
            <h3 style={{
              fontSize: 14, fontWeight: 700, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              lineHeight: 1.35, flex: 1,
            }}>
              {title}
            </h3>

            {/* List status badge */}
            {ls && (
              <div style={{
                flexShrink: 0,
                background: ls.bg,
                border: `1px solid ${ls.border}`,
                borderRadius: 6, padding: '2px 8px',
                fontSize: 10.5, fontWeight: 600, color: ls.color,
                display: 'flex', alignItems: 'center', gap: 3,
                whiteSpace: 'nowrap',
              }}>
                <Check size={9} />
                {ls.label}
              </div>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12 }}>
              {isAnime ? <Tv size={11} /> : <BookOpen size={11} />}
              <span>{media.format || (isAnime ? 'TV' : 'Manga')}</span>
            </div>

            {media.seasonYear && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{media.seasonYear}</span>
              </>
            )}

            {(isAnime ? media.episodes : media.chapters) && (
              <>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {isAnime
                    ? `${media.episodes} eps`
                    : `${media.chapters} caps`}
                </span>
              </>
            )}

            {/* Status dot */}
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: STATUS_COLOR[media.status] || '#64748b',
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 11.5, color: STATUS_COLOR[media.status] || 'var(--text-muted)' }}>
                {STATUS_LABEL[media.status] || media.status}
              </span>
            </div>
          </div>

          {/* Description */}
          {desc && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 10 }}>
              {desc}
            </p>
          )}
        </div>

        {/* Genres */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {media.genres?.slice(0, 4).map(g => (
            <span key={g} style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 5, padding: '2px 8px',
              fontSize: 10.5, color: 'var(--purple-light)', fontWeight: 500,
            }}>
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Action column */}
      <div
        style={{
          flexShrink: 0, width: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderLeft: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          title="Adicionar à lista"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: listStatus ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${listStatus ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
            color: listStatus ? 'var(--purple-light)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.25)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => {
            e.currentTarget.style.background = listStatus ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)';
            e.currentTarget.style.color = listStatus ? 'var(--purple-light)' : 'var(--text-muted)';
          }}
        >
          {listStatus ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
    </div>
  );
}
