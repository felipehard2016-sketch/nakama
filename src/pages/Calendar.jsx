import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserList, preferredTitle } from '../lib/mediaList';
import { queryAniList, CALENDAR_SCHEDULE } from '../lib/anilist';
import { formatCountdown } from '../lib/format';
import ErrorState from '../components/ui/ErrorState';
import { useTitle } from '../hooks/useTitle';

export default function Calendar() {
  useTitle('Calendário');
  const { user } = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000); // recalcula a contagem regressiva a cada 30s
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(false);
    (async () => {
      try {
        const { data, error: listError } = await getUserList(user.id);
        if (listError) throw listError;

        const watchingAnime = (data || [])
          .filter(e => e.status === 'watching' && e.media_items?.type === 'anime')
          .map(e => Number(e.media_items.external_id));

        if (watchingAnime.length === 0) { if (!cancelled) setSchedule([]); return; }

        const result = await queryAniList(CALENDAR_SCHEDULE, { ids: watchingAnime }, { cache: true });
        const withSchedule = result.Page.media
          .filter(m => m.nextAiringEpisode)
          .sort((a, b) => a.nextAiringEpisode.airingAt - b.nextAiringEpisode.airingAt);
        if (!cancelled) setSchedule(withSchedule);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, reloadKey]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Calendário</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Próximos episódios dos animes que você está assistindo.</p>
      </div>

      {error && (
        <ErrorState message="Não deu para carregar o calendário agora." onRetry={() => setReloadKey(k => k + 1)} />
      )}

      {!error && schedule === null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {!error && schedule?.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--text-muted)]">
          Nenhum lançamento previsto — marque animes em andamento como "Assistindo" na{' '}
          <Link to="/minha-lista" className="text-purple-light hover:underline">sua lista</Link>.
        </p>
      )}

      {schedule?.map(m => {
        const secondsLeft = m.nextAiringEpisode.airingAt - Math.floor(now / 1000);
        return (
          <Link
            key={m.id}
            to={`/anime/${m.id}`}
            className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-colors hover:border-purple/40"
          >
            <img src={m.coverImage?.large} alt="" className="h-16 w-12 rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text)]">{preferredTitle(m.title)}</p>
              <p className="text-xs text-[var(--text-muted)]">Episódio {m.nextAiringEpisode.episode}</p>
            </div>
            <span className="shrink-0 rounded-full bg-purple/15 px-2.5 py-1 text-[11px] font-medium text-purple-light">
              {formatCountdown(secondsLeft)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
