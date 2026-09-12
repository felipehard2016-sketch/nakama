import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getUserList } from '../lib/mediaList';
import { getStreak } from '../lib/streaks';
import {
  ACHIEVEMENT_CATEGORIES, checkAllAchievements, getTotalPoints,
  syncUnlockedAchievements, getUnlockedAchievementIds,
} from '../lib/achievements';
import { useTitle } from '../hooks/useTitle';

// Cortes/molde reutilizados no badge (identidade HUD).
const BADGE_CUT = 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)';
const ICON_CUT  = 'polygon(7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%, 0 7px)';
const SEG_CUT   = 'polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)';
const SEGMENTS  = 10;

// Segmentos visuais de progresso até o desbloqueio (mesma linguagem da
// barra de episódios do TrackingPanel) — só aparece pra quem ainda não
// desbloqueou.
function progressSegments(progress, total) {
  const filled = Math.round(Math.min(progress / total, 1) * SEGMENTS);
  return Array.from({ length: SEGMENTS }, (_, i) => i < filled ? 'on' : 'off');
}

/**
 * Badge de conquista com acento dourado (reservado só pra este
 * componente — sinaliza "raridade/evento", nunca usado como cor de
 * interface padrão). `justUnlocked` liga a animação de unlock (~1.1s,
 * roda uma única vez, só para quem acabou de desbloquear nesta sessão).
 */
function Badge({ a, justUnlocked }) {
  const segments = !a.unlocked ? progressSegments(a.progress, a.total) : [];

  return (
    <div
      className={`relative flex flex-col items-center gap-2 overflow-hidden p-4 text-center ${justUnlocked ? 'hud-unlocking' : ''} ${
        a.unlocked
          ? 'border border-[rgba(251,191,36,0.35)] bg-gradient-to-br from-[rgba(251,191,36,0.1)] to-[var(--bg-card)]'
          : 'border border-[var(--border)] bg-[var(--bg-card)] opacity-60'
      }`}
      style={{ clipPath: BADGE_CUT }}
    >
      {justUnlocked && (
        <span
          className="hud-burst pointer-events-none absolute inset-[-40%] z-0"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.55) 0%, transparent 60%)' }}
        />
      )}

      <div
        className={`relative z-10 flex h-12 w-12 items-center justify-center text-2xl ${justUnlocked ? 'hud-pop' : ''}`}
        style={{
          clipPath: ICON_CUT,
          background: a.unlocked ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.05)',
          border: a.unlocked ? '1px solid rgba(251,191,36,0.6)' : '1px solid var(--border)',
        }}
      >
        {a.icon}
      </div>

      <p className="relative z-10 text-sm font-semibold text-[var(--text)]">{a.title}</p>
      <p className="relative z-10 text-[11px] leading-snug text-[var(--text-muted)]">{a.desc}</p>

      {!a.unlocked && (
        <div className="relative z-10 flex w-full gap-[2px]">
          {segments.map((s, i) => (
            <i
              key={i}
              style={{ clipPath: SEG_CUT }}
              className={`h-1.5 flex-1 ${s === 'on' ? 'bg-gradient-to-r from-purple-light to-blue' : 'bg-white/5'}`}
            />
          ))}
        </div>
      )}

      <span
        className="relative z-10 font-mono text-[10px] font-bold"
        style={{ color: a.unlocked ? '#fbbf24' : 'var(--color-purple-light)' }}
      >
        +{a.points} PTS
      </span>
    </div>
  );
}

export default function Achievements() {
  useTitle('Conquistas');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [achievements, setAchievements] = useState(null);
  // Ids desbloqueados NESTA carga da página — só eles tocam a animação
  // de unlock; conquistas já antigas ficam com o visual dourado estático.
  const [justUnlockedIds, setJustUnlockedIds] = useState(() => new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: entries }, streak, unlockedIds] = await Promise.all([
        getUserList(user.id),
        getStreak(user.id),
        getUnlockedAchievementIds(user.id),
      ]);

      const checked = checkAllAchievements(entries || [], streak);
      const newly = await syncUnlockedAchievements(user.id, checked, unlockedIds);
      newly.forEach(a => showToast(`Conquista desbloqueada: ${a.title} 🎉`, 'success'));

      setJustUnlockedIds(new Set(newly.map(a => a.id)));
      setAchievements(checked);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!achievements) {
    return <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple/25 border-t-purple" />
    </div>;
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Conquistas</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {unlockedCount}/{achievements.length} desbloqueadas · {getTotalPoints(achievements)} pontos
        </p>
      </div>

      {ACHIEVEMENT_CATEGORIES.map(cat => (
        <section key={cat}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">{cat}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {achievements.filter(a => a.category === cat).map(a => (
              <Badge key={a.id} a={a} justUnlocked={justUnlockedIds.has(a.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
