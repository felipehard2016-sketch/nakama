const ANILIST_URL = 'https://graphql.anilist.co';

/* ── Cache em memória (TTL 5 min) ── */
const _cache = new Map();
const MEM_TTL = 5 * 60 * 1000;

/* ── Cache em localStorage (TTL 1 hora) ── */
const LS_PREFIX = 'nakama_ql_';
const LS_TTL    = 60 * 60 * 1000;

function cacheKey(query, variables) {
  return JSON.stringify({ query: query.replace(/\s+/g, ' ').trim(), variables });
}

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > LS_TTL) { localStorage.removeItem(LS_PREFIX + key); return null; }
    return data;
  } catch { return null; }
}

function lsSet(key, data) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    /* localStorage cheio ou indisponível — silencioso */
  }
}

/* ── Fetch com retry (até 2 tentativas, backoff 1s) ── */
async function fetchWithRetry(url, options, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export async function queryAniList(query, variables = {}, { cache = true } = {}) {
  const key = cacheKey(query, variables);

  if (cache) {
    /* 1. Cache em memória (5 min) — mais rápido */
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.ts < MEM_TTL) return hit.data;

    /* 2. Cache no localStorage (1 hora) — sobrevive ao reload */
    const lsHit = lsGet(key);
    if (lsHit) {
      _cache.set(key, { data: lsHit, ts: Date.now() }); // promove para memória
      return lsHit;
    }
  }

  const res = await fetchWithRetry(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  if (cache) {
    _cache.set(key, { data: json.data, ts: Date.now() });
    lsSet(key, json.data);
  }
  return json.data;
}

/** Invalida cache de uma query específica (memória + localStorage) */
export function invalidateCache(query, variables = {}) {
  const key = cacheKey(query, variables);
  _cache.delete(key);
  try { localStorage.removeItem(LS_PREFIX + key); } catch {}
}

/** Remove todas as entradas de cache AniList do localStorage */
export function clearAniListCache() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(LS_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
  _cache.clear();
}

/* ── Query única que busca todos os dados da Home em 1 request ── */
export const HOME_BATCH_QUERY = `
  query HomeBatch($season: MediaSeason, $year: Int) {
    trending: Page(page: 1, perPage: 20) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        status
        genres
        season
        seasonYear
        format
        description(asHtml: false)
      }
    }
    seasonal: Page(page: 1, perPage: 20) {
      media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        status
        genres
        format
        nextAiringEpisode { airingAt episode }
      }
    }
    topAnime: Page(page: 1, perPage: 10) {
      media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        averageScore
        format
        episodes
        status
      }
    }
    topManga: Page(page: 1, perPage: 10) {
      media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        averageScore
        format
        chapters
        status
      }
    }
  }
`;

export const TRENDING_ANIME = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        status
        genres
        season
        seasonYear
        format
        description(asHtml: false)
      }
    }
  }
`;

export const SEARCH_MEDIA = `
  query (
    $search: String, $type: MediaType, $genre: String, $tag: String,
    $status: MediaStatus, $year: Int, $minScore: Int, $country: CountryCode,
    $sort: [MediaSort], $page: Int, $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage currentPage }
      media(
        search: $search, type: $type, genre: $genre, tag: $tag,
        status: $status, seasonYear: $year,
        averageScore_greater: $minScore, countryOfOrigin: $country,
        sort: $sort, isAdult: false
      ) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        chapters
        status
        genres
        format
        season
        seasonYear
        description(asHtml: false)
      }
    }
  }
`;

export const MEDIA_DETAILS = `
  query ($id: Int) {
    Media(id: $id) {
      id
      idMal
      title { romaji english native }
      coverImage { large extraLarge color }
      bannerImage
      description(asHtml: false)
      averageScore
      meanScore
      episodes
      chapters
      volumes
      duration
      status
      genres
      tags { name rank isMediaSpoiler }
      format
      source
      season
      seasonYear
      startDate { year month day }
      endDate { year month day }
      studios { nodes { name isAnimationStudio } }
      characters(sort: ROLE, perPage: 16) {
        edges {
          role
          node { id name { full } image { large } }
          voiceActors(language: JAPANESE) { id name { full } image { large } }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 12) {
        nodes {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { large extraLarge color }
            averageScore
            format
            episodes
            chapters
            seasonYear
          }
        }
      }
      relations {
        edges {
          relationType
          node { id title { romaji english } coverImage { large } format type }
        }
      }
      trailer { id site }
      popularity
      favourites
      rankings { rank type context allTime season year }
      streamingEpisodes { title thumbnail url site }
      nextAiringEpisode { airingAt episode timeUntilAiring }
      airingSchedule(perPage: 50, notYetAired: false) {
        nodes { id episode airingAt }
      }
      externalLinks {
        id url site siteId type language
        color icon isDisabled
      }
    }
  }
`;

export const SEASONAL_ANIME = `
  query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        bannerImage
        averageScore
        episodes
        status
        genres
        format
        nextAiringEpisode { airingAt episode }
        airingSchedule(perPage: 3) { nodes { episode airingAt } }
      }
    }
  }
`;

export const TOP_ANIME = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: ANIME, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        averageScore
        format
        episodes
        status
      }
    }
  }
`;

export const TOP_MANGA = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(sort: SCORE_DESC, type: MANGA, isAdult: false) {
        id
        title { romaji english }
        coverImage { large extraLarge color }
        averageScore
        format
        chapters
        status
      }
    }
  }
`;

export const STUDIO_DETAILS = `
  query ($id: Int) {
    Studio(id: $id) {
      id
      name
      isAnimationStudio
      siteUrl
      favourites
      media(sort: START_DATE_DESC, isAdult: false, perPage: 50) {
        nodes {
          id
          title { romaji english }
          coverImage { large extraLarge color }
          bannerImage
          averageScore
          episodes
          chapters
          format
          season
          seasonYear
          status
          genres
          type
        }
      }
    }
  }
`;

export const SEARCH_CHARACTERS = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage }
      characters(search: $search, sort: SEARCH_MATCH) {
        id
        name { full native }
        image { large }
        favourites
        media(perPage: 4, sort: POPULARITY_DESC) {
          nodes {
            id
            title { romaji english }
            coverImage { large }
            format
          }
        }
      }
    }
  }
`;

export const SEARCH_STAFF = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage }
      staff(search: $search, sort: SEARCH_MATCH) {
        id
        name { full native }
        image { large }
        languageV2
        primaryOccupations
        favourites
        characters(perPage: 4, sort: FAVOURITES_DESC) {
          nodes {
            id
            name { full }
            image { large }
            media(perPage: 1, sort: POPULARITY_DESC) {
              nodes { id title { romaji english } coverImage { large } }
            }
          }
        }
      }
    }
  }
`;

export const SEARCH_STUDIOS = `
  query ($search: String, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage }
      studios(search: $search, sort: SEARCH_MATCH) {
        id
        name
        isAnimationStudio
        favourites
        media(perPage: 4, sort: POPULARITY_DESC, isAdult: false) {
          nodes {
            id
            title { romaji english }
            coverImage { large }
            averageScore
            seasonYear
          }
        }
      }
    }
  }
`;

export const CHARACTER_DETAILS = `
  query ($id: Int) {
    Character(id: $id) {
      id
      name { full native alternative }
      image { large }
      description(asHtml: false)
      gender
      dateOfBirth { year month day }
      age
      bloodType
      favourites
      media(page: 1, perPage: 20, sort: POPULARITY_DESC) {
        edges {
          node {
            id
            title { romaji english }
            coverImage { large }
            type
            format
          }
          voiceActors(language: JAPANESE) {
            id
            name { full native }
            image { large }
            languageV2
          }
        }
      }
    }
  }
`;
