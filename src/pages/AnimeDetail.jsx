import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queryAniList, MEDIA_DETAILS } from '../lib/anilist';
import { getMedia, saveMedia, syncItemToSupabase, updateStreak, getCustomLists, addToCustomList, removeFromCustomList } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTitle } from '../hooks/useTitle';
import { getWatchedEpisodes, markEpisode } from '../lib/episodeProgress';
import { getJikanThemes, searchJikanByTitle, getJikanNews } from '../lib/jikan';
import { getReviews, getUserReview, upsertReview, deleteReview, voteReview } from '../lib/reviews';
import { useMarathon } from '../context/MarathonContext';
import {
  Star, ArrowLeft, Play, BookOpen, Heart, Plus, Check,
  ChevronDown, ChevronRight, ChevronLeft, Minus, Users,
  Clapperboard, Calendar, Clock, Tv, Hash, ExternalLink,
  RefreshCw, Film, Lock, Music, MessageSquare, ThumbsUp,
  ThumbsDown, Pencil, Trash2, Eye, EyeOff, Timer, ListPlus,
} from 'lucide-react';

/* Inline YouTube icon (lucide não tem) */
function YoutubeIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M21.543 6.498C22 8.28 22 12 22 12s0 3.72-.457 5.502c-.254.985-.997 1.76-1.938 2.022C17.896 20 12 20 12 20s-5.893 0-7.605-.476c-.945-.266-1.687-1.04-1.938-2.022C2 15.72 2 12 2 12s0-3.72.457-5.502c.254-.985.997-1.76 1.938-2.022C6.107 4 12 4 12 4s5.896 0 7.605.476c.945.266 1.687 1.04 1.938 2.022zM10 15.5l6-3.5-6-3.5v7z"/>
    </svg>
  );
}

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

/* ─── Countdown helper ─── */
function formatCountdown(airingAt) {
  const secs = airingAt - Math.floor(Date.now() / 1000);
  if (secs <= 0) return 'Em breve';
  const days  = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const mins  = Math.floor((secs % 3600) / 60);
  if (days > 0)  return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

const REACTION_EMOJIS = ['👎', '👍', '❤️'];

/* ─── Aba de Episódios ─── */
function EpisodesTab({ media, watchedEps, onToggleEp, onMarkSeason }) {
  const [openSeasons, setOpenSeasons] = useState(new Set([0]));
  const [reactions, setReactions]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(`nakama_ep_reactions_${media.id}`) || '{}'); }
    catch { return {}; }
  });
  /* Tick para atualizar countdown a cada minuto */
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!media.nextAiringEpisode) return;
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, [media.nextAiringEpisode]);

  const totalEps  = media.episodes || 0;
  const nextAiring = media.nextAiringEpisode; // { airingAt, episode, timeUntilAiring }

  /* Quantos episódios já foram ao ar */
  const releasedCount = nextAiring
    ? nextAiring.episode - 1
    : totalEps; // série finalizada ou desconhecida → todos lançados

  /* Mapa episode → airingAt (unix) */
  const airingMap = {};
  (media.airingSchedule?.nodes || []).forEach(n => { airingMap[n.episode] = n.airingAt; });
  if (nextAiring) airingMap[nextAiring.episode] = nextAiring.airingAt;

  /* Mapa de títulos reais via streamingEpisodes */
  const streamMap = {};
  (media.streamingEpisodes || []).forEach(ep => {
    const m = ep.title?.match(/episode\s+(\d+)/i);
    if (m) streamMap[parseInt(m[1])] = ep;
  });

  const effectiveTotal = totalEps || releasedCount;

  if (!effectiveTotal) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <Film size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Dados de episódios não disponíveis para este título.</p>
      </div>
    );
  }

  /* Lista completa de episódios */
  const episodes = Array.from({ length: effectiveTotal }, (_, i) => {
    const n  = i + 1;
    const st = streamMap[n];
    const rawTitle = st?.title?.replace(/^episode\s+\d+\s*[-–:]\s*/i, '').trim() || '';
    const isReleased = n <= releasedCount;
    const isNextEp   = !!(nextAiring && n === nextAiring.episode);
    return {
      number:     n,
      title:      rawTitle || `Episódio ${n}`,
      thumbnail:  st?.thumbnail || media.coverImage?.extraLarge || media.coverImage?.large,
      isReleased,
      isNextEp,
      airingAt:   airingMap[n] || null,
    };
  });

  const watchedCount = watchedEps.size;
  const pctWatched   = effectiveTotal > 0 ? Math.round((watchedCount / effectiveTotal) * 100) : 0;

  /* Carrossel: próximos não-assistidos e já lançados */
  const continueEps = episodes.filter(ep => ep.isReleased && !watchedEps.has(ep.number)).slice(0, 8);

  /* Agrupar em blocos de 13 (cour) */
  const COUR = 13;
  const seasons = [];
  for (let i = 0; i < episodes.length; i += COUR) seasons.push(episodes.slice(i, i + COUR));

  const toggleSeason = idx => {
    setOpenSeasons(s => { const n = new Set(s); n.has(idx) ? n.delete(idx) : n.add(idx); return n; });
  };

  const setReaction = (epNumber, emoji) => {
    setReactions(prev => {
      const next = { ...prev };
      next[epNumber] === emoji ? delete next[epNumber] : (next[epNumber] = emoji);
      localStorage.setItem(`nakama_ep_reactions_${media.id}`, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      {/* ── Barra de progresso global ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Progresso geral</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--purple-light)' }}>
            {watchedCount} / {effectiveTotal} assistidos · {pctWatched}%
          </span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pctWatched}%`,
            background: pctWatched === 100 ? '#4ade80' : 'linear-gradient(90deg, var(--purple), #60a5fa)',
            borderRadius: 3, transition: 'width 0.4s ease',
          }} />
        </div>
        {nextAiring && (
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 5, padding: '2px 9px', color: '#4ade80', fontWeight: 700,
            }}>
              {releasedCount} de {effectiveTotal} lançados
            </span>
            Próximo: Ep. {nextAiring.episode} em <strong style={{ color: 'var(--purple-light)' }}>{formatCountdown(nextAiring.airingAt)}</strong>
          </p>
        )}
      </div>

      {/* ── Próximo episódio — destaque ── */}
      {nextAiring && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.06))',
          border: '1px solid rgba(124,58,237,0.28)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Clock size={20} color="var(--purple-light)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--purple-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Próximo episódio
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>
              Episódio {nextAiring.episode}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {formatCountdown(nextAiring.airingAt)}
              {' · '}
              {new Date(nextAiring.airingAt * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      )}

      {/* ── Carrossel: continuar / começar ── */}
      {continueEps.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
            {watchedEps.size > 0 ? '▶ Continuar assistindo' : '▶ Começar a assistir'}
          </h3>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {continueEps.map(ep => (
              <div key={ep.number} style={{
                flexShrink: 0, width: 192,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, overflow: 'hidden',
                transition: 'transform 0.15s, border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                  <img src={ep.thumbnail} alt="" loading="lazy"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      background: 'rgba(124,58,237,0.9)',
                      border: 'none', borderRadius: 6, padding: '4px 9px',
                      color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(4px)',
                    }}
                  >
                    <Check size={10} strokeWidth={3} /> Marcar
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
            ))}
          </div>
        </div>
      )}

      {/* ── Todos os episódios por cour ── */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Todos os episódios</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {seasons.map((seasonEps, idx) => {
          const releasedSeasonEps  = seasonEps.filter(ep => ep.isReleased);
          const watchedSeasonCount = releasedSeasonEps.filter(ep => watchedEps.has(ep.number)).length;
          const isComplete = releasedSeasonEps.length > 0 && watchedSeasonCount === releasedSeasonEps.length;
          const isOpen     = openSeasons.has(idx);
          const pct        = releasedSeasonEps.length > 0 ? (watchedSeasonCount / releasedSeasonEps.length) * 100 : 0;

          return (
            <div key={idx} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${isComplete ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Cabeçalho do cour */}
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
                      {watchedSeasonCount}/{releasedSeasonEps.length} assistidos
                      {releasedSeasonEps.length < seasonEps.length &&
                        ` · ${seasonEps.length - releasedSeasonEps.length} não lançados`}
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
                {releasedSeasonEps.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); onMarkSeason(releasedSeasonEps, !isComplete); }}
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
                )}
                <ChevronDown size={15} color="var(--text-muted)"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </div>

              {/* Linhas de episódio */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)' }}>
                  {seasonEps.map(ep => {
                    const isWatched  = watchedEps.has(ep.number);
                    const locked     = !ep.isReleased && !ep.isNextEp;
                    const myReaction = reactions[ep.number];

                    return (
                      <div key={ep.number}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '9px 16px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          opacity: isWatched ? 0.55 : locked ? 0.42 : 1,
                          transition: 'background 0.12s, opacity 0.2s',
                          background: ep.isNextEp ? 'rgba(124,58,237,0.06)' : 'transparent',
                        }}
                        onMouseEnter={e => {
                          if (!locked) e.currentTarget.style.background = ep.isNextEp
                            ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.025)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = ep.isNextEp
                            ? 'rgba(124,58,237,0.06)' : 'transparent';
                        }}
                      >
                        {/* Thumbnail / locked */}
                        <div style={{ position: 'relative', width: 76, height: 43, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                          {locked ? (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Lock size={16} color="rgba(255,255,255,0.25)" />
                            </div>
                          ) : (
                            <img src={ep.thumbnail} alt="" loading="lazy"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          {ep.isNextEp && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'rgba(124,58,237,0.45)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Clock size={15} color="#fff" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 10.5, fontWeight: 500, marginBottom: 2,
                            color: ep.isNextEp ? 'var(--purple-light)' : 'var(--text-muted)' }}>
                            {seasons.length > 1 ? `P${String(idx + 1).padStart(2, '0')} · ` : ''}
                            E{String(ep.number).padStart(2, '0')}
                            {ep.isNextEp && ' · Em breve'}
                          </p>
                          <p style={{
                            fontSize: 13, fontWeight: ep.isNextEp ? 700 : 500,
                            color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {locked ? `Episódio ${ep.number}` : ep.title}
                          </p>
                          {ep.isNextEp && nextAiring && (
                            <p style={{ fontSize: 11, color: 'var(--purple-light)', fontWeight: 600, marginTop: 2 }}>
                              {formatCountdown(nextAiring.airingAt)}
                            </p>
                          )}
                        </div>

                        {/* Reações (só episódios lançados) */}
                        {ep.isReleased && !locked && (
                          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                            {REACTION_EMOJIS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => setReaction(ep.number, emoji)}
                                title={emoji}
                                style={{
                                  width: 26, height: 26, borderRadius: 6, fontSize: 13, cursor: 'pointer',
                                  background: myReaction === emoji ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                                  border: `1px solid ${myReaction === emoji ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { if (myReaction !== emoji) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseLeave={e => { if (myReaction !== emoji) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Check / lock button */}
                        <button
                          disabled={locked}
                          onClick={() => !locked && onToggleEp(ep.number)}
                          style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isWatched ? 'rgba(74,222,128,0.2)' : locked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isWatched ? 'rgba(74,222,128,0.5)' : locked ? 'rgba(255,255,255,0.06)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                            cursor: locked ? 'not-allowed' : 'pointer',
                          }}
                          onMouseEnter={e => { if (!locked && !isWatched) { e.currentTarget.style.background = 'rgba(124,58,237,0.2)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; } }}
                          onMouseLeave={e => { if (!locked && !isWatched) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border)'; } }}
                        >
                          {locked
                            ? <Lock size={10} color="rgba(255,255,255,0.2)" />
                            : <Check size={12} color={isWatched ? '#4ade80' : 'var(--text-muted)'} strokeWidth={2.5} />
                          }
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

/* ─── Onde Assistir ─── */
function WhereToWatch({ externalLinks }) {
  const platforms = (externalLinks || []).filter(l => l.type === 'STREAMING' && !l.isDisabled && l.url);
  if (!platforms.length) return null;

  return (
    <section style={{ marginTop: 40 }}>
      <SectionTitle icon={Tv}>Onde Assistir</SectionTitle>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {platforms.map(link => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 16px',
              fontSize: 13.5, fontWeight: 600,
              color: link.color || 'var(--text)',
              textDecoration: 'none',
              transition: 'border-color 0.15s, transform 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = link.color || 'var(--purple)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = link.color
                ? `${link.color}14`
                : 'rgba(124,58,237,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.background = 'var(--bg-card)';
            }}
          >
            {link.icon ? (
              <img src={link.icon} alt="" style={{ width: 18, height: 18, objectFit: 'contain', borderRadius: 4 }} />
            ) : (
              <ExternalLink size={14} />
            )}
            {link.site}
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─── Trailer YouTube ─── */
function TrailerEmbed({ trailer }) {
  const [show, setShow] = useState(false);
  if (!trailer?.id || trailer.site !== 'Youtube') return null;

  return (
    <section style={{ marginTop: 40 }}>
      <SectionTitle icon={YoutubeIcon}>Trailer</SectionTitle>
      {show ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=1&rel=0`}
            title="Trailer"
            allowFullScreen
            allow="autoplay; encrypted-media"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      ) : (
        <div
          onClick={() => setShow(true)}
          style={{
            position: 'relative', paddingBottom: '42%', borderRadius: 14, overflow: 'hidden',
            background: '#0d0d14', cursor: 'pointer',
            backgroundImage: `url(https://img.youtube.com/vi/${trailer.id}/maxresdefault.jpg)`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}>
              <Play size={26} color="#111" fill="#111" style={{ marginLeft: 4 }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Temas (OP / ED) via Jikan ─── */
function ThemesSection({ themes }) {
  if (!themes || (!themes.openings?.length && !themes.endings?.length)) return null;

  const clean = str => str.replace(/^\d+:\s*"?|"?\s*by\s*/gi, str => {
    // Keep the "by" part for artist
    if (str.toLowerCase().includes('by')) return ' — ';
    return '';
  }).replace(/\(eps?.*/i, '').trim();

  return (
    <section style={{ marginTop: 40 }}>
      <SectionTitle icon={Music}>Músicas</SectionTitle>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Abertura (OP)', items: themes.openings, color: '#a78bfa' },
          { label: 'Encerramento (ED)', items: themes.endings, color: '#60a5fa' },
        ].filter(g => g.items?.length).map(({ label, items, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 260,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px', borderBottom: '1px solid var(--border)',
              background: 'rgba(124,58,237,0.05)',
              fontSize: 11.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>{label}</div>
            <div>
              {items.slice(0, 6).map((theme, i) => {
                const parts = theme.split(/\s+by\s+/i);
                const songName = parts[0]?.replace(/^\d+:\s*"?|"?\s*$/g, '').trim();
                const artist   = parts[1]?.replace(/\s*\(eps?.*/i, '').trim();
                return (
                  <div key={i} style={{
                    padding: '9px 16px',
                    borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {songName || theme.replace(/^\d+:\s*/, '')}
                      </p>
                      {artist && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{artist}</p>
                      )}
                    </div>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent((songName || theme) + ' anime')}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'var(--text-muted)', flexShrink: 0, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Buscar no YouTube"
                    >
                      <YoutubeIcon size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Aba de Notícias (Jikan) ─── */
function NewsTab({ news, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <div className="skeleton" style={{ height: 14, borderRadius: 5, width: '70%' }} />
              <div className="skeleton" style={{ height: 11, borderRadius: 5, width: '90%' }} />
              <div className="skeleton" style={{ height: 11, borderRadius: 5, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!news.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: 14 }}>
        Nenhuma notícia encontrada para este anime.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {news.map((item, i) => {
        const date = item.date ? new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        const excerpt = item.excerpt ? item.excerpt.slice(0, 200) + (item.excerpt.length > 200 ? '…' : '') : '';
        return (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', gap: 14,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 16px', textDecoration: 'none',
            transition: 'border-color 0.15s, background 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
            {item.images?.jpg?.image_url && (
              <img src={item.images.jpg.image_url} alt={item.title} loading="lazy"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </p>
              {excerpt && (
                <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {excerpt}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {date && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{date}</span>}
                {item.author_username && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>por {item.author_username}</span>
                )}
                <span style={{ fontSize: 11, color: 'var(--purple-light)', marginLeft: 'auto' }}>Ler na MAL →</span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* ─── Aba de Reviews ─── */
function ReviewsTab({ mediaId, mediaCoverImage }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [reviews, setReviews]         = useState([]);
  const [myReview, setMyReview]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [writing, setWriting]         = useState(false);
  const [form, setForm]               = useState({ title: '', body: '', score: null, isSpoiler: false });
  const [submitting, setSubmitting]   = useState(false);
  const [spoilerOpen, setSpoilerOpen] = useState({});

  const load = useCallback(async () => {
    try {
      const all = await getReviews(mediaId);
      setReviews(all);
      if (user?.id) {
        const mine = all.find(r => r.user_id === user.id) || null;
        setMyReview(mine);
        if (mine) setForm({ title: mine.title || '', body: mine.body || '', score: mine.score, isSpoiler: mine.is_spoiler });
      }
    } catch (err) {
      console.error('Reviews error:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaId, user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.body.trim()) return;
    setSubmitting(true);
    try {
      await upsertReview({ userId: user.id, mediaId, ...form });
      showToast(myReview ? 'Review atualizada!' : 'Review publicada! 🎉', 'success');
      setWriting(false);
      await load();
    } catch (err) {
      showToast(err.message || 'Erro ao publicar review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!window.confirm('Excluir sua review?')) return;
    try {
      await deleteReview(myReview.id, user.id);
      setMyReview(null);
      setForm({ title: '', body: '', score: null, isSpoiler: false });
      showToast('Review excluída', 'info');
      await load();
    } catch (err) {
      showToast('Erro ao excluir', 'error');
    }
  };

  const starVal = n => form.score === n ? null : n;

  if (loading) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, margin: '0 auto', border: '2px solid rgba(124,58,237,0.2)', borderTop: '2px solid var(--purple)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div>
      {/* ── Minha review / formulário ── */}
      {user ? (
        <div style={{ marginBottom: 32 }}>
          {!writing && !myReview ? (
            <button
              onClick={() => setWriting(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 10, padding: '11px 20px',
                fontSize: 13.5, fontWeight: 600, color: 'var(--purple-light)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
            >
              <Pencil size={15} /> Escrever review
            </button>
          ) : writing || myReview ? (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>
                  {myReview && !writing ? 'Minha review' : (myReview ? 'Editar review' : 'Nova review')}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {myReview && !writing && (
                    <>
                      <button onClick={() => setWriting(true)} style={{ fontSize: 12, color: 'var(--purple-light)', display: 'flex', alignItems: 'center', gap: 4 }}><Pencil size={12} /> Editar</button>
                      <button onClick={handleDelete} style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /> Excluir</button>
                    </>
                  )}
                  {writing && <button onClick={() => setWriting(false)} style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancelar</button>}
                </div>
              </div>

              {writing ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Nota */}
                  <div>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nota (opcional)</label>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {[1,2,3,4,5,6,7,8,9,10].map(n => (
                        <button type="button" key={n} onClick={() => setForm(f => ({ ...f, score: starVal(n) }))}
                          style={{ width: 28, height: 28, borderRadius: 6, fontSize: 13, fontWeight: 700, border: `1px solid ${form.score >= n ? 'rgba(251,191,36,0.6)' : 'var(--border)'}`, background: form.score >= n ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', color: form.score >= n ? '#fbbf24' : 'var(--text-muted)', transition: 'all 0.1s' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Título */}
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Título da review (opcional)"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: 13.5, outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {/* Texto */}
                  <textarea
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Escreva sua review..."
                    required
                    rows={5}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: 13.5, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = 'var(--purple)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {/* Spoiler toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)' }}>
                    <input type="checkbox" checked={form.isSpoiler} onChange={e => setForm(f => ({ ...f, isSpoiler: e.target.checked }))} style={{ width: 15, height: 15, accentColor: 'var(--purple)' }} />
                    Contém spoilers
                  </label>
                  <button
                    type="submit" disabled={submitting}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'linear-gradient(90deg, var(--purple), #4f46e5)',
                      color: '#fff', borderRadius: 9, padding: '10px 22px',
                      fontSize: 13.5, fontWeight: 700,
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? 'Publicando...' : myReview ? 'Atualizar' : 'Publicar'}
                  </button>
                </form>
              ) : (
                /* Visualização da minha review */
                <div>
                  {myReview.title && <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{myReview.title}</p>}
                  {myReview.score && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                      <Star size={13} fill="#fbbf24" color="#fbbf24" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{myReview.score}/10</span>
                    </div>
                  )}
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{myReview.body}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginBottom: 24, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
          <a href="/login" style={{ color: 'var(--purple-light)', fontWeight: 600 }}>Faça login</a> para escrever uma review.
        </div>
      )}

      {/* ── Lista de reviews ── */}
      {reviews.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          Nenhuma review ainda. Seja o primeiro!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.filter(r => r.user_id !== user?.id).concat(reviews.filter(r => r.user_id === user?.id)).map(review => {
            const isOpen = spoilerOpen[review.id];
            const authorName = review.user_profiles?.display_name || 'Usuário';
            const initials = authorName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

            return (
              <div key={review.id} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '18px 20px',
                borderColor: review.user_id === user?.id ? 'rgba(124,58,237,0.3)' : 'var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--purple), var(--blue))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff',
                  }}>{initials}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{authorName}</span>
                      {review.user_id === user?.id && (
                        <span style={{ fontSize: 10.5, background: 'rgba(124,58,237,0.15)', color: 'var(--purple-light)', borderRadius: 5, padding: '1px 7px', fontWeight: 600 }}>Você</span>
                      )}
                      {review.score && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#fbbf24' }}>
                          <Star size={11} fill="#fbbf24" />
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{review.score}/10</span>
                        </div>
                      )}
                      {review.is_spoiler && (
                        <span style={{ fontSize: 10.5, background: 'rgba(248,113,113,0.15)', color: '#f87171', borderRadius: 5, padding: '1px 7px', fontWeight: 600 }}>SPOILER</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(review.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {review.title && <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{review.title}</p>}

                {/* Conteúdo — spoiler gate */}
                {review.is_spoiler && !isOpen ? (
                  <div style={{
                    background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 8, padding: '14px', textAlign: 'center',
                  }}>
                    <p style={{ fontSize: 13, color: '#f87171', marginBottom: 8 }}>⚠️ Este conteúdo pode conter spoilers</p>
                    <button
                      onClick={() => setSpoilerOpen(p => ({ ...p, [review.id]: true }))}
                      style={{ fontSize: 12.5, color: '#f87171', display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto', fontWeight: 600 }}
                    >
                      <Eye size={13} /> Ver mesmo assim
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                    {review.body}
                  </p>
                )}

                {/* Votos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      const { upvotes } = await voteReview(review.id, user.id, 1);
                      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, upvotes } : r));
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#4ade80'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <ThumbsUp size={13} /> {review.upvotes || 0}
                  </button>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      const { downvotes } = await voteReview(review.id, user.id, -1);
                      setReviews(prev => prev.map(r => r.id === review.id ? { ...r, downvotes } : r));
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <ThumbsDown size={13} /> {review.downvotes || 0}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Adicionar a Lista Personalizada ─── */
function AddToCustomListButton({ mediaId }) {
  const [open, setOpen]   = useState(false);
  const [lists, setLists] = useState([]);
  const ref = useRef(null);

  /* Recarrega as listas sempre que o dropdown abre */
  useEffect(() => {
    if (open) setLists(getCustomLists());
  }, [open]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const mediaIdStr = String(mediaId);
  const inLists = lists.filter(l => l.mediaIds.includes(mediaIdStr));
  const inAny   = inLists.length > 0;

  const toggle = (listId, isIn) => {
    if (isIn) removeFromCustomList(listId, mediaIdStr);
    else      addToCustomList(listId, mediaIdStr);
    setLists(getCustomLists());
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Adicionar a lista personalizada"
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: inAny ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${inAny ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
          color: inAny ? 'var(--purple-light)' : 'var(--text-secondary)',
          borderRadius: 10, padding: '11px 16px',
          fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)'; e.currentTarget.style.color = 'var(--purple-light)'; }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = inAny ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = inAny ? 'var(--purple-light)' : 'var(--text-secondary)';
        }}
      >
        <ListPlus size={15} />
        {inAny ? `Listas (${inLists.length})` : 'Listas'}
        <ChevronDown size={13} style={{ opacity: 0.6 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#1a1a28', border: '1px solid var(--border)',
          borderRadius: 12, overflow: 'hidden', zIndex: 300,
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          minWidth: 200, maxHeight: 280, overflowY: 'auto',
          animation: 'fadeIn 0.15s ease',
        }}>
          {lists.length === 0 ? (
            <div style={{ padding: '16px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
              <p>Nenhuma lista criada.</p>
              <a href="/lists" style={{ color: 'var(--purple-light)', fontSize: 12, marginTop: 4, display: 'block' }}>
                Criar listas →
              </a>
            </div>
          ) : (
            lists.map(list => {
              const isIn = list.mediaIds.includes(mediaIdStr);
              return (
                <button
                  key={list.id}
                  onClick={() => toggle(list.id, isIn)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '10px 14px',
                    color: isIn ? 'var(--purple-light)' : 'var(--text-secondary)',
                    background: isIn ? 'rgba(124,58,237,0.1)' : 'transparent',
                    fontSize: 13, fontWeight: isIn ? 600 : 400,
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isIn) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isIn) e.currentTarget.style.background = 'transparent'; }}
                >
                  {isIn ? <Check size={13} color="var(--purple-light)" /> : <Plus size={13} />}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {list.name}
                  </span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {list.mediaIds.length}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Botão Modo Maratona ─── */
function MarathonBtn({ mediaId, title, cover, progress }) {
  const { running, session, startMarathon, stopMarathon } = useMarathon();
  const isThisAnime = running && session?.animeId === mediaId;

  return (
    <button
      onClick={() => isThisAnime ? stopMarathon() : startMarathon(mediaId, title, cover, progress)}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: isThisAnime ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isThisAnime ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: isThisAnime ? '#fbbf24' : 'var(--text-secondary)',
        borderRadius: 10, padding: '11px 18px',
        fontSize: 13.5, fontWeight: 600, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isThisAnime) { e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)'; e.currentTarget.style.color = '#fbbf24'; } }}
      onMouseLeave={e => { if (!isThisAnime) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      <Timer size={14} />
      {isThisAnime ? 'Maratona ativa' : 'Modo Maratona'}
    </button>
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
  const [themes, setThemes]             = useState(null); // { openings, endings }
  const [reviewCount, setReviewCount]   = useState(0);
  const [news, setNews]                 = useState([]);
  const [newsLoading, setNewsLoading]   = useState(false);

  /* Controla se já houve uma mudança do usuário (evita sync no carregamento inicial) */
  const didMountRef  = useRef(false);
  /* Timer para debounce do sync Supabase */
  const syncTimerRef = useRef(null);

  useEffect(() => {
    didMountRef.current = false;
    setLoading(true);
    setMedia(null);
    setThemes(null);
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
        const m = data.Media;
        setMedia(m);
        setPageTitle(m.title.english || m.title.romaji);

        /* Carregar episódios assistidos */
        if (user?.id) {
          const eps = await getWatchedEpisodes(user.id, parseInt(id));
          setWatchedEps(eps);
        }

        /* Buscar temas (OP/ED) e notícias via Jikan */
        const fetchJikanData = async (malId) => {
          getJikanThemes(malId).then(t => { if (t) setThemes(t); });
          setNewsLoading(true);
          getJikanNews(malId).then(n => { if (n) setNews(n); }).finally(() => setNewsLoading(false));
        };

        if (m.idMal) {
          fetchJikanData(m.idMal);
        } else {
          /* Fallback: busca por título */
          const title = m.title.english || m.title.romaji;
          searchJikanByTitle(title).then(results => {
            const match = results[0];
            if (match?.mal_id) fetchJikanData(match.mal_id);
            else setNewsLoading(false);
          });
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
    updateStreak(); /* registra atividade diária para streak */

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
      <div className="banner-hero" style={{ position: 'relative', height: 380, overflow: 'hidden', background: '#0d0d14' }}>
        {media.bannerImage ? (
          <img
            src={media.bannerImage}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
        ) : (media.coverImage?.extraLarge || media.coverImage?.large) ? (
          <div style={{
            position: 'absolute', inset: '-10%',
            backgroundImage: `url(${media.coverImage.extraLarge || media.coverImage.large})`,
            backgroundSize: 'cover', backgroundPosition: 'center top',
            filter: 'blur(28px)',
            opacity: 0.45,
          }} />
        ) : null}
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
                <StatBox
                  icon={Play}
                  label="Episódios"
                  value={
                    media.nextAiringEpisode
                      ? `${media.nextAiringEpisode.episode - 1} / ${media.episodes}`
                      : String(media.episodes)
                  }
                  accent={media.nextAiringEpisode ? '#22c55e' : undefined}
                />
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
                <div
                  onClick={() => {
                    const studioNode = media.studios?.nodes?.find(s => s.isAnimationStudio);
                    if (studioNode?.id) navigate(`/studio/${studioNode.id}`);
                  }}
                  style={{ cursor: 'pointer' }}
                  title="Ver página do estúdio"
                >
                  <StatBox icon={Clapperboard} label="Estúdio" value={studio} />
                </div>
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

              {/* Adicionar a lista personalizada */}
              {listStatus && <AddToCustomListButton mediaId={String(id)} />}

              {/* Modo Maratona (só anime) */}
              {isAnime && listStatus && listStatus !== 'PLAN_TO_WATCH' && (
                <MarathonBtn mediaId={parseInt(id)} title={media.title?.english || media.title?.romaji} cover={media.coverImage?.large} progress={progress} />
              )}

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
              { key: 'reviews',   label: 'Reviews' },
              ...(isAnime ? [{ key: 'noticias', label: 'Notícias', badge: news.length > 0 ? String(news.length) : null }] : []),
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

        {/* ── Aba: Reviews ── */}
        {activeTab === 'reviews' && (
          <section style={{ marginTop: 32, paddingBottom: 40 }}>
            <ReviewsTab mediaId={parseInt(id)} mediaCoverImage={media.coverImage} />
          </section>
        )}

        {/* ── Aba: Notícias ── */}
        {activeTab === 'noticias' && isAnime && (
          <section style={{ marginTop: 32, paddingBottom: 40 }}>
            <NewsTab news={news} loading={newsLoading} />
          </section>
        )}

        {/* ── Aba: Sobre ── */}
        {activeTab === 'sobre' && (
        <>

        {/* ── Onde Assistir ── */}
        {isAnime && <WhereToWatch externalLinks={media.externalLinks} />}

        {/* ── Trailer ── */}
        {isAnime && media.trailer && <TrailerEmbed trailer={media.trailer} />}

        {/* ── Músicas (OP/ED) ── */}
        {isAnime && themes && <ThemesSection themes={themes} />}

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
