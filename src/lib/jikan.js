/* ─────────────────────────────────────────────────────────────
   jikan.js — MyAnimeList não-oficial via api.jikan.moe/v4
   • Cache 10 min
   • Rate-limit friendly (Jikan permite ~3 req/s)
   • Nunca lança erro fatal — retorna null em caso de falha
──────────────────────────────────────────────────────────── */
const JIKAN_URL = 'https://api.jikan.moe/v4';
const _cache    = new Map();
const TTL       = 10 * 60 * 1000;

async function jikanGet(path) {
  const hit = _cache.get(path);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  try {
    const res = await fetch(`${JIKAN_URL}${path}`);
    if (res.status === 429) { console.warn('[Jikan] rate limit'); return null; }
    if (!res.ok) return null;
    const json = await res.json();
    _cache.set(path, { data: json, ts: Date.now() });
    return json;
  } catch (err) {
    console.warn('[Jikan] fetch error:', err.message);
    return null;
  }
}

/* ── Busca MAL ID a partir de um título ── */
export async function searchJikanByTitle(title, type = 'anime') {
  const data = await jikanGet(`/${type}?q=${encodeURIComponent(title)}&limit=5&sfw=true`);
  return data?.data || [];
}

/* ── Dados completos (inclui trailer, themes, staff, relations) ── */
export async function getJikanFull(malId) {
  const data = await jikanGet(`/anime/${malId}/full`);
  return data?.data || null;
}

/* ── Temas (OP / ED) ── */
export async function getJikanThemes(malId) {
  const data = await jikanGet(`/anime/${malId}/themes`);
  return data?.data || null; // { openings: string[], endings: string[] }
}

/* ── Staff (diretor, compositor…) ── */
export async function getJikanStaff(malId) {
  const data = await jikanGet(`/anime/${malId}/staff`);
  return data?.data || [];
}

/* ── Notícias ── */
export async function getJikanNews(malId, page = 1) {
  const data = await jikanGet(`/anime/${malId}/news?page=${page}`);
  return data?.data || [];
}

/* ── Invalidar cache de um path ── */
export function invalidateJikanCache(path) {
  _cache.delete(path);
}
