import { supabase } from './supabase';

const TABLE = 'episode_progress';

/* Avisa uma vez se a tabela não existir (não polui o console com 404 repetido) */
let _tableWarned = false;
function warnMissing(fnName, error) {
  if (!_tableWarned) {
    console.warn(`[Nakama] ${fnName}: ${error.message} — rode a migration SQL para criar a tabela episode_progress.`);
    _tableWarned = true;
  }
}

/**
 * Retorna um Set com os números de episódios assistidos.
 * Fallback silencioso para Set vazio se a tabela não existir.
 */
export async function getWatchedEpisodes(userId, mediaId) {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from(TABLE)
    .select('episode_number')
    .eq('user_id', userId)
    .eq('media_id', mediaId);
  if (error) { warnMissing('getWatchedEpisodes', error); return new Set(); }
  return new Set((data || []).map(r => r.episode_number));
}

/**
 * Marca ou desmarca um episódio. Fire-and-forget.
 */
export async function markEpisode(userId, mediaId, episodeNumber, watched) {
  if (!userId) return;
  if (watched) {
    const { error } = await supabase.from(TABLE).upsert(
      { user_id: userId, media_id: mediaId, episode_number: episodeNumber, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,media_id,episode_number' }
    );
    if (error) warnMissing('markEpisode', error);
  } else {
    const { error } = await supabase.from(TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('episode_number', episodeNumber);
    if (error) warnMissing('markEpisode', error);
  }
}

/**
 * Marca todos os episódios de 1 a `total` como assistidos.
 */
export async function markAllEpisodes(userId, mediaId, total) {
  if (!userId || !total) return;
  const rows = Array.from({ length: total }, (_, i) => ({
    user_id: userId, media_id: mediaId,
    episode_number: i + 1,
    watched_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from(TABLE)
    .upsert(rows, { onConflict: 'user_id,media_id,episode_number' });
  if (error) warnMissing('markAllEpisodes', error);
}

/**
 * Desmarca todos os episódios de uma mídia.
 */
export async function clearEpisodes(userId, mediaId) {
  if (!userId) return;
  const { error } = await supabase.from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('media_id', mediaId);
  if (error) warnMissing('clearEpisodes', error);
}
