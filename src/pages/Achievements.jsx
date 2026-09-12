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

function Badge({ a }) {
  const pct = Math.round((a.progress / a.total) * 100);
  return (
    <div className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors ${
      a.unlocked ? 'border-purple/40 bg-purple/10' : 'border-[var(--border)] bg-[var(--bg-card)] opacity-60'
    }`}>
      <span className="text-3xl">{a.icon}</span>
      <p className="text-sm font-semibold text-[var(--text)]">{a.title}</p>
      <p className="text-[11px] leading-snug text-[var(--text-muted)]">{a.desc}</p>
      {!a.unlocked && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-purple/60" style={{ width: `${pct}%` }} />
        </div>
      )}
      <span className="text-[10px] font-medium text-purple-light">{a.points} pts</span>
    </div>
  );
}

export default function Achievements() {
  useTitle('Conquistas');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [achievements, setAchievements] = useState(null);

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
            {achievements.filter(a => a.category === cat).map(a => <Badge key={a.id} a={a} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
