import { useMemo } from 'react';
import { useTitle } from '../hooks/useTitle';
import {
  checkAllAchievements, getTotalPoints,
  ACHIEVEMENT_CATEGORIES, computeAchievementStats,
} from '../lib/achievements';
import { Trophy, Flame, Star, Lock } from 'lucide-react';

/* ─── Raridade por pontos ─── */
function getRarity(points) {
  if (points >= 150) return { label: 'Lendário', color: '#fbbf24' };
  if (points >= 80)  return { label: 'Épico',    color: '#a78bfa' };
  if (points >= 40)  return { label: 'Raro',     color: '#60a5fa' };
  return                    { label: 'Comum',    color: '#94a3b8' };
}

/* ─── Card de conquista ─── */
function AchievementCard({ achievement }) {
  const { unlocked, progress, total, icon, title, desc, points, category } = achievement;
  const rarity = getRarity(points);
  const pct    = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 0;
  const near   = !unlocked && pct >= 50;

  return (
    <div style={{
      background: unlocked
        ? `linear-gradient(135deg, ${rarity.color}0d, var(--bg-card))`
        : 'var(--bg-card)',
      border: `1px solid ${unlocked ? `${rarity.color}40` : 'var(--border)'}`,
      borderRadius: 16, padding: '14px 16px',
      transition: 'border-color 0.2s, transform 0.2s',
      opacity: unlocked ? 1 : 0.7,
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = unlocked ? `${rarity.color}70` : 'rgba(255,255,255,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = unlocked ? `${rarity.color}40` : 'var(--border)'; }}>

      {/* Glow no canto para desbloqueadas */}
      {unlocked && (
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: `${rarity.color}15`, filter: 'blur(16px)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: unlocked ? `${rarity.color}18` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${unlocked ? `${rarity.color}35` : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          filter: unlocked ? 'none' : 'grayscale(100%) opacity(0.4)',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: unlocked ? 'var(--text)' : 'var(--text-secondary)' }}>{title}</p>
            {!unlocked && <Lock size={11} color="var(--text-muted)" />}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</p>
        </div>
      </div>

      {/* Footer: raridade + pontos + barra */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
          color: rarity.color, background: `${rarity.color}15`,
          border: `1px solid ${rarity.color}30`, borderRadius: 5, padding: '2px 7px',
        }}>{rarity.label}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {unlocked ? (
            <span style={{ color: rarity.color, fontWeight: 700 }}>+{points} pts</span>
          ) : (
            <span>{points} pts</span>
          )}
        </span>
      </div>

      {/* Barra de progresso (só se não desbloqueada e tem progresso) */}
      {!unlocked && total > 1 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10.5, color: near ? '#fbbf24' : 'var(--text-muted)' }}>
              {near ? '🔥 Quase lá!' : 'Progresso'}
            </span>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
              {progress.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: near ? '#fbbf24' : 'linear-gradient(90deg, var(--purple), var(--purple-light))',
              borderRadius: 2, transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Streak widget ─── */
function StreakWidget({ stats }) {
  const { currentStreak, longestStreak, streakActive } = stats;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      background: currentStreak > 0
        ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(249,115,22,0.06))'
        : 'var(--bg-card)',
      border: `1px solid ${currentStreak > 0 ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
      borderRadius: 18, padding: '20px 28px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 42, lineHeight: 1, marginBottom: 4 }}>
          {streakActive ? '🔥' : currentStreak > 0 ? '🔥' : '💤'}
        </div>
        <p style={{ fontSize: 28, fontWeight: 900, color: currentStreak > 0 ? '#fbbf24' : 'var(--text-muted)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {currentStreak}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>dias seguidos</p>
      </div>
      <div style={{ width: 1, height: 60, background: 'var(--border)', flexShrink: 0 }} />
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          {currentStreak > 0
            ? streakActive
              ? 'Você está em sequência! 🎯'
              : 'Continue hoje para manter!'
            : 'Comece uma sequência hoje'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          Marque episódios ou atualize sua lista todos os dias para manter a streak.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Flame size={13} color="#f97316" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Recorde: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{longestStreak} dias</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════ */
export default function Achievements() {
  useTitle('Conquistas');

  const achievements = useMemo(() => checkAllAchievements(), []);
  const stats        = useMemo(() => computeAchievementStats(), []);
  const totalPoints  = getTotalPoints(achievements);
  const unlocked     = achievements.filter(a => a.unlocked).length;
  const total        = achievements.length;
  const pct          = Math.round((unlocked / total) * 100);

  /* Rank por pontos */
  function getRank(pts) {
    if (pts >= 800)  return { label: 'Otaku Supremo', color: '#fbbf24', icon: '👑' };
    if (pts >= 500)  return { label: 'Mestre',         color: '#a78bfa', icon: '🏆' };
    if (pts >= 250)  return { label: 'Veterano',       color: '#60a5fa', icon: '⭐' };
    if (pts >= 100)  return { label: 'Experiente',     color: '#34d399', icon: '🌟' };
    if (pts >= 30)   return { label: 'Iniciante',      color: '#94a3b8', icon: '🌱' };
    return                  { label: 'Novato',         color: '#6b7280', icon: '🌀' };
  }
  const rank = getRank(totalPoints);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: '36px 24px 32px',
        background: 'linear-gradient(180deg, rgba(251,191,36,0.07) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={24} color="#fbbf24" /> Conquistas
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {unlocked} de {total} desbloqueadas · {pct}% completo
            </p>
          </div>

          {/* Rank card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: `linear-gradient(135deg, ${rank.color}12, transparent)`,
            border: `1px solid ${rank.color}30`, borderRadius: 14, padding: '14px 20px',
          }}>
            <span style={{ fontSize: 28 }}>{rank.icon}</span>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Rank</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: rank.color }}>{rank.label}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Star size={11} fill="#fbbf24" color="#fbbf24" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>{totalPoints} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progresso geral */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Progresso geral</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple-light)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', maxWidth: 400 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, var(--purple), #f472b6)',
              borderRadius: 3, transition: 'width 0.8s ease',
              boxShadow: '0 0 10px rgba(124,58,237,0.5)',
            }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 24px 60px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* ── STREAK ── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Flame size={16} color="#f97316" />
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sequência Diária</h2>
          </div>
          <StreakWidget stats={stats} />
        </section>

        {/* ── CONQUISTAS POR CATEGORIA ── */}
        {ACHIEVEMENT_CATEGORIES.map(cat => {
          const catAchievements = achievements.filter(a => a.category === cat);
          if (!catAchievements.length) return null;
          const catUnlocked = catAchievements.filter(a => a.unlocked).length;
          return (
            <section key={cat}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{cat}</h2>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple-light)', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '1px 8px' }}>
                  {catUnlocked}/{catAchievements.length}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {catAchievements
                  .sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0) || a.points - b.points)
                  .map(a => <AchievementCard key={a.id} achievement={a} />)}
              </div>
            </section>
          );
        })}

      </div>
    </div>
  );
}
