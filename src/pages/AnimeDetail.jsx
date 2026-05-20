import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queryAniList, MEDIA_DETAILS } from '../lib/anilist';
import { getMedia, saveMedia, syncItemToSupabase } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTitle } from '../hooks/useTitle';
import { getWatchedEpisodes, markEpisode } from '../lib/episodeProgress';
import {
  Star, ArrowLeft, Play, BookOpen, Heart, Plus, Check,
  ChevronDown, ChevronRight, ChevronLeft, Minus, Users,
  Clapperboard, Calendar, Clock, Tv, Hash, ExternalLink,
  RefreshCw, Film,
} from 'lucide-react';

/* ─── Maps ─── */
const STATUS_MAP = {
  FINISHED:         { label: 'Finalizado',     color: '#64748b' },
  RELEASING:        { label: 'Em lançamento',  color: '#22c55e' },
  NOT_YET_RELEASED: { label: 'Em breve',       color: '#f59e0b' },
  CANCELLED:        { label: 'Cancelado',      color: '#ef4444' },
  HIATUS:           { label: 'Hiato',          color: '#f97316' },
};

const SOURCE_MAP = {
  ORIGINAL:      'Original',
  MANGA:         'Mangá',
  LIGHT_NOVEL:   'Light Novel',
  VISUAL_NOVEL:  'Visual Novel',
  VIDEO_GAME:    'Video Game',
  NOVEL:         'Novel',
  DOUJINSHI:     'Doujinshi',
  ANIME:         'Anime',
  MUSIC:         'Música',
  OTHER:         'Outro',
};

const SEASON_MAP = {
  WINTER: 'Inverno', SPRING: 'Primavera', SUMMER: 'Verão', FALL: 'Outono',
};

const LIST_STATUSES = [
  { value: 'WATCHING',      label: 'Assistindo',   color: '#a78bfa' },
  { value: 'COMPLETED',     label: 'Completo',     color: '#4ade80' },
  { value: 'ON_HOLD',       label: 'Em pausa',     color: '#fbbf24' },
  { value: 'DROPPED',       label: 'Abandonado',   color: '#f87171' },
  { value: 'PLAN_TO_WATCH', label: 'Planejado',    color: '#60a5fa' },
];

/* ─── Loading ─── */
function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: 14 }}>
      <div style={{
        width: 44, height: 44,
        border: '3px solid rgba(124,58,237,0.2)',
        borderTop: '3px solid var(--purple)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Carregando...</p>
    </div>
  );
}

/* ─── Stat box ─── */
function StatBox({ icon: Icon, label, value, accent }) {
  if (!value) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 16px',
      display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={13} color={accent || 'var(--purple-light)'} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: accent || 'var(--text)' }}>{value}</span>
    </div>
  );
}

/* ─── Botão Adicionar à Lista ─── */
function AddToListButton({ listStatus, onChangeStatus }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LIST_STATUSES.find(s => s.value === listStatus);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: current
            ? `rgba(${current.color === '#a78bfa' ? '167,139,250' : current.color === '#4ade80' ? '74,222,128' : current.color === '#fbbf24' ? '251,191,36' : current.color === '#f87171' ? '248,113,113' : '96,165,250'},0.15)`
            : 'linear-gradient(90deg, var(--purple), #4f46e5)',
          border: current ? `1px solid ${current.color}55` : 'none',
          color: current ? current.color : '#fff',
          borderRadius: 10, padding: '11px 18px',
          fontSize: 13.5, fontWeight: 700,
          boxShadow: current ? 'none' : '0 4px 20px rgba(124,58,237,0.35)',
          transition: 'opacity 0.15s',
          minWidth: 165,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {current ? <Check size={15} /> : <Plus size={15} />}
        {current ? current.label : 'Adicionar à Lista'}
        <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#1a1a28', border: '1px solid var(--border)',
          borderRadius: 10, overflow: 'hidden', zIndex: 200,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          minWidth: 165,
          animation: 'fadeIn 0.15s ease',
        }}>
          {LIST_STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => { onChangeStatus(s.value === listStatus ? null : s.value); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                width: '100%', padding: '10px 14px',
                color: s.value === listStatus ? s.color : 'var(--text-secondary)',
                background: s.value === listStatus ? `${s.color}18` : 'transparent',
                fontSize: 13, fontWeight: s.value === listStatus ? 600 : 400,
                textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (s.value !== listStatus) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (s.value !== listStatus) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              {s.label}
              {s.value === listStatus && <Check size={12} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
          {listStatus && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <button
                onClick={() => { onChangeStatus(null); setOpen(false); }}
                style={{ width: '100%', padding: '9px 14px', color: '#f87171', fontSize: 12, textAlign: 'left' }}
              >
                Remover da lista
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Controle de Progresso ─── */
function ProgressTracker({ total, unit, progress, onProgress, isReleasing }) {
  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef(null);

  /*
   * One Piece e séries em andamento sem total definido:
   * → não limitar o progresso, mostrar "?" no total
   * Séries finalizadas com total definido: limitar ao total
   */
  const knownTotal = total && !isReleasing ? total : null; // null = ilimitado
  const cap = v => Math.max(0, knownTotal ? Math.min(knownTotal, v) : v);

  const pct = total
    ? Math.min(100, Math.round((progress / total) * 100))
    : null; // sem barra quando total desconhecido

  /* Botões de ajuste */
  const adjust = delta => onProgress(cap(progress + delta));

  /* Edição inline */
  const startEdit = () => {
    setInputVal(String(progress));
    setEditing(true);
    setTimeout(() => { inputRef.current?.select(); }, 0);
  };

  const confirmEdit = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n) && n >= 0) onProgress(cap(n));
    setEditing(false);
  };

  const handleKey = e => {
    if (e.key === 'Enter')  confirmEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  /* Estilo base dos botões de controle */
  const btnBase = (accent) => ({
    height: 32, borderRadius: 8, border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.15s', whiteSpace: 'nowrap', padding: '0 10px',
    ...(accent
      ? { background: 'rgba(124,58,237,0.15)', borderColor: 'rgba(124,58,237,0.4)', color: 'var(--purple-light)' }
      : { background: 'rgba(255,255,255,0.06)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }
    ),
  });

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px', minWidth: 290,
    }}>
      {/* Header: label + "X / total" */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {unit === 'ep' ? 'Progresso' : 'Capítulos lidos'}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-light)' }}>
          {progress} / {total || '?'} {unit === 'ep' ? 'eps' : 'caps'}
        </span>
      </div>

      {/* Barra (só quando total conhecido) */}
      {pct !== null && (
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--purple), var(--blue-light))',
            borderRadius: 2, transition: 'width 0.3s',
          }} />
        </div>
      )}

      {/* Linha de controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* − */}
        <button onClick={() => adjust(-1)} style={btnBase(false)}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        ><Minus size={13} /></button>

        {/* Número editável */}
        <div
          style={{ flex: 1, textAlign: 'center', cursor: 'text' }}
          onClick={!editing ? startEdit : undefined}
        >
          {editing ? (
            <input
              ref={inputRef}
              type="number"
              min={0}
              max={knownTotal || undefined}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onBlur={confirmEdit}
              onKeyDown={handleKey}
              style={{
                width: '100%', textAlign: 'center',
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid var(--purple)',
                borderRadius: 8, padding: '4px 6px',
                color: 'var(--text)', fontSize: 20, fontWeight: 800,
                outline: 'none',
                /* Esconde as setas nativas do input number */
                MozAppearance: 'textfield',
              }}
            />
          ) : (
            <div
              title="Clique para editar"
              style={{
                fontSize: 20, fontWeight: 800, color: 'var(--text)',
                padding: '2px 4px', borderRadius: 8,
                border: '1px solid transparent',
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
            >
              {progress}
            </div>
          )}
        </div>

        {/* + */}
        <button onClick={() => adjust(1)} style={btnBase(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = 'var(--purple-light)'; }}
        ><Plus size={13} /></button>

        {/* +5 */}
        <button onClick={() => adjust(5)} style={btnBase(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = 'var(--purple-light)'; }}
        >+5</button>

        {/* +10 */}
        <button onClick={() => adjust(10)} style={btnBase(true)}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = 'var(--purple-light)'; }}
        >+10</button>
      </div>

      {/* Dica de edição inline */}
      {!editing && (
        <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', opacity: 0.6 }}>
          Clique no número para editar diretamente
        </p>
      )}
    </div>
  );
}

/* ─── Carrossel genérico ─── */
function ScrollRow({ children }) {
  const ref = useRef(null);
  const scroll = dir => ref.current?.scrollBy({ left: dir * 480, behavior: 'smooth' });
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => scroll(-1)} style={{
        position: 'absolute', left: -14, top: '40%', zIndex: 10,
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', transition: 'all 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ChevronLeft size={14} />
      </button>

      <div ref={ref} style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
        {children}
      </div>

      <button onClick={() => scroll(1)} style={{
        position: 'absolute', right: -14, top: '40%', zIndex: 10,
        width: 30, height: 30, borderRadius: '50%',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', transition: 'all 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ─── Section header ─── */
function SectionTitle({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
      <Icon size={17} color="var(--purple-light)" strokeWidth={2} />
      <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{children}</h2>
    </div>
  );
}

/* ─── Nota em estrelas (meia-estrela, 1-10) ─── */
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(null);
  const display = hover ?? value ?? 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1 }} onMouseLeave={() => setHover(null)}>
      {Array.from({ length: 10 }, (_, i) => {
        const full = i + 1;
        const half = i + 0.5;
        const filled = display >= full ? 1 : display >= half ? 0.5 : 0;
        return (
          <div key={i} style={{ position: 'relative', width: 20, height: 20, cursor: 'pointer', flexShrink: 0 }}>
            {/* Empty star */}
            <Star size={20} color="rgba(255,255,255,0.15)" fill="rgba(255,255,255,0.04)" />
            {/* Filled overlay */}
            {filled > 0 && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: filled === 1 ? '100%' : '50%', pointerEvents: 'none' }}>
                <Star size={20} color="#fbbf24" fill="#fbbf24" />
              </div>
            )}
            {/* Left half — half star */}
            <div
              style={{ position: 'absolute', inset: 0, width: '50%' }}
              onMouseEnter={() => setHover(half)}
              onClick={() => onChange(value === half ? null : half)}
            />
            {/* Right half — full star */}
            <div
              style={{ position: 'absolute', inset: 0, left: '50%', width: '50%' }}
              onMouseEnter={() => setHover(full)}
              onClick={() => onChange(value === full ? null : full)}
            />
          </div>
        );
      })}
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: value ? '#fbbf24' : 'var(--text-muted)',
        marginLeft: 8, minWidth: 32,
      }}>
        {value ? `${value}/10` : '—'}
      </span>
    </div>
  );
}

/* ─── Aba de Episódios ─── */
function EpisodesTab({ media, watchedEps, onToggleEp, onMarkSeason }) {
  const [openSeasons, setOpenSeasons] = useState(new Set([0]));
  const totalEps = media.episodes || 0;

  if (!totalEps) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <Film size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Dados de episódios não disponíveis para este título.</p>
      </div>
    );
  }

  /* Mapa de episódios de streaming (AniList streamingEpisodes) */
  const streamMap = {};
  (media.streamingEpisodes || []).forEach(ep => {
    const m = ep.title?.match(/episode\s+(\d+)/i);
    if (m) streamMap[parseInt(m[1])] = ep;
  });

  /* Lista de episódios */
  const episodes = Array.from({ length: totalEps }, (_, i) => {
    const n  = i + 1;
    const st = streamMap[n];
    const rawTitle = st?.title?.replace(/^episode\s+\d+\s*[-–:]\s*/i, '').trim() || '';
    return {
      number:    n,
      title:     rawTitle || `Episódio ${n}`,
      thumbnail: st?.thumbnail || media.coverImage?.extraLarge || media.coverImage?.large,
    };
  });

  /* Agrupar em blocos de 13 (um "cour") */
  const COUR = 13;
  const seasons = [];
  for (let i = 0; i < episodes.length; i += COUR) seasons.push(episodes.slice(i, i + COUR));

  /* "Continuar assistindo": próximos não-assistidos */
  const nextEps = episodes.filter(ep => !watchedEps.has(ep.number)).slice(0, 8);

  const toggleSeason = idx => {
    setOpenSeasons(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  return (
    <div>
      {/* ── Continuar assistindo ── */}
      {nextEps.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
            {watchedEps.size > 0 ? '▶ Continuar assistindo' : '▶ Começar a assistir'}
          </h3>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {nextEps.map(ep => {
              const watched = watchedEps.has(ep.number);
              return (
                <div key={ep.number} style={{
                  flexShrink: 0, width: 192,
                  background: 'var(--bg-card)',
                  border: `1px solid ${watched ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`,
                  borderRadius: 10, overflow: 'hidden',
                  transition: 'transform 0.15s, border-color 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                    <img src={ep.thumbnail} alt="" loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    {watched && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Check size={26} color="#4ade80" strokeWidth={2.5} />
                      </div>
                    )}
                    <div style={{
                      position: 'absolute', top: 6, left: 6,
                      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
                      borderRadius: 4, padding: '2px 7px',
                      fontSize: 10.5, fontWeight: 700, color: 'var(--text)',
                    }}>E{String(ep.number).padStart(2, '0')}</div>
                    <button
                      onClick={() => onToggleEp(ep.number)}
                      style={{
                        position: 'absolute', bottom: 6, right: 6,
                        background: watched ? 'rgba(74,222,128,0.9)' : 'rgba(124,58,237,0.9)',
                        border: 'none', borderRadius: 6, padding: '4px 9px',
                        color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 3,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      <Check size={10} strokeWidth={3} /> {watched ? 'Assistido' : 'Marcar'}
                    </button>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{
                      fontSize: 11.5, fontWeight: 500, color: 'var(--text-secondary)',
                      lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{ep.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Todos os episódios por temporada/cour ── */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Todos os episódios</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {seasons.map((seasonEps, idx) => {
          const watchedCount = seasonEps.filter(ep => watchedEps.has(ep.number)).length;
          const isComplete   = watchedCount === seasonEps.length;
          const isOpen       = openSeasons.has(idx);
          const pct          = (watchedCount / seasonEps.length) * 100;

          return (
            <div key={idx} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isComplete ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Season header */}
              <div
                onClick={() => toggleSeason(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', cursor: 'pointer',
                  background: isComplete ? 'rgba(74,222,128,0.04)' : 'transparent',
                  userSelect: 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                      {seasons.length > 1 ? `Parte ${idx + 1}` : 'Episódios'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isComplete ? '#4ade80' : 'var(--text-muted)' }}>
                      {watchedCount}/{seasonEps.length} assistidos
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: isComplete ? '#4ade80' : pct > 0 ? '#fbbf24' : 'transparent',
                      borderRadius: 2, transition: 'width 0.35s',
                    }} />
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onMarkSeason(seasonEps, !isComplete); }}
                  style={{
                    background: isComplete ? 'rgba(74,222,128,0.15)' : 'rgba(124,58,237,0.15)',
                    border: `1px solid ${isComplete ? 'rgba(74,222,128,0.4)' : 'rgba(124,58,237,0.4)'}`,
                    borderRadius: 7, padding: '5px 11px',
                    fontSize: 11.5, fontWeight: 600, flexShrink: 0,
                    color: isComplete ? '#4ade80' : 'var(--purple-light)',
                    cursor: 'pointer',
                  }}
                >
                  {isComplete ? '✓ Completo' : 'Marcar tudo'}
                </button>
                <ChevronDown size={15} color="var(--text-muted)"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </div>

              {/* Episode rows */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {seasonEps.map(ep => {
                    const isWatched = watchedEps.has(ep.number);
                    return (
                      <div key={ep.number}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          opacity: isWatched ? 0.55 : 1, transition: 'background 0.1s, opacity 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={ep.thumbnail} alt="" loading="lazy"
                          style={{ width: 76, height: 43, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
                            {seasons.length > 1 ? `P${String(idx+1).padStart(2,'0')} · ` : ''}E{String(ep.number).padStart(2,'0')}
                          </p>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ep.title}
                          </p>
                        </div>
                        <button
                          onClick={() => onToggleEp(ep.number)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isWatched ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isWatched ? 'rgba(74,222,128,0.5)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isWatched) { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; } }}
                          onMouseLeave={e => { if (!isWatched) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                        >
                          <Check size={12} color={isWatched ? '#4ade80' : 'var(--text-muted)'} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Página ─── */
export default function AnimeDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { showToast } = useToast();

  /* Dynamic title — null safe (updates when media loads) */
  const [pageTitle, setPageTitle] = useState(null);
  useTitle(pageTitle);

  const [media, setMedia]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [listStatus, setListStatus]     = useState(null);
  const [favorited, setFavorited]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [expanded, setExpanded]         = useState(false);
  const [activeTab, setActiveTab]       = useState('sobre');
  const [userScore, setUserScore]       = useState(null);
  const [rewatchCount, setRewatchCount] = useState(0);
  const [watchedEps, setWatchedEps]     = useState(new Set());

  /* Controla se já houve uma mudança do usuário (evita sync no carregamento inicial) */
  const didMountRef  = useRef(false);
  /* Timer para debounce do sync Supabase */
  const syncTimerRef = useRef(null);

  useEffect(() => {
    didMountRef.current = false;
    setLoading(true);
    setMedia(null);
    setWatchedEps(new Set());
    setActiveTab('sobre');

    const saved = getMedia(id);
    setListStatus(saved?.listStatus || null);
    setFavorited(saved?.favorited  || false);
    setProgress(saved?.progress    || 0);
    setUserScore(saved?.userScore  || null);
    setRewatchCount(saved?.rewatchCount || 0);

    queryAniList(MEDIA_DETAILS, { id: parseInt(id) })
      .then(async data => {
        setMedia(data.Media);
        setPageTitle(data.Media.title.english || data.Media.title.romaji);
        if (user?.id) {
          const eps = await getWatchedEpisodes(user.id, parseInt(id));
          setWatchedEps(eps);
        }
      })
      .finally(() => setLoading(false));
  }, [id, user?.id]);

  /* Persistir no localStorage + sync Supabase com debounce de 800ms */
  useEffect(() => {
    if (!media) return;

    const item = {
      id:           media.id,
      listStatus,
      favorited,
      progress,
      userScore,
      rewatchCount,
      title:        media.title,
      coverImage:   media.coverImage,
      averageScore: media.averageScore,
      episodes:     media.episodes,
      chapters:     media.chapters,
      format:       media.format,
      genres:       media.genres,
      seasonYear:   media.seasonYear,
      duration:     media.duration,
      status:       media.status,
    };

    const saved = saveMedia(id, item);

    /* Não sincroniza na montagem inicial */
    if (!didMountRef.current) { didMountRef.current = true; return; }

    /* Debounce: cancela timer anterior e agenda novo sync */
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncItemToSupabase(user?.id, saved);
    }, 800);

    return () => clearTimeout(syncTimerRef.current);
  }, [id, media, listStatus, favorited, progress, userScore, rewatchCount]);

  /* ── Toggle de episódio individual ── */
  const handleToggleEp = useCallback(async (epNumber) => {
    if (!user?.id) { showToast('Faça login para marcar episódios', 'info'); return; }
    const wasWatched = watchedEps.has(epNumber);
    setWatchedEps(prev => {
      const next = new Set(prev);
      wasWatched ? next.delete(epNumber) : next.add(epNumber);
      return next;
    });
    await markEpisode(user.id, parseInt(id), epNumber, !wasWatched);
    showToast(
      wasWatched ? `Episódio ${epNumber} desmarcado` : `Ep. ${epNumber} marcado como assistido! ✓`,
      wasWatched ? 'info' : 'success',
    );
  }, [user?.id, watchedEps, id, showToast]);

  /* ── Marcar/desmarcar toda uma temporada ── */
  const handleMarkSeason = useCallback(async (seasonEps, markAll) => {
    if (!user?.id) { showToast('Faça login para marcar episódios', 'info'); return; }
    setWatchedEps(prev => {
      const next = new Set(prev);
      seasonEps.forEach(ep => markAll ? next.add(ep.number) : next.delete(ep.number));
      return next;
    });
    for (const ep of seasonEps) {
      await markEpisode(user.id, parseInt(id), ep.number, markAll);
    }
    showToast(
      markAll ? 'Temporada marcada como assistida! 🎉' : 'Temporada desmarcada',
      markAll ? 'success' : 'info',
    );
  }, [user?.id, id, showToast]);

  if (loading) return <Spinner />;
  if (!media)  return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Não encontrado.</div>;

  const title   = media.title.english || media.title.romaji;
  const score   = media.averageScore ? (media.averageScore / 10).toFixed(1) : null;
  const isAnime = !['MANGA', 'NOVEL', 'ONE_SHOT'].includes(media.format);
  const studio  = media.studios?.nodes?.find(s => s.isAnimationStudio)?.name;
  const statusInfo = STATUS_MAP[media.status];
  const total   = isAnime ? media.episodes : media.chapters;
  const unit    = isAnime ? 'ep' : 'cap';

  const rawDesc = media.description?.replace(/<[^>]*>/g, '') || '';
  const shortDesc = rawDesc.slice(0, 480);
  const needsExpand = rawDesc.length > 480;

  const topRanking = media.rankings?.find(r => r.type === 'RATED' && r.allTime);
  const topPop     = media.rankings?.find(r => r.type === 'POPULAR' && r.allTime);

  const recommendations = (media.recommendations?.nodes || [])
    .map(n => n.mediaRecommendation)
    .filter(Boolean);

  const characters = (media.characters?.edges || []).slice(0, 16);

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>

      {/* ── Banner ── */}
      <div style={{ position: 'relative', height: 380, overflow: 'hidden' }}>
        {(media.bannerImage || media.coverImage.extraLarge) && (
          <img
            src={media.bannerImage || media.coverImage.extraLarge}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
          />
        )}
        {/* Gradiente lateral + inferior */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(10,10,15,0.92) 25%, rgba(10,10,15,0.3) 70%, rgba(10,10,15,0.15) 100%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,15,1) 0%, rgba(10,10,15,0.4) 40%, transparent 70%)',
        }} />

        {/* Botão voltar */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 24, left: 32, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '7px 14px',
            color: 'var(--text)', fontSize: 13, fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          <ArrowLeft size={15} /> Voltar
        </button>

        {/* Ranking badges no banner */}
        {(topRanking || topPop) && (
          <div style={{ position: 'absolute', top: 24, right: 32, display: 'flex', gap: 8 }}>
            {topRanking && (
              <div style={{
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 8, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, color: '#fbbf24',
              }}>
                <Star size={11} fill="#fbbf24" /> #{topRanking.rank} Rated
              </div>
            )}
            {topPop && (
              <div style={{
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(96,165,250,0.3)',
                borderRadius: 8, padding: '6px 12px',
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, color: '#60a5fa',
              }}>
                <Hash size={11} /> #{topPop.rank} Popular
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Conteúdo principal ── */}
      <div style={{ padding: '0 40px 60px', marginTop: -120 }}>
        <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start' }}>

          {/* Capa */}
          <div style={{ flexShrink: 0 }}>
            <img
              src={media.coverImage.extraLarge || media.coverImage.large}
              alt={title}
              style={{
                width: 195, borderRadius: 14,
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                border: '2px solid rgba(255,255,255,0.06)',
                display: 'block',
              }}
            />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 80 }}>
            {/* Format + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)',
                borderRadius: 6, padding: '3px 10px',
                fontSize: 11.5, fontWeight: 700, color: 'var(--purple-light)', letterSpacing: '0.04em',
              }}>
                {media.format}
              </span>
              {statusInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color }} />
                  <span style={{ fontSize: 12, color: statusInfo.color, fontWeight: 500 }}>{statusInfo.label}</span>
                </div>
              )}
            </div>

            {/* Título */}
            <h1 style={{
              fontSize: 'clamp(22px, 2.8vw, 36px)',
              fontWeight: 900, lineHeight: 1.15,
              letterSpacing: '-0.025em', marginBottom: 6,
            }}>{title}</h1>

            {media.title.romaji !== title && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                {media.title.romaji}
                {media.title.native && <span style={{ marginLeft: 8, opacity: 0.6 }}>· {media.title.native}</span>}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {score && (
                <StatBox icon={Star} label="Nota" value={score} accent="#fbbf24" />
              )}
              {isAnime && media.episodes && (
                <StatBox icon={Play} label="Episódios" value={media.episodes} />
              )}
              {!isAnime && media.chapters && (
                <StatBox icon={BookOpen} label="Capítulos" value={media.chapters} />
              )}
              {media.duration && isAnime && (
                <StatBox icon={Clock} label="Duração" value={`${media.duration}min`} />
              )}
              {media.season && media.seasonYear && (
                <StatBox icon={Calendar} label="Temporada" value={`${SEASON_MAP[media.season] || media.season} ${media.seasonYear}`} />
              )}
              {studio && (
                <StatBox icon={Clapperboard} label="Estúdio" value={studio} />
              )}
              {media.source && (
                <StatBox icon={BookOpen} label="Fonte" value={SOURCE_MAP[media.source] || media.source} />
              )}
              {topRanking && (
                <StatBox icon={Star} label="Ranking" value={`#${topRanking.rank}`} accent="#fbbf24" />
              )}
            </div>

            {/* Gêneros */}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 20 }}>
              {media.genres?.map(g => (
                <span key={g} style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 12, color: 'var(--purple-light)', fontWeight: 500,
                }}>{g}</span>
              ))}
            </div>

            {/* Sinopse */}
            {rawDesc && (
              <div style={{ marginBottom: 24, maxWidth: 680 }}>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)' }}>
                  {expanded ? rawDesc : shortDesc}
                  {needsExpand && !expanded && '…'}
                </p>
                {needsExpand && (
                  <button
                    onClick={() => setExpanded(e => !e)}
                    style={{
                      marginTop: 8, fontSize: 13, color: 'var(--purple-light)',
                      display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500,
                    }}
                  >
                    {expanded ? 'Ver menos' : 'Ver mais'} <ChevronDown size={14} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                )}
              </div>
            )}

            {/* Botões principais */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <AddToListButton listStatus={listStatus} onChangeStatus={val => {
                setListStatus(val);
                if (val) showToast(`Adicionado como "${LIST_STATUSES.find(s => s.value === val)?.label}"`, 'success');
                else showToast('Removido da lista', 'info');
              }} />

              <button
                onClick={() => {
                  setFavorited(f => !f);
                  showToast(!favorited ? 'Adicionado aos favoritos ❤️' : 'Removido dos favoritos', !favorited ? 'success' : 'info');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: favorited ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${favorited ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  color: favorited ? '#f87171' : 'var(--text-secondary)',
                  borderRadius: 10, padding: '11px 18px',
                  fontSize: 13.5, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!favorited) { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = '#f87171'; } }}
                onMouseLeave={e => { if (!favorited) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <Heart size={15} fill={favorited ? '#f87171' : 'none'} />
                {favorited ? 'Favoritado' : 'Favoritar'}
              </button>

              {/* Rewatch (só anime completo) */}
              {isAnime && listStatus === 'COMPLETED' && (
                <button
                  onClick={() => { setRewatchCount(c => c + 1); showToast('Rewatch registrado! 🎉', 'success'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'rgba(96,165,250,0.1)',
                    border: '1px solid rgba(96,165,250,0.3)',
                    color: '#60a5fa',
                    borderRadius: 10, padding: '11px 18px',
                    fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,165,250,0.1)'; }}
                >
                  <RefreshCw size={14} />
                  Reassistir{rewatchCount > 0 && ` (${rewatchCount}×)`}
                </button>
              )}
            </div>

            {/* Nota pessoal */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 18px', marginTop: 12,
              display: 'inline-flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Minha nota
                </span>
                {score && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Comunidade: <strong style={{ color: '#fbbf24' }}>{score}</strong>
                  </span>
                )}
              </div>
              <StarRating
                value={userScore}
                onChange={val => {
                  setUserScore(val);
                  showToast(val ? `Nota ${val}/10 salva! ⭐` : 'Nota removida', val ? 'success' : 'info');
                }}
              />
            </div>

            {/* Progresso de ep/cap */}
            {listStatus && (
              <div style={{ marginTop: 12 }}>
                <ProgressTracker
                  total={total}
                  unit={unit}
                  progress={progress}
                  onProgress={val => {
                    setProgress(val);
                    showToast(`Progresso: ${val}/${total || '?'} ${unit === 'ep' ? 'episódios' : 'capítulos'}`, 'info');
                  }}
                  isReleasing={media.status === 'RELEASING'}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Tab nav ── */}
        {isAnime && (
          <div style={{
            display: 'flex', gap: 0, marginTop: 36,
            borderBottom: '1px solid var(--border)',
          }}>
            {[
              { key: 'sobre',     label: 'Sobre' },
              { key: 'episodios', label: 'Episódios', badge: media.episodes ? `${watchedEps.size}/${media.episodes}` : null },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '11px 22px', fontSize: 13.5, fontWeight: 600,
                  color: activeTab === tab.key ? 'var(--purple-light)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--purple)' : '2px solid transparent',
                  marginBottom: -1, background: 'none', transition: 'color 0.15s',
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
                onMouseEnter={e => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { if (activeTab !== tab.key) e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                {tab.label}
                {tab.badge && watchedEps.size > 0 && (
                  <span style={{
                    fontSize: 10.5, fontWeight: 700,
                    background: 'rgba(124,58,237,0.2)', color: 'var(--purple-light)',
                    borderRadius: 10, padding: '1px 7px',
                  }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Aba: Episódios ── */}
        {activeTab === 'episodios' && isAnime && (
          <section style={{ marginTop: 32, paddingBottom: 40 }}>
            <EpisodesTab
              media={media}
              watchedEps={watchedEps}
              onToggleEp={handleToggleEp}
              onMarkSeason={handleMarkSeason}
            />
          </section>
        )}

        {/* ── Aba: Sobre ── */}
        {activeTab === 'sobre' && (
        <>

        {/* ── Personagens ── */}
        {characters.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <SectionTitle icon={Users}>Personagens</SectionTitle>
            <ScrollRow>
              {characters.map(edge => {
                const char = edge.node;
                const va   = edge.voiceActors?.[0];
                return (
                  <div key={char.id} style={{
                    flexShrink: 0, width: 110,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10, overflow: 'hidden',
                    transition: 'border-color 0.15s, transform 0.15s',
                    cursor: 'pointer',
                  }}
                    onClick={() => navigate(`/character/${char.id}`)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={char.image.large}
                        alt={char.name.full}
                        loading="lazy"
                        style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', display: 'block' }}
                      />
                      {/* Role badge */}
                      <div style={{
                        position: 'absolute', bottom: 5, left: 5,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                        borderRadius: 4, padding: '1px 6px',
                        fontSize: 9.5, fontWeight: 600,
                        color: edge.role === 'MAIN' ? 'var(--purple-light)' : 'rgba(255,255,255,0.6)',
                        letterSpacing: '0.04em',
                      }}>
                        {edge.role === 'MAIN' ? 'MAIN' : 'SUP'}
                      </div>
                    </div>
                    <div style={{ padding: '7px 8px 9px' }}>
                      <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {char.name.full}
                      </p>
                      {va && (
                        <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {va.name.full}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </ScrollRow>
          </section>
        )}

        {/* ── Informações adicionais ── */}
        <section style={{ marginTop: 56 }}>
          <SectionTitle icon={Tv}>Informações</SectionTitle>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10,
          }}>
            {[
              { label: 'Formato',     value: media.format },
              { label: 'Status',      value: statusInfo?.label },
              { label: 'Episódios',   value: isAnime ? media.episodes : undefined },
              { label: 'Capítulos',   value: !isAnime ? media.chapters : undefined },
              { label: 'Volumes',     value: !isAnime ? media.volumes : undefined },
              { label: 'Duração',     value: media.duration ? `${media.duration} min` : undefined },
              { label: 'Temporada',   value: media.season ? `${SEASON_MAP[media.season] || media.season} ${media.seasonYear}` : undefined },
              { label: 'Estreia',     value: media.startDate?.year ? `${media.startDate.day}/${media.startDate.month}/${media.startDate.year}` : undefined },
              { label: 'Estúdio',     value: studio },
              { label: 'Fonte',       value: SOURCE_MAP[media.source] || media.source },
              { label: 'Popularidade',value: media.popularity?.toLocaleString() },
              { label: 'Favoritos',   value: media.favourites?.toLocaleString() },
            ].filter(i => i.value).map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <p style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tags ── */}
        {media.tags?.filter(t => !t.isMediaSpoiler).length > 0 && (
          <section style={{ marginTop: 40 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tags</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {media.tags.filter(t => !t.isMediaSpoiler).slice(0, 18).map(tag => (
                <span key={tag.name} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 5, padding: '3px 9px',
                  fontSize: 11.5, color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {tag.name}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{tag.rank}%</span>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Recomendações ── */}
        {recommendations.length > 0 && (
          <section style={{ marginTop: 56 }}>
            <SectionTitle icon={ExternalLink}>Recomendações</SectionTitle>
            <ScrollRow>
              {recommendations.map(rec => (
                <div
                  key={rec.id}
                  onClick={() => navigate(`/anime/${rec.id}`)}
                  style={{
                    flexShrink: 0, width: 140, cursor: 'pointer',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 10, overflow: 'hidden',
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.55)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ position: 'relative', paddingBottom: '145%', overflow: 'hidden' }}>
                    <img
                      src={rec.coverImage.extraLarge || rec.coverImage.large}
                      alt=""
                      loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {rec.averageScore && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                        borderRadius: 5, padding: '2px 6px',
                        fontSize: 11, fontWeight: 700, color: '#fbbf24',
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <Star size={8} fill="#fbbf24" color="#fbbf24" />
                        {(rec.averageScore / 10).toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.35,
                      overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {rec.title.english || rec.title.romaji}
                    </p>
                    <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 4 }}>
                      {rec.format} · {rec.seasonYear || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollRow>
          </section>
        )}

        </> /* fim aba Sobre */
        )}
      </div>
    </div>
  );
}
