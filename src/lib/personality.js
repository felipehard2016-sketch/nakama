import { supabase } from './supabase';

/* ──────────────────────────────────────────────
   PERSONALIDADE DO PERSONAGEM (votos da comunidade)
────────────────────────────────────────────── */

/**
 * Retorna a contagem de votos agrupada por mbti+enneagram para um personagem.
 * Retorna { mbtiTally: {TYPE: count}, enneagramTally: {N: count}, myVote: {mbti, enneagram} | null }
 */
export async function getCharacterVotes(characterId, userId = null) {
  const { data, error } = await supabase
    .from('character_personality')
    .select('mbti, enneagram, user_id')
    .eq('character_id', characterId);

  if (error) {
    console.error('getCharacterVotes:', error);
    return { mbtiTally: {}, enneagramTally: {}, myVote: null };
  }

  const mbtiTally      = {};
  const enneagramTally = {};
  let   myVote         = null;

  for (const row of data ?? []) {
    if (row.mbti)       mbtiTally[row.mbti]           = (mbtiTally[row.mbti] || 0) + 1;
    if (row.enneagram)  enneagramTally[row.enneagram] = (enneagramTally[row.enneagram] || 0) + 1;
    if (userId && row.user_id === userId) myVote = { mbti: row.mbti, enneagram: row.enneagram };
  }

  return { mbtiTally, enneagramTally, myVote };
}

/**
 * Registra ou atualiza o voto de personalidade de um usuário para um personagem.
 */
export async function voteCharacterPersonality(characterId, userId, { mbti, enneagram }) {
  const { error } = await supabase
    .from('character_personality')
    .upsert(
      { character_id: characterId, user_id: userId, mbti, enneagram, voted_at: new Date().toISOString() },
      { onConflict: 'character_id,user_id' }
    );
  if (error) throw error;
}

/* ──────────────────────────────────────────────
   CATÁLOGO DE PERSONAGENS (dataset CSV)
────────────────────────────────────────────── */

/**
 * Busca no catálogo pelo nome do personagem e, opcionalmente, filtra pelo anime.
 *
 * @param {string}   characterName  - nome completo do personagem (ex: "Sasuke Uchiha")
 * @param {string[]} animeNames     - títulos do anime (romaji + english) para desambiguar
 * @returns {Promise<{anime_name,character_name,mbti,enneagram,genre}|null>}
 */
export async function lookupCharacterCatalog(characterName, animeNames = []) {
  if (!characterName) return null;

  // 1. Busca por nome do personagem (case-insensitive)
  const { data, error } = await supabase
    .from('character_catalog')
    .select('anime_name, character_name, mbti, enneagram, genre')
    .ilike('character_name', characterName)
    .limit(20);

  if (error) { console.error('lookupCharacterCatalog:', error); return null; }
  if (!data || data.length === 0) return null;

  // 2. Se encontrou apenas um resultado, retorna direto
  if (data.length === 1) return data[0];

  // 3. Tenta cruzar com os nomes de anime do personagem para desambiguar
  if (animeNames.length > 0) {
    const normalise = s => s?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
    const normAnimes = animeNames.map(normalise);

    const matched = data.find(row => {
      const rowAnime = normalise(row.anime_name);
      return normAnimes.some(a => rowAnime.includes(a) || a.includes(rowAnime));
    });

    if (matched) return matched;
  }

  // 4. Retorna o primeiro resultado (melhor esforço)
  return data[0];
}

/* ──────────────────────────────────────────────
   PERFIL DE PERSONALIDADE DO USUÁRIO
────────────────────────────────────────────── */

/**
 * Carrega o perfil de personalidade do usuário do Supabase.
 */
export async function getUserPersonality(userId) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) { console.error('getUserPersonality:', error); return null; }
  return data;
}

/**
 * Salva (upsert) o perfil de personalidade do usuário.
 */
export async function saveUserPersonality(userId, profile) {
  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      { user_id: userId, ...profile, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}
