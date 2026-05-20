/* ─────────────────────────────────────────────────────────────
   reviews.js — camada de acesso ao Supabase para reviews
──────────────────────────────────────────────────────────── */
import { supabase } from './supabase';

/* Busca todas as reviews de uma mídia (com display_name do perfil) */
export async function getReviews(mediaId) {
  const { data, error } = await supabase
    .from('anime_reviews')
    .select(`
      id, user_id, title, body, score, is_spoiler,
      upvotes, downvotes, created_at,
      user_profiles ( display_name )
    `)
    .eq('media_id', mediaId)
    .order('created_at', { ascending: false });

  if (error) {
    /* Tabela ainda não existe no Supabase — retorna vazio sem crashar */
    console.warn('[Nakama] getReviews:', error.message);
    return [];
  }
  return data || [];
}

/* Busca a review do usuário atual para uma mídia */
export async function getUserReview(mediaId, userId) {
  const { data } = await supabase
    .from('anime_reviews')
    .select('*')
    .eq('media_id', mediaId)
    .eq('user_id', userId)
    .single();
  return data || null;
}

/* Cria ou atualiza review */
export async function upsertReview({ userId, mediaId, title, body, score, isSpoiler }) {
  const { data, error } = await supabase
    .from('anime_reviews')
    .upsert({
      user_id:    userId,
      media_id:   mediaId,
      title:      title || null,
      body,
      score:      score ?? null,
      is_spoiler: isSpoiler || false,
    }, { onConflict: 'user_id,media_id' })
    .select()
    .single();

  if (error) throw error; /* lança para o caller mostrar toast de erro */
  return data;
}

/* Apaga a review do usuário */
export async function deleteReview(reviewId, userId) {
  const { error } = await supabase
    .from('anime_reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw error;
}

/* Registra voto (+1 / -1). Atualiza o contador na review. */
export async function voteReview(reviewId, userId, vote) {
  /* Upsert do voto */
  await supabase
    .from('review_votes')
    .upsert({ review_id: reviewId, user_id: userId, vote }, { onConflict: 'review_id,user_id' });

  /* Recalcula contadores */
  const { data: votes } = await supabase
    .from('review_votes')
    .select('vote')
    .eq('review_id', reviewId);

  const upvotes   = (votes || []).filter(v => v.vote === 1).length;
  const downvotes = (votes || []).filter(v => v.vote === -1).length;

  await supabase
    .from('anime_reviews')
    .update({ upvotes, downvotes })
    .eq('id', reviewId);

  return { upvotes, downvotes };
}

/* Busca o voto do usuário em uma review */
export async function getUserVote(reviewId, userId) {
  const { data } = await supabase
    .from('review_votes')
    .select('vote')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .single();
  return data?.vote ?? 0;
}
