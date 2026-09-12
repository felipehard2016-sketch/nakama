import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tv, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserList } from '../lib/mediaList';
import { computeStats } from '../lib/stats';
import { levelFromEpisodes } from '../lib/leveling';
import GenreBars from '../components/ui/GenreBars';
import { useTitle } from '../hooks/useTitle';

// Corte diagonal + leitura em mono — mesma identidade HUD do resto do
// app, aplicada aqui aos "readouts" numéricos de stats.
const TILE_CUT = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';
const TILE_ICON_CUT = 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)';

function Tile({ icon: Icon, value, label }) {
  return (
    <div
      className="flex flex-col items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] p-4 text-center"
      style={{ clipPath: TILE_CUT }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center bg-purple/10 text-purple-light"
        style={{ clipPath: TILE_ICON_CUT }}
      >
        <Icon size={16} />
      </div>
      <p className="font-mono text-xl font-bold tabular-nums text-[var(--text)]">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
    </div>
  );
}

export default function Stats() {
  useTitle('Stats');
  const { user, profile, updateProfile } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUserList(user.id).then(({ data }) => {
      const s = computeStats(data || []);
      setStats(s);

      const { level } = levelFromEpisodes(s.totalEpisodes);
      if (profile && level !== profile.level) updateProfile({ level });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!stats) {
    return <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple/25 border-t-purple" />
    </div>;
  }

  const { level, label } = levelFromEpisodes(stats.totalEpisodes);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Stats</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Nível {level} · {label}</p>
        </div>
        <Link to="/wrapped" className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple to-blue px-3.5 py-2 text-xs font-semibold text-white">
          <Sparkles size={14} /> Ver Wrapped
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile icon={Tv} value={stats.totalEpisodes} label="episódios" />
        <Tile icon={Clock} value={stats.hoursWatched} label="horas assistidas" />
        <Tile icon={CheckCircle2} value={stats.completedCount} label="completos" />
        <Tile icon={Tv} value={stats.totalChapters} label="capítulos lidos" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text)]">Top gêneros</h2>
        <GenreBars data={stats.topGenres} />
      </div>
    </div>
  );
}
