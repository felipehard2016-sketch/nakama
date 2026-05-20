const ANILIST_URL = 'https://graphql.anilist.co';

/* ── Cache em memória (TTL 5 min) ── */
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheKey(query, variables) {
  return JSON.stringify({ query: query.replace(/\s+/g, ' ').trim(), variables });
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

  /* Cache hit */
  if (cache) {
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  }

  const res = await fetchWithRetry(ANILIST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  if (cache) _cache.set(key, { data: json.data, ts: Date.now() });
  return json.data;
}

/** Invalida cache de uma query específica */
export function invalidateCache(query, variables = {}) {
  _cache.delete(cacheKey(query, variables));
}

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
    $search: String, $type: MediaType, $genre: String,
    $status: MediaStatus, $year: Int, $minScore: Int,
    $sort: [MediaSort], $page: Int, $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage currentPage }
      media(
        search: $search, type: $type, genre: $genre,
        status: $status, seasonYear: $year,
        averageScore_greater: $minScore,
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
