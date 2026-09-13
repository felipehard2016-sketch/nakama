import { supabase } from './supabase';

/** Últimas notificações do usuário, com o título/capa do anime já embutidos. */
export async function getNotifications(userId, limit = 30) {
  return supabase
    .from('notifications')
    .select('id, media_id, episode, message, read, created_at, media_items ( external_id, title, cover_url )')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function markAllNotificationsRead(userId) {
  return supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
}

export async function markNotificationRead(id) {
  return supabase.from('notifications').update({ read: true }).eq('id', id);
}

/**
 * Cria o aviso de um episódio novo — `ignoreDuplicates` faz o papel de
 * "ON CONFLICT DO NOTHING": a constraint UNIQUE(user_id, media_id,
 * episode) garante que o mesmo episódio nunca gera duas notificações,
 * mesmo chamando isso toda vez que o app checa (ver useNotifications).
 */
export async function createEpisodeNotification(userId, mediaId, episode, message) {
  return supabase
    .from('notifications')
    .upsert(
      { user_id: userId, media_id: mediaId, episode, message },
      { onConflict: 'user_id,media_id,episode', ignoreDuplicates: true },
    );
}
