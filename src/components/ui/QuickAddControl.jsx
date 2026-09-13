import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STATUS_LABELS, STATUS_ORDER, ensureMediaItem, upsertListEntry, removeListEntry, preferredTitle } from '../../lib/mediaList';

const REMOVE_VALUE = '__remove__';

const STATUS_COLOR = {
  watching:  'text-blue-light',
  completed: 'text-emerald-400',
  on_hold:   'text-yellow-400',
  dropped:   'text-red-400',
  planned:   'text-purple-light',
};

const CHIP_CUT = 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)';

/**
 * Botão de "adicionar/mudar status" direto no card, sem abrir o
 * detalhe. `entry` vem do mapa carregado por useQuickList (uma leitura
 * por página, não uma por card) — aqui só se grava no banco quando o
 * usuário de fato escolhe um status.
 *
 * A lista de opções usa um <select> nativo por baixo (visualmente
 * escondido, só o selo customizado aparece) em vez de um menu próprio:
 * cards moram dentro de fileiras com `overflow-x-auto` (MediaRow), e um
 * popover posicionado por CSS seria cortado por esse overflow. Um
 * <select> nativo desenha sua lista fora do fluxo normal — não é
 * cortado — e já vem com teclado/leitor de tela funcionando de graça.
 */
export default function QuickAddControl({ media, entry, onEntryChange, className = '' }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const currentStatus = entry?.status ?? null;

  const handleChange = async (e) => {
    const value = e.target.value;
    e.target.value = ''; // reseta o <select> — o "valor" de verdade é o `entry`, não o select
    if (!value || saving) return;
    setSaving(true);

    try {
      if (value === REMOVE_VALUE) {
        const mediaItemId = entry?.media_items?.id;
        if (!mediaItemId) return;
        const { error } = await removeListEntry(user.id, mediaItemId);
        if (error) { showToast('Não deu para remover. Tenta de novo.', 'error'); return; }
        onEntryChange?.(null);
        showToast('Removido da lista.', 'info');
        return;
      }

      let mediaItem = entry?.media_items ?? null;
      if (!mediaItem) {
        const type = (media.type || 'ANIME').toLowerCase();
        const { data: created, error: ensureError } = await ensureMediaItem({
          type,
          externalId: media.id,
          title: preferredTitle(media.title),
          coverUrl: media.coverImage?.large || media.coverImage?.extraLarge,
          metadata: media,
        });
        if (ensureError || !created) { showToast('Não deu para adicionar agora.', 'error'); return; }
        mediaItem = created;
      }

      const { data, error } = await upsertListEntry(user.id, mediaItem.id, {
        status:   value,
        progress: entry?.progress ?? 0,
        rating:   entry?.rating ?? null,
        favorite: entry?.favorite ?? false,
      });
      if (error) { showToast('Não deu para salvar. Tenta de novo.', 'error'); return; }
      // upsertListEntry só grava/lê a linha de user_media_list — não vem
      // com o media_items relacionado (isso só existe no select() do
      // getUserList). Sem recompor aqui, quem consome onEntryChange
      // (ContinueWatchingCard, MyList) quebraria em `entry.media_items`.
      onEntryChange?.({ ...data, media_items: mediaItem });
      showToast(entry ? 'Status atualizado.' : `Adicionado como "${STATUS_LABELS[value]}".`, 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        style={{ clipPath: CHIP_CUT }}
        className={`flex h-6 w-6 items-center justify-center bg-black/70 backdrop-blur transition-opacity ${saving ? 'opacity-50' : ''} ${
          currentStatus ? STATUS_COLOR[currentStatus] : 'text-white/80'
        }`}
      >
        {currentStatus ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
      </div>
      <select
        aria-label={currentStatus ? `Mudar status (atual: ${STATUS_LABELS[currentStatus]})` : 'Adicionar à lista'}
        value=""
        onChange={handleChange}
        disabled={saving}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
        /* O card inteiro é um <Link> — sem isso, abrir o select navegaria
           pro detalhe junto (o clique "vaza" pro <a> por baixo). */
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        onMouseDown={e => e.stopPropagation()}
      >
        <option value="" disabled>{currentStatus ? STATUS_LABELS[currentStatus] : 'Adicionar à lista'}</option>
        {STATUS_ORDER.map(s => (
          <option key={s} value={s}>{s === currentStatus ? `✓ ${STATUS_LABELS[s]}` : STATUS_LABELS[s]}</option>
        ))}
        {entry && <option value={REMOVE_VALUE}>Remover da lista</option>}
      </select>
    </div>
  );
}
