import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import LazyImg from '../ui/LazyImg';

/*
 * Grade de episódios pra marcar progresso rápido em animes longos.
 * Clicar no episódio N marca progresso = N de uma vez (tudo até ali
 * fica "assistido", já que progresso já era só "assisti até aqui" por
 * baixo dos panos) — não precisa clicar +1 uma centena de vezes.
 *
 * `episodesInfo` vem de media.streamingEpisodes (AniList) — nem todo
 * anime tem essa informação, e quando tem nem sempre cobre todos os
 * episódios. Por isso: os que têm imagem/nome viram uma linha "rica";
 * o resto cai de volta pro quadradinho simples (só o número).
 */
function EpisodeRow({ ep, title, thumbnail, watched, onSelect, disabled }) {
  return (
    <button
      onClick={() => onSelect(ep)}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors ${
        watched ? 'bg-purple/15' : 'hover:bg-white/5'
      }`}
    >
      <div className="relative h-9 w-16 shrink-0 overflow-hidden rounded-md bg-black/30">
        {thumbnail ? (
          <LazyImg src={thumbnail} alt="" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] text-[var(--text-muted)]">EP</div>
        )}
        <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] font-semibold text-white">
          {ep}
        </span>
      </div>
      <p className={`min-w-0 flex-1 truncate text-[11px] leading-tight ${watched ? 'font-medium text-white' : 'text-[var(--text-secondary)]'}`}>
        {title || `Episódio ${ep}`}
      </p>
      {watched && <Check size={14} className="shrink-0 text-purple-light" />}
    </button>
  );
}

export default function EpisodeGrid({ total, progress, episodesInfo = [], onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  // Quando o total de episódios ainda não é conhecido (anime em exibição
  // sem contagem fechada), mostra uma folga além do progresso atual e
  // deixa expandir manualmente — sem isso já marcaria episódios sozinho.
  const [visibleCount, setVisibleCount] = useState(() => Math.max(progress + 12, 12));

  const count = total || visibleCount;
  const episodes = Array.from({ length: count }, (_, i) => i + 1);
  const richCount = episodesInfo.length; // quantos episódios têm foto/nome vindos da AniList
  const richEpisodes = episodes.filter(ep => ep <= richCount);
  const plainEpisodes = episodes.filter(ep => ep > richCount);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)]"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? 'Esconder episódios' : `Ver episódios${total ? ` (${total})` : ''}`}
      </button>

      {open && (
        <div className="flex max-h-80 flex-col overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-2">
          {richEpisodes.length > 0 && (
            <div className="flex flex-col gap-0.5">
              {richEpisodes.map(ep => (
                <EpisodeRow
                  key={ep}
                  ep={ep}
                  title={episodesInfo[ep - 1]?.title}
                  thumbnail={episodesInfo[ep - 1]?.thumbnail}
                  watched={ep <= progress}
                  onSelect={onSelect}
                  disabled={disabled}
                />
              ))}
            </div>
          )}

          {plainEpisodes.length > 0 && (
            <>
              {richEpisodes.length > 0 && (
                <p className="mb-1.5 mt-3 px-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  Mais episódios
                </p>
              )}
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                {plainEpisodes.map(ep => {
                  const watched = ep <= progress;
                  return (
                    <button
                      key={ep}
                      onClick={() => onSelect(ep)}
                      disabled={disabled}
                      title={`Episódio ${ep}`}
                      className={`aspect-square rounded-md text-[11px] font-medium transition-colors ${
                        watched
                          ? 'bg-purple text-white'
                          : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text)]'
                      }`}
                    >
                      {ep}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!total && (
            <button
              onClick={() => setVisibleCount(c => c + 24)}
              className="mt-2 w-full rounded-md bg-white/5 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Carregar mais…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
