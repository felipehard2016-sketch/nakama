import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMedia, getMonthlyActivity } from '../lib/storage';
import { useTitle } from '../hooks/useTitle';
import {
  Tv, BookOpen, Clock, Star, TrendingUp, Award,
  Share2, ChevronRight, Flame, Trophy, Zap, Heart,
  BarChart2, Calendar,
} from 'lucide-react';

const AVG_EP_MIN = 24;
const YEAR = new Date().getFullYear();

/* ─── Helpers ─── */
function fmtHours(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getLevel(eps) {
  if (eps >= 6000) return { level: 7, label: 'Otaku', color: '#f59e0b' };
  if (eps >= 3000) return { level: 6, label: 'Mestre', color: '#a78bfa' };
  if (eps >= 1500) return { level: 5, label: 'Veterano', color: '#60a5fa' };
  if (eps >= 700)  return { level: 4, label: 'Experiente', color: '#34d399' };
  if (eps >= 300)  return { level: 3, label: 'Intermediário', color: '#4ade80' };
  if (eps >= 100)  return { level: 2, label: 'Iniciante', color: '#fb7185' };
  return { level: 1, label: 'Novato', color: '#94a3b8' };
}

function getLevelThreshold(level) {
  return [0, 0, 100, 300, 700, 1500, 3000, 6000][level] || 0;
}

const GENRE_COLORS = [
  '#a78bfa','#60a5fa','#34d399','#fb7185','#fbbf24',
  '#f472b6','#818cf8','#2dd4bf','#f97316','#c084fc',
];

const PT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

/* ─── Computed stats ─── */
function useWrappedStats() {
  return useMemo(() => {
    const all = getAllMedia().filter(m => m.listStatus);
    const thisYear = all.filter(m => {
      if (!m.addedAt) return true; // sem data → assume este ano
      return new Date(m.addedAt).getFullYear() === YEAR;
    });

    /* Decide se usa dados do ano ou all-time */
    const data = thisYear.length >= 3 ? thisYear : all;
    const isAllTime = thisYear.length < 3;

    const animes = data.filter(m => !['MANGA','NOVEL','ONE_SHOT'].includes(m.format));
    const mangas = data.filter(m => ['MANGA','NOVEL','ONE_SHOT'].includes(m.format));
    const completed = data.filter(m => m.listStatus === 'COMPLETED');

    /* Episódios e tempo */
    const totalEps  = animes.reduce((s, m) => s + (m.progress || 0), 0);
    const epMinutes = animes.reduce((s, m) => {
      const dur = m.duration || AVG_EP_MIN;
      return s + (m.progress || 0) * dur;
    }, 0);
    const chapMin   = mangas.reduce((s, m) => s + (m.progress || 0) * 5, 0); // ~5 min/capítulo
    const totalMin  = epMinutes + chapMin;

    /* Gêneros */
    const genreCount = {};
    data.forEach(m => {
      const weight = m.listStatus === 'COMPLETED' ? 3 : m.listStatus === 'WATCHING' ? 2 : 1;
      (m.genres || []).forEach(g => { genreCount[g] = (genreCount[g] || 0) + weight; });
    });
    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }));

    /* Top animes (por progresso percentual ou score) */
    const topMedia = [...completed]
      .sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0))
      .slice(0, 5);

    /* Score médio do usuário */
    const scored   = data.filter(m => m.userScore);
    const avgScore = scored.length
      ? (scored.reduce((s, m) => s + m.userScore, 0) / scored.length).toFixed(1)
      : null;

    /* Status breakdown */
    const statusCount = {};
    data.forEach(m => { statusCount[m.listStatus] = (statusCount[m.listStatus] || 0) + 1; });

    /* Nível */
    const allEps = getAllMedia().reduce((s, m) => s + (m.progress || 0), 0);
    const { level, label: levelLabel, color: levelColor } = getLevel(allEps);
    const currentThreshold = getLevelThreshold(level);
    const nextThreshold = getLevelThreshold(level + 1);
    const levelPct = nextThreshold > currentThreshold
      ? Math.min(100, Math.round(((allEps - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
      : 100;

    /* Mês mais ativo */
    const monthly = getMonthlyActivity(12);
    const peakMonth = monthly.reduce((best, m) => m.count > best.count ? m : best, { count: 0, label: '—' });

    /* Conquista */
    let achievement = null;
    if (completed.length >= 50)       achievement = { icon: '🏆', label: 'Colecionador', desc: `${completed.length} animes/mangás completos` };
    else if (totalMin >= 60 * 24 * 7) achievement = { icon: '🔥', label: 'Maratonista', desc: `${fmtHours(totalMin)} assistidos` };
    else if (topGenres[0]?.count > 20) achievement = { icon: '⚡', label: `Fã de ${topGenres[0].genre}`, desc: 'Seu gênero favorito absoluto' };
    else if (data.length >= 10)        achievement = { icon: '🌟', label: 'Em Ascensão', desc: `${data.length} títulos na lista` };
    else                               achievement = { icon: '🌱', label: 'Começando a Jornada', desc: 'Cada grande otaku começou assim' };

    return {
      isAllTime, data, animes, mangas, completed,
      totalEps, totalMin, topGenres, topMedia,
      avgScore, statusCount, level, levelLabel, levelColor, levelPct,
      allEps, nextThreshold, currentThreshold,
      peakMonth, achievement,
    };
  }, []);
}

/* ─── Componentes visuais ─── */
function GlowStat({ value, label, icon: Icon, color, sub }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: `1px solid ${color}30`,
      borderRadius: 18, padding: '24px 28px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: `${color}18`, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

function GenreBar({ genre, count, max, color, rank }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', width: 16, textAlign: 'right' }}>
        {rank}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {genre}
      </span>
      <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color,
          borderRadius: 5, transition: 'width 0.8s ease',
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

function StatusPill({ label, count, color, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px',
      background: `${color}0d`, border: `1px solid ${color}25`,
      borderRadius: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{count}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</span>
      </div>
    </div>
  );
}

/* ─── Monthly Activity ─── */
function ActivityBar({ month, count, maxCount }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{
          width: '70%', height: `${Math.max(pct, count > 0 ? 8 : 3)}%`,
          background: count > 0
            ? 'linear-gradient(180deg, var(--purple-light), var(--purple))'
            : 'rgba(255,255,255,0.05)',
          borderRadius: '3px 3px 0 0',
          transition: 'height 0.6s ease',
          boxShadow: count > 0 ? '0 0 8px rgba(124,58,237,0.4)' : 'none',
        }} />
      </div>
      {count > 0 && (
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--purple-light)' }}>{count}</span>
      )}
      <span style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{month}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════ */
export default function Wrapped() {
  useTitle(`Wrapped ${YEAR}`);
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const s = useWrappedStats();

  const STATUS_MAP = {
    WATCHING:      { label: 'Assistindo',  color: '#a78bfa' },
    COMPLETED:     { label: 'Completo',    color: '#4ade80' },
    ON_HOLD:       { label: 'Em Pausa',    color: '#fbbf24' },
    DROPPED:       { label: 'Abandonado',  color: '#f87171' },
    PLAN_TO_WATCH: { label: 'Planejado',   color: '#60a5fa' },
  };

  const totalTitles = s.data.length;
  const maxGenreCount = s.topGenres[0]?.count || 1;

  /* Atividade mensal */
  const monthly = useMemo(() => getMonthlyActivity(12), []);
  const maxMonth = Math.max(...monthly.map(m => m.count), 1);

  /* Share */
  const handleShare = () => {
    const lines = [
      `🎌 Meu Wrapped ${YEAR} no Nakama`,
      ``,
      `📺 ${s.totalEps} episódios assistidos`,
      `⏱️ ${fmtHours(s.totalMin)} no total`,
      `✅ ${s.completed.length} títulos completos`,
      `⭐ Nível ${s.level} — ${s.levelLabel}`,
      s.topGenres[0] ? `❤️ Gênero favorito: ${s.topGenres[0].genre}` : '',
      ``,
      `nakama.app — Anime Tracker`,
    ].filter(l => l !== undefined).join('\n');

    if (navigator.share) {
      navigator.share({ title: `Meu Wrapped ${YEAR}`, text: lines }).catch(() => {});
    } else {
      navigator.clipboard.writeText(lines).then(() => {
        alert('Resumo copiado para a área de transferência!');
      });
    }
  };

  if (totalTitles === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
        <div style={{ fontSize: 64 }}>🎌</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center' }}>Sua jornada ainda está começando</h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>
          Adicione animes à sua lista para ver seu Wrapped personalizado aqui.
        </p>
        <button onClick={() => navigate('/search')} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
          background: 'rgba(124,58,237,0.15)', border: '1px solid var(--purple)',
          borderRadius: 12, color: 'var(--purple-light)', fontSize: 14, fontWeight: 600,
        }}>
          Explorar animes <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div ref={pageRef} style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 80 }}>

      {/* ── HERO ── */}
      <div style={{
        position: 'relative', padding: '64px 40px 52px', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(79,70,229,0.08) 50%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Blobs decorativos */}
        {[
          { top: -60, right: 100, size: 300, color: 'rgba(124,58,237,0.12)' },
          { top: 40, right: -40, size: 200, color: 'rgba(79,70,229,0.1)' },
          { bottom: -80, left: 200, size: 250, color: 'rgba(244,114,182,0.08)' },
        ].map((b, i) => (
          <div key={i} style={{
            position: 'absolute', ...b,
            width: b.size, height: b.size, borderRadius: '50%',
            background: b.color, filter: 'blur(40px)', pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', maxWidth: 700 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--purple-light)', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '3px 10px' }}>
              {s.isAllTime ? 'All Time' : YEAR}
            </span>
          </div>
          <h1 style={{
            fontSize: 52, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05,
            background: 'linear-gradient(135deg, #fff 0%, var(--purple-light) 60%, #f472b6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Sua Jornada<br />no Nakama
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 14, maxWidth: 420 }}>
            {totalTitles} título{totalTitles !== 1 ? 's' : ''} — {fmtHours(s.totalMin)} da sua vida bem investidos em anime e mangá.
          </p>
        </div>

        {/* Share button */}
        <button onClick={handleShare} style={{
          position: 'absolute', top: 40, right: 40,
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'rgba(255,255,255,0.07)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '10px 16px',
          color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
          backdropFilter: 'blur(8px)', transition: 'all 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--purple)'; e.currentTarget.style.color = 'var(--purple-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
          <Share2 size={14} /> Compartilhar
        </button>
      </div>

      <div style={{ padding: '36px 40px 0', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── CONQUISTA ── */}
        {s.achievement && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(124,58,237,0.06))',
            border: '1px solid rgba(251,191,36,0.25)',
            borderRadius: 18, padding: '20px 24px',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, fontSize: 28,
              background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {s.achievement.icon}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: 4 }}>Conquista do Ano</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{s.achievement.label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{s.achievement.desc}</p>
            </div>
          </div>
        )}

        {/* ── STATS GRID ── */}
        <div>
          <SectionLabel icon={BarChart2} color="#a78bfa">Números</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            <GlowStat icon={Tv}       color="#a78bfa" label="Episódios"  value={s.totalEps.toLocaleString()} sub={`${s.animes.length} séries/filmes`} />
            <GlowStat icon={Clock}    color="#60a5fa" label="Tempo total" value={fmtHours(s.totalMin)} sub={`≈ ${Math.round(s.totalMin / 60 / 24)} dias`} />
            <GlowStat icon={Award}    color="#4ade80" label="Completos"   value={s.completed.length} sub={`de ${totalTitles} títulos`} />
            {s.avgScore && <GlowStat icon={Star} color="#fbbf24" label="Nota média" value={s.avgScore} sub="Suas avaliações" />}
            {s.mangas.length > 0 && <GlowStat icon={BookOpen} color="#fb7185" label="Capítulos" value={s.mangas.reduce((acc, m) => acc + (m.progress || 0), 0).toLocaleString()} sub={`${s.mangas.length} mangás/novels`} />}
          </div>
        </div>

        {/* ── NÍVEL ── */}
        <div>
          <SectionLabel icon={TrendingUp} color="#fbbf24">Nível</SectionLabel>
          <div style={{
            background: 'var(--bg-card)', border: `1px solid ${s.levelColor}30`,
            borderRadius: 18, padding: '24px 28px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: `linear-gradient(135deg, ${s.levelColor}30, ${s.levelColor}10)`,
              border: `2px solid ${s.levelColor}50`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: s.levelColor }}>{s.level}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: s.levelColor, marginBottom: 4 }}>{s.levelLabel}</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                {s.allEps.toLocaleString()} episódios acumulados
                {s.level < 7 && ` · faltam ${(s.nextThreshold - s.allEps).toLocaleString()} para o próximo nível`}
              </p>
              {s.level < 7 && (
                <div style={{ position: 'relative' }}>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${s.levelPct}%`,
                      background: `linear-gradient(90deg, ${s.levelColor}, ${s.levelColor}aa)`,
                      borderRadius: 4, transition: 'width 1s ease',
                      boxShadow: `0 0 10px ${s.levelColor}66`,
                    }} />
                  </div>
                  <span style={{ position: 'absolute', right: 0, top: 12, fontSize: 11, color: 'var(--text-muted)' }}>{s.levelPct}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── GÊNEROS ── */}
        {s.topGenres.length > 0 && (
          <div>
            <SectionLabel icon={Heart} color="#f472b6">Gêneros Favoritos</SectionLabel>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {s.topGenres.map((g, i) => (
                <GenreBar key={g.genre} genre={g.genre} count={g.count} max={maxGenreCount}
                  color={GENRE_COLORS[i % GENRE_COLORS.length]} rank={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* ── TOP ANIMES ── */}
        {s.topMedia.length > 0 && (
          <div>
            <SectionLabel icon={Trophy} color="#fbbf24">Top Títulos Completos</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.topMedia.map((m, i) => {
                const title = m.title?.english || m.title?.romaji || 'Sem título';
                const score = m.averageScore ? (m.averageScore / 10).toFixed(1) : null;
                const isAnime = !['MANGA','NOVEL','ONE_SHOT'].includes(m.format);
                return (
                  <div key={m.id} onClick={() => navigate(`/anime/${m.id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.1s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.background = 'rgba(124,58,237,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : 'var(--text-muted)', width: 28, textAlign: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    {m.coverImage?.large && (
                      <img src={m.coverImage.large} alt={title} loading="lazy"
                        style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.format}</span>
                        {m.seasonYear && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· {m.seasonYear}</span>}
                      </div>
                    </div>
                    {score && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <Star size={12} fill="#fbbf24" color="#fbbf24" />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{score}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STATUS BREAKDOWN ── */}
        {Object.keys(s.statusCount).length > 0 && (
          <div>
            <SectionLabel icon={Zap} color="#60a5fa">Status da Lista</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(s.statusCount)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <StatusPill
                    key={status}
                    label={STATUS_MAP[status]?.label || status}
                    count={count}
                    color={STATUS_MAP[status]?.color || '#fff'}
                    total={totalTitles}
                  />
                ))}
            </div>
          </div>
        )}

        {/* ── ATIVIDADE MENSAL ── */}
        <div>
          <SectionLabel icon={Calendar} color="#34d399">Atividade Mensal</SectionLabel>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px 28px' }}>
            {s.peakMonth.count > 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                Mês mais ativo: <span style={{ color: 'var(--purple-light)', fontWeight: 600 }}>{s.peakMonth.label}</span> com {s.peakMonth.count} título{s.peakMonth.count !== 1 ? 's' : ''}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110 }}>
              {monthly.map(m => (
                <ActivityBar key={m.label} month={PT_MONTHS[m.month] || m.label} count={m.count} maxCount={maxMonth} />
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          padding: '36px 40px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.04))',
          border: '1px solid rgba(124,58,237,0.2)', borderRadius: 24,
        }}>
          <span style={{ fontSize: 32 }}>🎌</span>
          <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Continue sua jornada</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Descubra novos animes e expanda sua lista.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
            <button onClick={() => navigate('/discover')} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(124,58,237,0.15)', border: '1px solid var(--purple)',
              borderRadius: 12, padding: '11px 20px',
              color: 'var(--purple-light)', fontSize: 14, fontWeight: 600,
            }}>
              Descobrir <ChevronRight size={14} />
            </button>
            <button onClick={handleShare} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '11px 20px',
              color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600,
            }}>
              <Share2 size={14} /> Compartilhar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─── Section label ─── */
function SectionLabel({ icon: Icon, color, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{children}</span>
    </div>
  );
}
