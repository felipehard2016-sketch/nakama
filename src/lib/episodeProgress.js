import { supabase } from './supabase';

/**
 * Retorna um Set com os números de episódios assistidos.
 * Sempre lê do Supabase quando logado; fallback silencioso para Set vazio.
 */
export async function getWatchedEpisodes(userId, mediaId) {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('episode_progress')
    .select('episode_number')
    .eq('user_id', userId)
    .eq('media_id', mediaId);
  if (error) { console.error('getWatchedEpisodes:', error); return new Set(); }
  return new Set((data || []).map(r => r.episode_number));
}

/**
 * Marca ou desmarca um episódio. Fire-and-forget.
 */
export async function markEpisode(userId, mediaId, episodeNumber, watched) {
  if (!userId) return;
  if (watched) {
    await supabase.from('episode_progress').upsert(
      { user_id: userId, media_id: mediaId, episode_number: episodeNumber, watched_at: new Date().toISOString() },
      { onConflict: 'user_id,media_id,episode_number' }
    );
  } else {
    await supabase.from('episode_progress')
      .delete()
      .eq('user_id', userId)
      .eq('media_id', mediaId)
      .eq('episode_number', episodeNumber);
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
  await supabase.from('episode_progress')
    .upsert(rows, { onConflict: 'user_id,media_id,episode_number' });
}

/**
 * Desmarca todos os episódios de uma mídia.
 */
export async function clearEpisodes(userId, mediaId) {
  if (!userId) return;
  await supabase.from('episode_progress')
    .delete()
    .eq('user_id', userId)
    .eq('media_id', mediaId);
}
