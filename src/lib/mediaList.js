import { supabase } from './supabase';

/*
 * Camada de dados do módulo anime/mangá contra o schema v2
 * (supabase/schema.sql): media_items é o catálogo compartilhado,
 * user_media_list só guarda a relação usuário↔mídia.
 */

export const STATUS_LABELS = {
  watching:  'Assistindo',
  completed: 'Completo',
  on_hold:   'Em Pausa',
  dropped:   'Abandonado',
  planned:   'Planejado',
};

export const STATUS_ORDER = ['watching', 'completed', 'on_hold', 'planned', 'dropped'];

export function preferredTitle(title) {
  if (!title) return '';
  return title.english || title.romaji || title.native || '';
}

/** Garante que o item existe no catálogo compartilhado (media_items) e devolve a linha. */
export async function ensureMediaItem({ type, externalId, title, coverUrl, metadata = {} }) {
  const { data, error } = await supabase
    .from('media_items')
    .upsert(
      { type, external_id: String(externalId), title, cover_url: coverUrl, metadata },
      { onConflict: 'type,external_id' },
    )
    .select()
    .single();
  return { data, error };
}

/** Busca a entrada da lista pessoal do usuário para uma mídia específica (ou null). */
export async function getListEntry(userId, mediaItemId) {
  if (!userId || !mediaItemId) return null;
  const { data } = await supabase
    .from('user_media_list')
    .select('id, status, progress, rating, favorite, updated_at')
    .eq('user_id', userId)
    .eq('media_id', mediaItemId)
    .maybeSingle();
  return data;
}

/** Cria/atualiza a entrada da lista pessoal (status, progresso, nota, favorito). */
export async function upsertListEntry(userId, mediaItemId, patch) {
  const { data, error } = await supabase
    .from('user_media_list')
    .upsert(
      { user_id: userId, media_id: mediaItemId, ...patch },
      { onConflict: 'user_id,media_id' },
    )
    .select()
    .single();
  return { data, error };
}

export async function removeListEntry(userId, mediaItemId) {
  return supabase
    .from('user_media_list')
    .delete()
    .eq('user_id', userId)
    .eq('media_id', mediaItemId);
}

/** Lista completa do usuário, já com os dados do catálogo (media_items) embutidos. */
export async function getUserList(userId) {
  return supabase
    .from('user_media_list')
    .select(`
      id, status, progress, rating, favorite, updated_at,
      media_items ( id, type, external_id, title, cover_url, metadata )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
}
