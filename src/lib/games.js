import { ensureMediaItem, upsertListEntry, getUserList } from './mediaList';

/*
 * Módulo de jogos (passo 7) — escopo reduzido: sem chave de API do
 * RAWG/IGDB configurada (VITE_RAWG_API_KEY vazio), não tem busca de
 * catálogo automática. Cadastro é manual: o usuário digita o título e
 * cria um item novo em media_items (type='game'). Sem um id externo
 * estável, cada cadastro gera um media_items novo — títulos repetidos
 * não deduplicam sozinhos como fariam via API.
 */

export const GAME_STATUS_LABELS = {
  watching:  'Jogando',
  completed: 'Completo',
  dropped:   'Abandonado',
  planned:   'Planejado',
  platinum:  'Platinado',
};

export const GAME_STATUS_ORDER = ['watching', 'completed', 'platinum', 'planned', 'dropped'];

export async function addGameToList(userId, { title, coverUrl }, status = 'planned') {
  const slug = title.trim().toLowerCase().replace(/\s+/g, '-');
  const { data: mediaItem, error: mediaError } = await ensureMediaItem({
    type: 'game',
    externalId: `manual-${slug}-${Date.now()}`,
    title: title.trim(),
    coverUrl: coverUrl || null,
    metadata: {},
  });
  if (mediaError) return { error: mediaError };
  return upsertListEntry(userId, mediaItem.id, { status, progress: 0, favorite: false });
}

export async function getUserGames(userId) {
  const { data, error } = await getUserList(userId);
  return { data: (data || []).filter(e => e.media_items?.type === 'game'), error };
}
