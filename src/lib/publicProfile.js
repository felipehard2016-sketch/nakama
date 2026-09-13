import { supabase } from './supabase';

/**
 * Perfil público por username, pra rota /u/:username. `profiles` já é
 * de leitura pública desde o início do projeto — o que muda por conta
 * dessa feature é só a permissão de ler user_media_list de outra
 * pessoa, condicionada a `public_list = true` (ver schema.sql).
 */
export async function getPublicProfile(username) {
  return supabase
    .from('profiles')
    .select('id, username, avatar_url, level, public_list')
    .eq('username', username)
    .maybeSingle();
}
