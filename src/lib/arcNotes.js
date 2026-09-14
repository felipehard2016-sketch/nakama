import { supabase } from './supabase';

/** Camada de dados da "companion": notas de arco/teoria por mídia, privadas do autor. */

export async function getArcNotes(userId, mediaId) {
  return supabase
    .from('arc_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('media_id', mediaId)
    .order('created_at', { ascending: true });
}

export async function addArcNote(userId, mediaId, { arcName, content, isSpoiler }) {
  return supabase
    .from('arc_notes')
    .insert({ user_id: userId, media_id: mediaId, arc_name: arcName, content, is_spoiler: isSpoiler })
    .select()
    .single();
}

export async function deleteArcNote(id) {
  return supabase.from('arc_notes').delete().eq('id', id);
}
