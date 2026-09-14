import { Link } from 'react-router-dom';
import { Star, Clock } from 'lucide-react';
import LazyImg from './LazyImg';
import QuickAddControl from './QuickAddControl';
import { preferredTitle } from '../../lib/mediaList';
import { formatCountdown } from '../../lib/format';

/* Corte diagonal nos cantos (topo-direito / baixo-esquerdo) — parte da
   identidade "HUD" aprovada; ver mockup em Artifact. Mantido pequeno o
   bastante para não atrapalhar a leitura do pôster. */
const CUT = 14;
export const FRAME_CLIP = `polygon(${CUT}px 0, 100% 0, 100% calc(100% - ${CUT}px), calc(100% - ${CUT}px) 100%, 0 100%, 0 ${CUT}px)`;
const TAG_CLIP_R = 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)';
const TAG_CLIP_L = 'polygon(0 0, 100% 0, calc(100% - 6px) 100%, 0 100%)';

/**
 * Card de pôster usado em grids (busca, trending, minha lista, recomendações).
 * `entry`/`onEntryChange` são opcionais — quando vêm de um useQuickList
 * (uma leitura por página), o card ganha o botão de adicionar/mudar
 * status sem precisar abrir o detalhe.
 */
export default function MediaCard({ media, subtitle, entry, onEntryChange }) {
  const title = preferredTitle(media.title);
  const cover = media.coverImage?.large || media.coverImage?.extraLarge || media.cover_url;
  const airingEp = media.nextAiringEpisode?.episode;
  const isReleasing = media.status === 'RELEASING';

  return (
    <Link to={`/anime/${media.id}`} className="group flex flex-col gap-2">
      <div
        className="relative aspect-[2/3] w-full overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] transition-[filter,transform] duration-200 group-hover:-translate-y-1 group-hover:[filter:drop-shadow(0_0_14px_var(--purple-glow))] group-focus-visible:-translate-y-1 group-focus-visible:[filter:drop-shadow(0_0_14px_var(--purple-glow))]"
        style={{ clipPath: FRAME_CLIP }}
      >
        <LazyImg src={cover} alt={title} style={{ width: '100%', height: '100%' }} />

        {media.averageScore != null && (
          <div
            className="absolute right-0 top-2 z-10 flex items-center gap-1 bg-black/75 py-0.5 pl-2.5 pr-2 font-mono text-[11px] font-bold text-white backdrop-blur"
            style={{ clipPath: TAG_CLIP_R }}
          >
            <Star size={10} className="fill-yellow-400 text-yellow-400" />
            {(media.averageScore / 10).toFixed(1)}
          </div>
        )}

        {airingEp != null && (
          <div
            className="absolute left-0 top-2 z-10 bg-gradient-to-r from-purple to-blue py-0.5 pl-2.5 pr-2 font-mono text-[10px] font-bold tracking-wide text-white"
            style={{ clipPath: TAG_CLIP_L }}
          >
            EP {airingEp}
          </div>
        )}

        {onEntryChange && (
          <QuickAddControl
            media={media}
            entry={entry}
            onEntryChange={onEntryChange}
            className="absolute bottom-2 right-2 z-20"
          />
        )}
      </div>

      <div>
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[var(--text)] group-hover:text-purple-light">
          {title}
        </p>
        {subtitle && <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{subtitle}</p>}
        {!subtitle && media.nextAiringEpisode?.timeUntilAiring != null && (
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-muted)]">
            <Clock size={10} className="text-purple-light" />
            Ep {media.nextAiringEpisode.episode} {formatCountdown(media.nextAiringEpisode.timeUntilAiring)}
          </p>
        )}
        {!subtitle && media.nextAiringEpisode?.timeUntilAiring == null && isReleasing && (
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
            No ar
          </p>
        )}
      </div>
    </Link>
  );
}
