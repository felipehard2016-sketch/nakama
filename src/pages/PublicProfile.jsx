import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flame, Trophy, Lock } from 'lucide-react';
import { getPublicProfile } from '../lib/publicProfile';
import { getStreak } from '../lib/streaks';
import { ACHIEVEMENTS, getUnlockedAchievementIds, getTotalPoints } from '../lib/achievements';
import { getUserList } from '../lib/mediaList';
import { computeStats } from '../lib/stats';
import { labelForLevel } from '../lib/leveling';
import MediaCard from '../components/ui/MediaCard';
import GenreBars from '../components/ui/GenreBars';
import ErrorState from '../components/ui/ErrorState';
import { useTitle } from '../hooks/useTitle';

export default function PublicProfile() {
  const { username } = useParams();
  useTitle(username ? `Perfil de ${username}` : 'Perfil');

  const [profile, setProfile] = useState(undefined); // undefined = carregando, null = não encontrado
  const [error, setError] = useState(false);
  const [streak, setStreak] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [stats, setStats] = useState(undefined); // undefined = não tentou (lista privada), null = falhou
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setProfile(undefined);

    (async () => {
      try {
        const { data: p, error: profileError } = await getPublicProfile(username);
        if (profileError) throw profileError;
        if (cancelled) return;
        setProfile(p || null);
        if (!p) return;

        const [streakRow, unlockedIds] = await Promise.all([
          getStreak(p.id),
          getUnlockedAchievementIds(p.id),
        ]);
        if (cancelled) return;
        setStreak(streakRow);
        setAchievements(ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockedIds.has(a.id) })));

        if (p.public_list) {
          const { data: list, error: listError } = await getUserList(p.id);
          if (cancelled) return;
          if (listError) { setStats(null); return; }
          setStats({ entries: list || [], summary: computeStats(list || []) });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => { cancelled = true; };
  }, [username, reloadKey]);

  if (error) {
    return <ErrorState message="Não deu para carregar esse perfil agora." onRetry={() => setReloadKey(k => k + 1)} />;
  }

  if (profile === undefined) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="h-24 animate-pulse rounded-xl bg-[var(--bg-card)]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />)}
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <p className="py-16 text-center text-sm text-[var(--text-muted)]">
        Não achamos ninguém com o usuário "{username}" — <Link to="/" className="text-purple-light hover:underline">voltar pra Home</Link>.
      </p>
    );
  }

  const levelLabel = labelForLevel(profile.level);
  const unlockedCount = achievements?.filter(a => a.unlocked).length ?? 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple to-blue text-xl font-bold text-white">
          {profile.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">{profile.username}</h1>
          <p className="text-sm text-[var(--text-muted)]">Nível {profile.level} · {levelLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
          <Flame size={16} className="mx-auto mb-1 text-orange-400" />
          <p className="text-lg font-bold text-[var(--text)]">{streak?.current_streak ?? 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">streak atual</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
          <Flame size={16} className="mx-auto mb-1 text-red-400" />
          <p className="text-lg font-bold text-[var(--text)]">{streak?.longest_streak ?? 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">streak recorde</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
          <Trophy size={16} className="mx-auto mb-1 text-yellow-400" />
          <p className="text-lg font-bold text-[var(--text)]">{unlockedCount}</p>
          <p className="text-[10px] text-[var(--text-muted)]">conquistas</p>
        </div>
      </div>

      {achievements && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Conquistas · {getTotalPoints(achievements)} pontos
          </h2>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
            {achievements.filter(a => a.unlocked).map(a => (
              <div
                key={a.id}
                title={a.title}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-purple/30 bg-purple/10 p-2 text-center"
              >
                <span className="text-xl">{a.icon}</span>
              </div>
            ))}
            {unlockedCount === 0 && (
              <p className="col-span-full py-4 text-center text-xs text-[var(--text-muted)]">Nenhuma conquista desbloqueada ainda.</p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Lista</h2>
        {!profile.public_list && (
          <p className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">
            <Lock size={14} className="shrink-0" /> Esta pessoa não tornou a lista pública.
          </p>
        )}

        {profile.public_list && stats === undefined && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />)}
          </div>
        )}

        {profile.public_list && stats === null && (
          <p className="text-sm text-[var(--text-muted)]">Não deu para carregar a lista agora.</p>
        )}

        {profile.public_list && stats && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
                <p className="text-lg font-bold text-[var(--text)]">{stats.summary.totalEpisodes}</p>
                <p className="text-[10px] text-[var(--text-muted)]">episódios</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
                <p className="text-lg font-bold text-[var(--text)]">{stats.summary.hoursWatched}</p>
                <p className="text-[10px] text-[var(--text-muted)]">horas</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
                <p className="text-lg font-bold text-[var(--text)]">{stats.summary.completedCount}</p>
                <p className="text-[10px] text-[var(--text-muted)]">completos</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 text-center">
                <p className="text-lg font-bold text-[var(--text)]">{stats.entries.length}</p>
                <p className="text-[10px] text-[var(--text-muted)]">itens na lista</p>
              </div>
            </div>

            {stats.summary.topGenres.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Top gêneros</h3>
                <GenreBars data={stats.summary.topGenres} />
              </div>
            )}

            {stats.entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-muted)]">Lista vazia por enquanto.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {stats.entries.slice(0, 24).map(entry => {
                  const m = entry.media_items;
                  return (
                    <MediaCard
                      key={entry.id}
                      media={{ id: m.external_id, type: m.type, title: { romaji: m.title }, coverImage: { large: m.cover_url } }}
                      subtitle={`ep. ${entry.progress}`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
