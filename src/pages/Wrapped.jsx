import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Tv, Clock, CheckCircle2, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserList } from '../lib/mediaList';
import { computeWrappedStats } from '../lib/stats';
import { useTitle } from '../hooks/useTitle';

function Slide({ icon: Icon, children }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-2xl border border-purple/25 bg-gradient-to-br from-purple/15 via-transparent to-blue/10 p-8 text-center">
      {Icon && <Icon size={32} className="text-purple-light" />}
      {children}
    </div>
  );
}

export default function Wrapped() {
  useTitle('Wrapped');
  const { user } = useAuth();
  const year = new Date().getFullYear();
  const [stats, setStats] = useState(null);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUserList(user.id).then(({ data }) => setStats(computeWrappedStats(data || [], year)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!stats) {
    return <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple/25 border-t-purple" />
    </div>;
  }

  const slides = [
    <Slide key="intro" icon={Sparkles}>
      <h1 className="bg-gradient-to-r from-purple to-blue bg-clip-text text-3xl font-extrabold text-transparent">
        Seu {stats.year} no Nakama
      </h1>
      <p className="text-sm text-[var(--text-muted)]">{stats.itemsThisYear} títulos mexidos esse ano. Vamos recapitular.</p>
    </Slide>,
    <Slide key="eps" icon={Tv}>
      <p className="text-5xl font-extrabold text-[var(--text)]">{stats.totalEpisodes}</p>
      <p className="text-sm text-[var(--text-muted)]">episódios assistidos em {stats.year}</p>
    </Slide>,
    <Slide key="hours" icon={Clock}>
      <p className="text-5xl font-extrabold text-[var(--text)]">{stats.hoursWatched}</p>
      <p className="text-sm text-[var(--text-muted)]">horas na frente da tela</p>
    </Slide>,
    <Slide key="completed" icon={CheckCircle2}>
      <p className="text-5xl font-extrabold text-[var(--text)]">{stats.completedCount}</p>
      <p className="text-sm text-[var(--text-muted)]">títulos completados</p>
    </Slide>,
    stats.topGenres[0] && (
      <Slide key="genre">
        <p className="text-sm text-[var(--text-muted)]">Seu gênero favorito foi</p>
        <p className="bg-gradient-to-r from-purple to-blue bg-clip-text text-3xl font-extrabold text-transparent">
          {stats.topGenres[0].genre}
        </p>
      </Slide>
    ),
    stats.favorite && (
      <Slide key="fav" icon={Heart}>
        <p className="text-sm text-[var(--text-muted)]">Destaque do ano</p>
        <p className="text-xl font-bold text-[var(--text)]">{stats.favorite.media_items?.title}</p>
      </Slide>
    ),
  ].filter(Boolean);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 py-6">
      {slides[slide]}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSlide(s => Math.max(0, s - 1))}
          disabled={slide === 0}
          className="rounded-full bg-white/5 p-2 disabled:opacity-30"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === slide ? 'bg-purple' : 'bg-white/15'}`} />
          ))}
        </div>
        <button
          onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))}
          disabled={slide === slides.length - 1}
          className="rounded-full bg-white/5 p-2 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
