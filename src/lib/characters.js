import { supabase } from './supabase';

export async function searchCharacters(term) {
  const q = term?.trim();
  if (!q) return [];
  const { data } = await supabase
    .from('characters')
    .select('id, name, mbti, enneagram, image_url, source_title')
    .ilike('name', `%${q}%`)
    .limit(8);
  return data || [];
}
