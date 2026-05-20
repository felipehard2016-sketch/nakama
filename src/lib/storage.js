/* ─────────────────────────────────────────────────────────────
   storage.js — camada de persistência híbrida
   • localStorage é sempre a fonte primária (síncrono, rápido)
   • Supabase é secundário (assíncrono, sincronizado em background)

   Estrutura por chave `media_${id}`:
   { id, listStatus, favorited, progress, addedAt, updatedAt,
     title, coverImage, averageScore, episodes,
     chapters, format, genres, seasonYear, duration }
──────────────────────────────────────────────────────────── */
import { supabase } from './supabase';

/* ════════════════════════════════════════
   LOCAL STORAGE
════════════════════════════════════════ */
export function getMedia(id) {
  try { return JSON.parse(localStorage.getItem(`media_${id}`)) || null; }
  catch { return null; }
}

export function saveMedia(id, data) {
  const existing = getMedia(id) || {};
  const now = Date.now();
  const merged = {
    ...existing,
    ...data,
    addedAt:   existing.addedAt || now,
    updatedAt: now,
  };
  localStorage.setItem(`media_${id}`, JSON.stringify(merged));
  return merged;
}

export function getAllMedia() {
  const items = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith('media_')) continue;
    try {
      const val = JSON.parse(localStorage.getItem(key));
      if (val) items.push(val);
    } catch {}
  }
  return items;
}

export function getByListStatus(status) {
  return getAllMedia().filter(m => m.listStatus === status);
}

export function getFavorites() {
  return getAllMedia().filter(m => m.favorited === true);
}

export function clearMedia(id) {
  localStorage.removeItem(`media_${id}`);
}

/* Retorna contagem de itens adicionados por mês nos últimos N meses */
export function getMonthlyActivity(months = 6) {
  const all = getAllMedia().filter(m => m.listStatus);
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const count = all.filter(m => {
      if (!m.addedAt) return i === months - 1;
      const added = new Date(m.addedAt);
      return added.getFullYear() === d.getFullYear() && added.getMonth() === d.getMonth();
    }).length;
    return { label, count, month: d.getMonth(), year: d.getFullYear() };
  });
}

/* ════════════════════════════════════════
   STREAK TRACKING
════════════════════════════════════════ */
const STREAK_KEY = 'nakama_streak';

/** Chama quando o usuário registra qualquer atividade (salvar/atualizar mídia) */
export function updateStreak() {
  const today     = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr      = yesterday.toDateString();

  const raw     = localStorage.getItem(STREAK_KEY);
  const streak  = raw ? JSON.parse(raw) : { lastDate: null, count: 0, longest: 0 };

  if (streak.lastDate === today) return streak; // já contou hoje

  const newCount = streak.lastDate === yStr ? streak.count + 1 : 1;
  const updated  = {
    lastDate: today,
    count:    newCount,
    longest:  Math.max(streak.longest || 0, newCount),
  };
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return updated;
}

/** Lê a streak atual (zera se não houve atividade hoje ou ontem) */
export function getStreak() {
  const raw = localStorage.getItem(STREAK_KEY);
  if (!raw) return { count: 0, longest: 0, active: false, lastDate: null };
  const streak    = JSON.parse(raw);
  const today     = new Date().toDateString();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const isActive  = streak.lastDate === today || streak.lastDate === yesterday.toDateString();
  return { ...streak, count: isActive ? streak.count : 0, active: streak.lastDate === today };
}

/* ════════════════════════════════════════
   SUPABASE SYNC
════════════════════════════════════════ */

/* Converte registro local → linha do Supabase */
function toRow(userId, item) {
  return {
    media_id:       item.id,
    user_id:        userId,
    list_status:    item.listStatus   || null,
    favorited:      item.favorited    || false,
    progress:       item.progress     || 0,
    user_score:     item.userScore    ?? null,
    rewatch_count:  item.rewatchCount || 0,
    added_at:       item.addedAt     ? new Date(item.addedAt).toISOString()   : new Date().toISOString(),
    updated_at:     item.updatedAt   ? new Date(item.updatedAt).toISOString() : new Date().toISOString(),
    title:          item.title        || null,
    cover_image:    item.coverImage   || null,
    average_score:  item.averageScore || null,
    episodes:       item.episodes     || null,
    chapters:       item.chapters     || null,
    format:         item.format       || null,
    genres:         item.genres       || null,
    season_year:    item.seasonYear   || null,
    duration:       item.duration     || null,
    status:         item.status       || null,
  };
}

/* Converte linha do Supabase → formato local */
function fromRow(row) {
  return {
    id:            row.media_id,
    listStatus:    row.list_status,
    favorited:     row.favorited,
    progress:      row.progress,
    userScore:     row.user_score    ?? null,
    rewatchCount:  row.rewatch_count || 0,
    addedAt:       row.added_at   ? new Date(row.added_at).getTime()   : null,
    updatedAt:     row.updated_at ? new Date(row.updated_at).getTime() : null,
    title:         row.title,
    coverImage:    row.cover_image,
    averageScore:  row.average_score,
    episodes:      row.episodes,
    chapters:      row.chapters,
    format:        row.format,
    genres:        row.genres,
    seasonYear:    row.season_year,
    duration:      row.duration,
    status:        row.status,
  };
}

/* Upload do localStorage → Supabase (após login) */
export async function migrateLocalToSupabase(userId) {
  const all = getAllMedia().filter(m => m.listStatus || m.favorited);
  if (!all.length) return;

  const rows = all.map(item => toRow(userId, item));
  const { error } = await supabase
    .from('user_media_list')
    .upsert(rows, { onConflict: 'user_id,media_id' });

  if (error) console.error('[Nakama] Migração falhou:', error.message);
  else console.log(`[Nakama] ${rows.length} itens migrados para o Supabase.`);
}

/* Download do Supabase → localStorage (preenche dados do usuário) */
export async function loadFromSupabase(userId) {
  const { data, error } = await supabase
    .from('user_media_list')
    .select('*')
    .eq('user_id', userId);

  if (error) { console.error('[Nakama] Erro ao carregar Supabase:', error.message); return; }
  if (!data?.length) return;

  data.forEach(row => {
    const local = getMedia(row.media_id);
    const remote = fromRow(row);
    /* Usa o mais recente entre local e remoto */
    const localTs  = local?.updatedAt  || 0;
    const remoteTs = remote.updatedAt  || 0;
    if (remoteTs >= localTs) {
      localStorage.setItem(`media_${row.media_id}`, JSON.stringify({
        ...(local || {}),
        ...remote,
      }));
    }
  });

  console.log(`[Nakama] ${data.length} itens carregados do Supabase.`);
}

/* Salva um item no Supabase em background (não bloqueia UI) */
export function syncItemToSupabase(userId, item) {
  if (!userId) return;
  supabase
    .from('user_media_list')
    .upsert(toRow(userId, item), { onConflict: 'user_id,media_id' })
    .then(({ error }) => {
      if (error) console.warn('[Nakama] Sync falhou:', error.message);
    });
}
