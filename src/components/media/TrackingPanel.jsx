import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STATUS_LABELS, STATUS_ORDER, upsertListEntry, removeListEntry } from '../../lib/mediaList';
import { recordActivity } from '../../lib/streaks';
import EpisodeGrid from './EpisodeGrid';

// Cortes diagonais reutilizados nos controles de progresso (identidade HUD).
const STEP_CUT = 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)';
const TAG_CUT  = 'polygon(5px 0, 100% 0, 100% 100%, 0 100%, 0 5px)';
const SEG_CUT  = 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)';
const SEGMENT_COUNT = 14;

// Divide o progresso em SEGMENT_COUNT blocos visuais (não é 1 bloco por
// episódio — um mangá com 900+ capítulos ficaria ilegível) e marca o
// último bloco preenchido como "cap" (aceso/pulsando), representando a
// posição atual — leitura tipo barra de vida de RPG.
function buildSegments(progress, maxProgress) {
  if (!maxProgress) return [];
  const pct = Math.min(Math.max(progress, 0) / maxProgress, 1);
  const filled = Math.round(pct * SEGMENT_COUNT);
  return Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    if (i < filled - 1) return 'on';
    if (i === filled - 1) return 'cap';
    return 'off';
  });
}

/**
 * Painel de tracking (status/progresso/nota/favorito) de um item de mídia.
 * `mediaItemId` é o id em public.media_items (já garantido no catálogo
 * pela página que renderiza este painel via ensureMediaItem).
 */
export default function TrackingPanel({ mediaItemId, maxProgress, initialEntry, episodesInfo, nextAiringEpisode, malId, coverImage }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [entry, setEntry]     = useState(initialEntry);
  const [saving, setSaving]   = useState(false);

  useEffect(() => setEntry(initialEntry), [initialEntry]);

  if (!user) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-center">
        <p className="text-sm text-[var(--text-muted)]">Entre para adicionar à sua lista, marcar progresso e dar nota.</p>
        <Link to="/login" className="mt-3 inline-block rounded-lg bg-gradient-to-r from-purple to-blue px-4 py-2 text-sm font-semibold text-white">
          Entrar
        </Link>
      </div>
    );
  }

  const save = async (patch) => {
    setSaving(true);
    const merged = {
      status:   entry?.status ?? 'planned',
      progress: entry?.progress ?? 0,
      rating:   entry?.rating ?? null,
      favorite: entry?.favorite ?? false,
      ...patch,
    };
    const { data, error } = await upsertListEntry(user.id, mediaItemId, merged);
    setSaving(false);
    if (error) { showToast('Não deu para salvar. Tenta de novo.', 'error'); return; }
    setEntry(data);
    recordActivity(user.id); // fire-and-forget — não bloqueia a UI nem falha o save se der erro
  };

  const handleRemove = async () => {
    setSaving(true);
    const { error } = await removeListEntry(user.id, mediaItemId);
    setSaving(false);
    if (error) { showToast('Não deu para remover.', 'error'); return; }
    setEntry(null);
    showToast('Removido da lista.', 'info');
  };

  const progress = entry?.progress ?? 0;
  const clampProgress = (n) => Math.max(0, maxProgress ? Math.min(n, maxProgress) : n);
  const segments = buildSegments(progress, maxProgress);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Minha lista</h3>
        <button
          onClick={() => save({ favorite: !entry?.favorite })}
          disabled={saving}
          aria-label="Favoritar"
          aria-pressed={!!entry?.favorite}
          className="text-[var(--text-muted)] transition-colors hover:text-pink-400"
        >
          <Heart size={18} className={entry?.favorite ? 'fill-pink-400 text-pink-400' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STATUS_ORDER.map(s => (
          <button
            key={s}
            onClick={() => save({ status: s })}
            disabled={saving}
            aria-pressed={entry?.status === s}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              entry?.status === s
                ? 'bg-purple/20 text-[var(--text)]'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Progresso</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => save({ progress: clampProgress(progress - 1) })}
              disabled={saving || progress <= 0}
              aria-label="Diminuir progresso em 1"
              style={{ clipPath: STEP_CUT }}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-sm text-purple-light transition-[filter] hover:[filter:drop-shadow(0_0_8px_var(--purple-glow))] disabled:opacity-30 disabled:hover:filter-none"
            >
              −
            </button>
            <span
              style={{ clipPath: TAG_CUT }}
              className="min-w-[64px] border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-center font-mono text-[12px] font-bold text-[var(--text)]"
            >
              {progress}{maxProgress ? ` / ${maxProgress}` : ''}
            </span>
            <button
              onClick={() => save({ progress: clampProgress(progress + 1) })}
              disabled={saving || (maxProgress && progress >= maxProgress)}
              aria-label="Aumentar progresso em 1"
              style={{ clipPath: STEP_CUT }}
              className="flex h-7 w-7 items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] text-sm text-purple-light transition-[filter] hover:[filter:drop-shadow(0_0_8px_var(--purple-glow))] disabled:opacity-30 disabled:hover:filter-none"
            >
              +
            </button>
          </div>
        </div>

        {!!maxProgress && (
          <div
            className="flex gap-[3px]"
            role="progressbar"
            aria-label="Progresso de episódios"
            aria-valuemin={0}
            aria-valuemax={maxProgress}
            aria-valuenow={progress}
            aria-valuetext={`${progress} de ${maxProgress}`}
          >
            {segments.map((state, i) => (
              <i
                key={i}
                style={{ clipPath: SEG_CUT }}
                className={`h-3.5 flex-1 ${
                  state === 'cap' ? 'hud-cap-pulse bg-gradient-to-b from-white to-blue-light'
                  : state === 'on' ? 'bg-gradient-to-b from-purple-light to-blue'
                  : 'bg-white/[0.06]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <EpisodeGrid
        total={maxProgress}
        progress={progress}
        episodesInfo={episodesInfo}
        nextAiringEpisode={nextAiringEpisode}
        malId={malId}
        fallbackImage={coverImage}
        disabled={saving}
        onSelect={ep => save({ progress: clampProgress(ep) })}
      />

      <div className="flex items-center justify-between gap-3">
        <label htmlFor="tracking-rating" className="text-xs text-[var(--text-muted)]">Nota</label>
        <input
          id="tracking-rating"
          type="number"
          min={0}
          max={10}
          step={0.5}
          value={entry?.rating ?? ''}
          onChange={e => save({ rating: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="—"
          aria-label="Sua nota, de 0 a 10"
          className="w-16 rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-center text-sm text-[var(--text)] outline-none focus:border-purple"
        />
      </div>

      {entry && (
        <button
          onClick={handleRemove}
          disabled={saving}
          className="flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-red-400"
        >
          <Trash2 size={13} /> Remover da lista
        </button>
      )}
    </div>
  );
}
