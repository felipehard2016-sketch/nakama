import { queryAniList, ANILIST_LIST_COLLECTION, MAL_ID_LOOKUP } from './anilist';
import { bulkEnsureMediaItems, bulkUpsertListEntries } from './mediaList';

export const ANILIST_STATUS_MAP = {
  CURRENT: 'watching', REPEATING: 'watching', PLANNING: 'planned',
  COMPLETED: 'completed', DROPPED: 'dropped', PAUSED: 'on_hold',
};

export const MAL_STATUS_MAP = {
  anime: { Watching: 'watching', Completed: 'completed', 'On-Hold': 'on_hold', Dropped: 'dropped', 'Plan to Watch': 'planned' },
  manga: { Reading: 'watching', Completed: 'completed', 'On-Hold': 'on_hold', Dropped: 'dropped', 'Plan to Read': 'planned' },
};

const XML_NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXmlEntities(str) {
  return str.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (match, code) => {
    if (code[0] === '#') {
      const codePoint = code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return XML_NAMED_ENTITIES[code] ?? match;
  });
}

function extractBlocks(xml, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  return [...xml.matchAll(re)].map(m => m[1]);
}

function extractField(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return '';
  const raw = m[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return decodeXmlEntities(cdata ? cdata[1] : raw);
}

/**
 * Parseia um export XML do MyAnimeList (um arquivo por tipo — o MAL
 * exporta anime e mangá separados, mas aceita os dois formatos aqui).
 * Regex simples em vez de DOMParser: dentro de cada bloco <anime>/
 * <manga> as tags do MAL são sempre planas (sem repetir a mesma tag
 * aninhada), então não precisa de parser de XML de verdade — e isso
 * mantém a função pura e testável sem precisar de ambiente de DOM.
 */
export function parseMalXml(xmlText) {
  const anime = extractBlocks(xmlText, 'anime').map(b => ({
    type: 'anime',
    malId: Number(extractField(b, 'series_animedb_id')),
    title: extractField(b, 'series_title'),
    progress: Number(extractField(b, 'my_watched_episodes') || 0),
    score: Number(extractField(b, 'my_score') || 0),
    status: MAL_STATUS_MAP.anime[extractField(b, 'my_status')] || 'planned',
  }));

  const manga = extractBlocks(xmlText, 'manga').map(b => ({
    type: 'manga',
    malId: Number(extractField(b, 'series_mangadb_id')),
    title: extractField(b, 'series_title'),
    progress: Number(extractField(b, 'my_read_chapters') || 0),
    score: Number(extractField(b, 'my_score') || 0),
    status: MAL_STATUS_MAP.manga[extractField(b, 'my_status')] || 'planned',
  }));

  return [...anime, ...manga].filter(e => e.malId > 0);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Garante o catálogo (em lote) e grava a lista pessoal (em lote) pra um grupo de itens já resolvidos. */
async function saveBatch(userId, items) {
  const { data: mediaItems, error } = await bulkEnsureMediaItems(items);
  if (error || !mediaItems) return 0;

  const byKey = new Map(mediaItems.map(m => [`${m.type}:${m.external_id}`, m]));
  const rows = items
    .map(item => {
      const m = byKey.get(`${item.type}:${String(item.externalId)}`);
      return m ? { mediaId: m.id, status: item.status, progress: item.progress, rating: item.rating } : null;
    })
    .filter(Boolean);
  if (rows.length === 0) return 0;

  const { error: listError } = await bulkUpsertListEntries(userId, rows);
  return listError ? 0 : rows.length;
}

/**
 * Importa a lista pública de um usuário da AniList — só o nome de
 * usuário, sem OAuth (funciona porque a maioria das contas da AniList
 * é pública por padrão; importar uma lista PRIVADA exigiria login com
 * a conta da própria AniList, decisão em aberto, fora desta versão).
 */
export async function importFromAniList(userId, username, onProgress) {
  const [animeRes, mangaRes] = await Promise.all([
    queryAniList(ANILIST_LIST_COLLECTION, { userName: username, type: 'ANIME' }, { cache: false }),
    queryAniList(ANILIST_LIST_COLLECTION, { userName: username, type: 'MANGA' }, { cache: false }),
  ]);

  const entries = [
    ...(animeRes?.MediaListCollection?.lists || []).flatMap(l => l.entries),
    ...(mangaRes?.MediaListCollection?.lists || []).flatMap(l => l.entries),
  ];
  const total = entries.length;
  if (total === 0) return { imported: 0, total: 0 };

  let imported = 0;
  for (const batch of chunk(entries, 40)) {
    const items = batch.map(e => ({
      type: e.media.type.toLowerCase(),
      externalId: e.media.id,
      title: e.media.title.english || e.media.title.romaji,
      coverUrl: e.media.coverImage?.large,
      metadata: e.media,
      status: ANILIST_STATUS_MAP[e.status] || 'planned',
      progress: e.progress || 0,
      rating: e.score > 0 ? e.score : null,
    }));
    imported += await saveBatch(userId, items);
    onProgress?.(imported, total);
  }
  return { imported, total };
}

/**
 * Importa a partir de um export XML do MyAnimeList. Anime e mangá são
 * resolvidos em lotes SEPARADOS contra a AniList (idMal_in + type) —
 * misturar os dois arriscaria colidir um id de anime com um id de
 * mangá que por acaso é o mesmo número (MAL numera cada tipo à parte).
 */
export async function importFromMalXml(userId, xmlText, onProgress) {
  const parsed = parseMalXml(xmlText);
  const total = parsed.length;
  if (total === 0) return { imported: 0, total: 0 };

  let imported = 0;
  let done = 0;
  for (const type of ['anime', 'manga']) {
    for (const batch of chunk(parsed.filter(e => e.type === type), 40)) {
      const result = await queryAniList(
        MAL_ID_LOOKUP,
        { malIds: batch.map(e => e.malId), type: type.toUpperCase() },
        { cache: false },
      );
      const byMalId = new Map((result.Page.media || []).map(m => [m.idMal, m]));

      const items = [];
      for (const e of batch) {
        const m = byMalId.get(e.malId);
        done++;
        if (!m) continue; // não encontrado na AniList — segue sem travar o resto do lote
        items.push({
          type, externalId: m.id, title: m.title.english || m.title.romaji, coverUrl: m.coverImage?.large,
          metadata: m, status: e.status, progress: e.progress, rating: e.score > 0 ? e.score : null,
        });
      }
      if (items.length > 0) imported += await saveBatch(userId, items);
      onProgress?.(done, total);
    }
  }
  return { imported, total };
}
