import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Flame } from 'lucide-react';
import { queryAniList, HOME_BATCH_QUERY, HOME_GENRE_ROWS_QUERY } from '../lib/anilist';
import { getUserList, preferredTitle } from '../lib/mediaList';
import { cleanAniListText } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import MediaRow from '../components/ui/MediaRow';
import { useTitle } from '../hooks/useTitle';

const GENRE_LABELS = [
  ['action', 'Ação'],
  ['romance', 'Romance'],
  ['comedy', 'Comédia'],
  ['fantasy', 'Fantasia'],
  ['drama', 'Drama'],
  ['sliceOfLife', 'Slice of Life'],
];

function currentSeason() {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';
  return { season, year };
}

function HeroBanner({ media }) {
  if (!media) {
    return <div className="-mx-4 aspect-[16/9] w-[calc(100%+2rem)] animate-pulse rounded-b-2xl bg-[var(--bg-card)] sm:-mx-6 sm:aspect-[16/6] sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)] lg:rounded-2xl" />;
  }
  const title = preferredTitle(media.title);
  return (
    <div className="relative -mx-4 w-[calc(100%+2rem)] overflow-hidden rounded-b-2xl sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)] lg:rounded-2xl">
      <div className="aspect-[16/9] w-full sm:aspect-[16/6]">
        <img src={media.bannerImage || media.coverImage?.extraLarge} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/70 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5 sm:max-w-lg sm:p-8">
        <span className="flex w-fit items-center gap-1 rounded bg-gradient-to-r from-purple to-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <Flame size={11} /> Em alta agora
        </span>
        <h1 className="text-2xl font-black italic leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-4xl">
          {title}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          {media.genres?.slice(0, 3).map(g => (
            <span key={g} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/90 backdrop-blur-sm">{g}</span>
          ))}
        </div>
        <p className="line-clamp-2 text-xs text-white/70 sm:text-sm">{cleanAniListText(media.description)}</p>
        <Link
          to={`/anime/${media.id}`}
          className="mt-1 flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105"
        >
          <Play size={15} className="fill-black" /> Ver detalhes
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  useTitle('Home');
  const { user } = useAuth();

  const [homeData, setHomeData] = useState(null);
  const [genreRows, setGenreRows] = useState(null);
  const [watching, setWatching] = useState(null);

  useEffect(() => {
    const { season, year } = currentSeason();
    queryAniList(HOME_BATCH_QUERY, { season, year })
      .then(setHomeData)
      .catch(() => setHomeData({}));
    queryAniList(HOME_GENRE_ROWS_QUERY, {})
      .then(setGenreRows)
      .catch(() => setGenreRows({}));
  }, []);

  useEffect(() => {
    if (!user) { setWatching([]); return; }
    getUserList(user.id).then(({ data }) => {
      setWatching((data || []).filter(e => e.status === 'watching').slice(0, 15));
    });
  }, [user]);

  const watchingAsMedia = (watching || []).map(entry => ({
    id: entry.media_items.external_id,
    title: { romaji: entry.media_items.title },
    coverImage: { large: entry.media_items.cover_url },
    averageScore: null,
  }));

  const hero = homeData?.trending?.media?.[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <HeroBanner media={hero} />

      {user && watching?.length > 0 && (
        <MediaRow title="Continuar assistindo" items={watchingAsMedia} />
      )}

      {!homeData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-lg bg-[var(--bg-card)]" />
          ))}
        </div>
      )}

      {homeData?.topAnime?.media?.length > 0 && (
        <MediaRow title="Top 10 da semana" items={homeData.topAnime.media.slice(0, 10)} ranked />
      )}

      {homeData?.trending?.media?.length > 0 && (
        <MediaRow title="Em alta agora" items={homeData.trending.media} />
      )}

      {GENRE_LABELS.map(([key, label]) => (
        genreRows?.[key]?.media?.length > 0 && (
          <MediaRow key={key} title={label} items={genreRows[key].media} />
        )
      ))}

      {homeData?.topManga?.media?.length > 0 && (
        <MediaRow title="Mangás em alta" items={homeData.topManga.media} />
      )}
    </div>
  );
}
