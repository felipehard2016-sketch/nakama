/*
 * Jikan (api.jikan.moe) — API não-oficial do MyAnimeList, gratuita e
 * sem chave. Usada só pra completar dado de episódio que a AniList não
 * tem: numeração/título mais confiável (mal_id já É o número do
 * episódio, sem precisar adivinhar por regex) e sinopse por episódio
 * (sob demanda, quando o usuário abre um episódio específico).
 *
 * Limite de uso público: ~3 req/s, ~60/min — por isso a lista pagina
 * com uma pequena pausa entre chamadas, e a sinopse só é buscada
 * quando o usuário pede (não em lote pra todos os episódios).
 */
const BASE = 'https://api.jikan.moe/v4';
const listCache = new Map();   // malId -> Promise<episódios>
const detailCache = new Map(); // `${malId}:${ep}` -> Promise<sinopse>

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

/** Lista de episódios (número, título, data de exibição) via MAL. */
export async function getEpisodeList(malId) {
  if (!malId) return [];
  if (listCache.has(malId)) return listCache.get(malId);

  const promise = (async () => {
    const episodes = [];
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 15) { // teto de segurança (~1500 eps)
      try {
        const json = await fetchJson(`${BASE}/anime/${malId}/episodes?page=${page}`);
        for (const ep of json.data || []) {
          episodes.push({ number: ep.mal_id, title: ep.title, aired: ep.aired, filler: ep.filler });
        }
        hasNext = !!json.pagination?.has_next_page;
        page += 1;
        if (hasNext) await wait(400); // respeita o rate limit entre páginas
      } catch {
        break; // Jikan fora do ar ou anime sem episódios listados — degrada silenciosamente
      }
    }
    return episodes;
  })();

  listCache.set(malId, promise);
  return promise;
}

/** Sinopse de um episódio específico — buscada sob demanda (1 chamada por clique). */
export async function getEpisodeSynopsis(malId, episodeNumber) {
  if (!malId || !episodeNumber) return null;
  const key = `${malId}:${episodeNumber}`;
  if (detailCache.has(key)) return detailCache.get(key);

  const promise = fetchJson(`${BASE}/anime/${malId}/episodes/${episodeNumber}`)
    .then(json => json.data?.synopsis || null)
    .catch(() => null);

  detailCache.set(key, promise);
  return promise;
}
