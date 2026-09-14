import { supabase } from './supabase';

/*
 * Calculadora/simulador de builds (passo 9) — escopo reduzido: um
 * "caderno de builds" (nome, lista de skills/passivas em texto livre,
 * notas), sem árvore de passivas visual/interativa de verdade. Os
 * dados de árvore de cada jogo (PoE2, Diablo 4, Last Epoch, Warframe,
 * Genshin) não vêm de nenhuma API oficial — precisam ser modelados/
 * importados por jogo, o que fica pra uma iteração dedicada.
 */

export const BUILD_GAMES = [
  { value: 'poe2',       label: 'Path of Exile 2' },
  { value: 'diablo4',    label: 'Diablo 4' },
  { value: 'last_epoch', label: 'Last Epoch' },
  { value: 'warframe',   label: 'Warframe' },
  { value: 'genshin',    label: 'Genshin Impact' },
];

export async function getUserBuilds(userId) {
  return supabase.from('game_builds').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export async function addBuild(userId, { game, buildName, skills, notes }) {
  return supabase
    .from('game_builds')
    .insert({ user_id: userId, game, build_name: buildName, skill_tree: { skills: skills || [] }, notes: notes || null })
    .select()
    .single();
}

export async function deleteBuild(id) {
  return supabase.from('game_builds').delete().eq('id', id);
}
