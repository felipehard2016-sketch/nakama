import { supabase } from './supabase';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayISO() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

/** Busca o streak do usuário (linha criada automaticamente no signup). */
export async function getStreak(userId) {
  const { data } = await supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle();
  return data;
}

/**
 * Registra atividade de hoje: mantém o streak se a última atividade foi
 * ontem, incrementa se ainda não contou hoje, reseta para 1 se quebrou.
 * Chamar sempre que o usuário mexer no progresso/status de algo na lista.
 */
export async function recordActivity(userId) {
  const today = todayISO();
  const row = await getStreak(userId);

  if (!row) {
    return supabase.from('streaks').upsert({
      user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today,
    });
  }

  if (row.last_activity_date === today) return null; // já contou hoje

  const current = row.last_activity_date === yesterdayISO() ? row.current_streak + 1 : 1;
  const longest = Math.max(current, row.longest_streak);

  return supabase
    .from('streaks')
    .update({ current_streak: current, longest_streak: longest, last_activity_date: today })
    .eq('user_id', userId);
}
