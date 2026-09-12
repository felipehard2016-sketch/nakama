import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import LazyImg from './LazyImg';
import { preferredTitle } from '../../lib/mediaList';

/** Card de pôster usado em grids (busca, trending, minha lista). */
export default function MediaCard({ media, subtitle }) {
  const title = preferredTitle(media.title);
  const cover = media.coverImage?.large || media.coverImage?.extraLarge || media.cover_url;

  return (
    <Link
      to={`/anime/${media.id}`}
      className="group flex flex-col gap-2 rounded-lg transition-transform hover:-translate-y-0.5"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[var(--bg-card)]">
        <LazyImg src={cover} alt={title} style={{ width: '100%', height: '100%' }} />
        {media.averageScore != null && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            {(media.averageScore / 10).toFixed(1)}
          </div>
        )}
      </div>
      <div>
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text)] group-hover:text-purple-light">
          {title}
        </p>
        {subtitle && <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </Link>
  );
}
