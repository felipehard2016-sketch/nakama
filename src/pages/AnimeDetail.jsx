import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Clock, Tv } from 'lucide-react';
import { queryAniList, MEDIA_DETAILS } from '../lib/anilist';
import { ensureMediaItem, getListEntry, preferredTitle } from '../lib/mediaList';
import { useAuth } from '../context/AuthContext';
import TrackingPanel from '../components/media/TrackingPanel';
import ArcNotes from '../components/media/ArcNotes';
import LazyImg from '../components/ui/LazyImg';
import MediaCard from '../components/ui/MediaCard';
import Formatted from '../components/ui/Formatted';
import { useTitle } from '../hooks/useTitle';
import { cleanAniListText } from '../lib/format';

export default function AnimeDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [media, setMedia]         = useState(null);
  const [mediaItemId, setMediaItemId] = useState(null);
  const [entry, setEntry]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  useTitle(media ? preferredTitle(media.title) : undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const data = await queryAniList(MEDIA_DETAILS, { id: Number(id) });
        const m = data.Media;
        if (cancelled) return;
        setMedia(m);

        const type = (m.type || 'ANIME').toLowerCase();
        const { data: mediaItem } = await ensureMediaItem({
          type,
          externalId: m.id,
          title: preferredTitle(m.title),
          coverUrl: m.coverImage?.large,
          metadata: m,
        });
        if (cancelled) return;
        if (mediaItem) {
          setMediaItemId(mediaItem.id);
          if (user) setEntry(await getListEntry(user.id, mediaItem.id));
        }
      } catch {
        if (!cancelled) setError('Não deu para carregar essa mídia agora.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, user]);

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple/25 border-t-purple" />
    </div>;
  }

  if (error || !media) {
    return <p className="py-10 text-center text-sm text-red-400">{error || 'Mídia não encontrada.'}</p>;
  }

  const title = preferredTitle(media.title);
  const isManga = media.type === 'MANGA';
  const maxProgress = isManga ? media.chapters : media.episodes;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {media.bannerImage && (
        <div className="-mx-4 aspect-[3/1] w-[calc(100%+2rem)] overflow-hidden rounded-b-xl sm:-mx-6 sm:w-[calc(100%+3rem)] lg:-mx-8 lg:w-[calc(100%+4rem)]">
          <LazyImg src={media.bannerImage} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        <img
          src={media.coverImage?.extraLarge || media.coverImage?.large}
          alt={title}
          className="mx-auto h-56 w-40 shrink-0 rounded-lg object-cover shadow-lg md:mx-0"
        />

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text)]">{title}</h1>
          {media.title?.native && <p className="text-sm text-[var(--text-muted)]">{media.title.native}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
            {media.averageScore != null && (
              <span className="flex items-center gap-1"><Star size={13} className="fill-yellow-400 text-yellow-400" /> {(media.averageScore / 10).toFixed(1)}</span>
            )}
            {maxProgress && (
              <span className="flex items-center gap-1"><Tv size={13} /> {maxProgress} {isManga ? 'capítulos' : 'episódios'}</span>
            )}
            {media.duration && <span className="flex items-center gap-1"><Clock size={13} /> {media.duration} min/ep</span>}
            {media.format && <span className="rounded bg-white/5 px-2 py-0.5">{media.format}</span>}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {media.genres?.map(g => (
              <span key={g} className="rounded-full bg-purple/15 px-2.5 py-0.5 text-[11px] text-purple-light">{g}</span>
            ))}
          </div>

          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
            <Formatted text={cleanAniListText(media.description)} />
          </p>

          {media.studios?.nodes?.length > 0 && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Estúdio: {media.studios.nodes.filter(s => s.isAnimationStudio).map(s => s.name).join(', ') || media.studios.nodes[0]?.name}
            </p>
          )}
        </div>

        <div className="w-full shrink-0 md:w-64">
          {mediaItemId && (
            <TrackingPanel
              mediaItemId={mediaItemId}
              maxProgress={maxProgress}
              initialEntry={entry}
              episodesInfo={media.streamingEpisodes}
              nextAiringEpisode={media.nextAiringEpisode}
              malId={media.idMal}
              coverImage={media.coverImage?.large}
            />
          )}
        </div>
      </div>

      {media.characters?.edges?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Personagens</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {media.characters.edges.slice(0, 16).map(({ node, role }) => (
              <Link key={node.id} to={`/personagem/${node.id}`} className="group flex flex-col gap-1.5">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-[var(--bg-card)]">
                  <LazyImg src={node.image?.large} alt={node.name?.full} style={{ width: '100%', height: '100%' }} />
                </div>
                <p className="line-clamp-1 text-[11px] font-medium text-[var(--text)] group-hover:text-purple-light">{node.name?.full}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{role}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {mediaItemId && <ArcNotes mediaId={mediaItemId} />}

      {media.recommendations?.nodes?.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Recomendados</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {media.recommendations.nodes
              .filter(n => n.mediaRecommendation)
              .slice(0, 12)
              .map(n => <MediaCard key={n.mediaRecommendation.id} media={n.mediaRecommendation} />)}
          </div>
        </section>
      )}
    </div>
  );
}
