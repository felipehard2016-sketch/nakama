/* ─────────────────────────────────────────────────────────────
   recommendations.js — motor de recomendações baseado em gênero
   Fonte primária: localStorage (síncrono, sem latência)
──────────────────────────────────────────────────────────── */
import { getAllMedia } from './storage';
import { queryAniList, SEARCH_MEDIA } from './anilist';

/* Retorna os N gêneros mais recorrentes na lista do usuário
   Ponderação: COMPLETED=3, WATCHING=2, outros=1 */
export function getUserTopGenres(limit = 5) {
  const all = getAllMedia().filter(m => m.genres?.length && m.listStatus);
  if (!all.length) return [];

  const weights = { COMPLETED: 3, WATCHING: 2 };
  const counts  = {};
  all.forEach(m => {
    const w = weights[m.listStatus] || 1;
    m.genres.forEach(g => { counts[g] = (counts[g] || 0) + w; });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genre]) => genre);
}

/* Set de IDs de mídias já salvas (para excluir das recomendações) */
export function getSavedMediaIds() {
  return new Set(getAllMedia().filter(m => m.listStatus).map(m => String(m.id)));
}

/* Busca animes por gênero, excluindo já salvos */
export async function fetchRecommendationsByGenre(genre, perPage = 16) {
  /* Usa páginas aleatórias para variedade */
  const page = Math.floor(Math.random() * 3) + 1;
  const data = await queryAniList(SEARCH_MEDIA, {
    type: 'ANIME',
    genre,
    sort: ['SCORE_DESC'],
    minScore: 69,
    page,
    perPage,
  });
  const saved = getSavedMediaIds();
  return (data.Page.media || []).filter(m => !saved.has(String(m.id)));
}

/* Calcula overlap entre a lista do usuário e outra lista de IDs */
export function computeOverlap(otherIds = []) {
  const myIds = getSavedMediaIds();
  return otherIds.filter(id => myIds.has(String(id)));
}

/* Retorna motivo legível da recomendação */
export function getRecommendationReason(media, topGenres = []) {
  const matchedGenres = (media.genres || []).filter(g => topGenres.includes(g));
  if (matchedGenres.length > 0) {
    return `Porque você gosta de ${matchedGenres.slice(0, 2).join(' e ')}`;
  }
  return 'Recomendado para você';
}
