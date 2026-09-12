import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard, { FRAME_CLIP } from './MediaCard';
import LazyImg from './LazyImg';

/**
 * Card do Top 10 estilo Netflix: número gigante contornado atrás do
 * pôster. Usa o mesmo corte diagonal (FRAME_CLIP) e glow do MediaCard
 * padrão — um Top 10 também é um "destaque", então segue a mesma
 * moldura, só que maior.
 */
function RankedCard({ media, rank }) {
  return (
    <Link to={`/anime/${media.id}`} className="group flex items-end">
      <span
        className="pointer-events-none -mr-5 select-none text-[64px] font-black italic leading-none text-transparent sm:-mr-7 sm:text-[84px]"
        style={{ WebkitTextStroke: '2px var(--text-muted)' }}
      >
        {rank}
      </span>
      <div
        className="relative z-10 aspect-[2/3] w-24 shrink-0 overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] transition-[filter,transform] duration-200 group-hover:-translate-y-1 group-hover:[filter:drop-shadow(0_0_16px_var(--purple-glow))] group-focus-visible:-translate-y-1 group-focus-visible:[filter:drop-shadow(0_0_16px_var(--purple-glow))] sm:w-28"
        style={{ clipPath: FRAME_CLIP }}
      >
        <LazyImg src={media.coverImage?.large} alt="" style={{ width: '100%', height: '100%' }} />
      </div>
    </Link>
  );
}

/**
 * Fileira de mídia com rolagem horizontal (estilo Netflix), em vez de
 * grid que quebra linha. `ranked` liga o visual de "Top 10" (número
 * gigante atrás do pôster); sem isso, usa o MediaCard padrão.
 */
export default function MediaRow({ title, items, ranked = false, seeAllHref }) {
  const scrollerRef = useRef(null);

  if (!items?.length) return null;

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold italic tracking-tight text-[var(--text)]">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-purple to-blue" />
          {title}
        </h2>
        {seeAllHref && (
          <Link to={seeAllHref} className="text-xs text-[var(--text-muted)] hover:text-purple-light">Ver tudo</Link>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Rolar para a esquerda"
          className="absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-r from-[var(--bg)] to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex"
        >
          <ChevronLeft size={22} className="text-[var(--text)]" />
        </button>

        <div ref={scrollerRef} className="scrollbar-none flex gap-3 overflow-x-auto scroll-smooth pb-1">
          {items.map((media, i) => (
            <div key={media.id} className="shrink-0" style={{ width: ranked ? undefined : '7rem' }}>
              {ranked ? <RankedCard media={media} rank={i + 1} /> : <MediaCard media={media} />}
            </div>
          ))}
        </div>

        <button
          onClick={() => scrollBy(1)}
          aria-label="Rolar para a direita"
          className="absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-center bg-gradient-to-l from-[var(--bg)] to-transparent opacity-0 transition-opacity group-hover/row:opacity-100 sm:flex"
        >
          <ChevronRight size={22} className="text-[var(--text)]" />
        </button>
      </div>
    </section>
  );
}
