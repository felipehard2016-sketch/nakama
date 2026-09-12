import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { queryAniList, TRENDING_ANIME } from '../lib/anilist';
import { getUserList, STATUS_LABELS, preferredTitle } from '../lib/mediaList';
import { useAuth } from '../context/AuthContext';
import MediaCard from '../components/ui/MediaCard';
import { useTitle } from '../hooks/useTitle';

function Row({ title, children }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {children}
      </div>
    </section>
  );
}

export default function Home() {
  useTitle('Home');
  const { user } = useAuth();

  const [trending, setTrending] = useState(null);
  const [watching, setWatching] = useState(null);

  useEffect(() => {
    queryAniList(TRENDING_ANIME, { page: 1, perPage: 12 })
      .then(data => setTrending(data.Page.media))
      .catch(() => setTrending([]));
  }, []);

  useEffect(() => {
    if (!user) { setWatching([]); return; }
    getUserList(user.id).then(({ data }) => {
      setWatching((data || []).filter(e => e.status === 'watching').slice(0, 12));
    });
  }, [user]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {user ? `Bem-vindo de volta!` : 'Bem-vindo ao Nakama'}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {user ? 'Aqui está o que está em alta e o que você está acompanhando.' : 'Entre para começar a montar sua lista.'}
        </p>
      </div>

      {user && (
        <Row title="Continuar assistindo">
          {watching === null && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
          {watching?.length === 0 && (
            <p className="col-span-full text-sm text-[var(--text-muted)]">
              Nada em "Assistindo" ainda — <Link to="/buscar" className="text-purple-light hover:underline">busque algo</Link> pra começar.
            </p>
          )}
          {watching?.map(entry => (
            <Link key={entry.id} to={`/anime/${entry.media_items.external_id}`} className="group flex flex-col gap-2">
              <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--bg-card)]">
                <img src={entry.media_items.cover_url} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="line-clamp-2 text-[13px] font-medium text-[var(--text)] group-hover:text-purple-light">
                {entry.media_items.title}
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {STATUS_LABELS[entry.status]} · ep. {entry.progress}
              </p>
            </Link>
          ))}
        </Row>
      )}

      <Row title="Em alta agora">
        {trending === null && Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
        ))}
        {trending?.map(media => <MediaCard key={media.id} media={media} subtitle={preferredTitle(media.title) !== media.title?.romaji ? media.title?.romaji : undefined} />)}
      </Row>
    </div>
  );
}
