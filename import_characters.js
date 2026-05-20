/**
 * NAKAMA — Importador de personagens para o Supabase
 *
 * Pré-requisitos:
 *   1. Execute o SQL de character_catalog.sql no Supabase SQL Editor
 *   2. node import_characters.js
 *
 * O script lê o CSV, converte para linhas limpas e insere em lotes de 200.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync }  from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/* ─── Credenciais ─────────────────────────────────────────── */
// Lê do .env sem precisar do pacote dotenv
const __dir    = dirname(fileURLToPath(import.meta.url));
const envPath  = join(__dir, '.env');
const envText  = readFileSync(envPath, 'utf-8');
const envVars  = Object.fromEntries(
  envText.split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SUPABASE_KEY = envVars['VITE_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ─── Leitura e parse do CSV ─────────────────────────────── */
const CSV_PATH = join(__dir, 'anime_character_personality.csv');
const raw      = readFileSync(CSV_PATH, 'utf-8');
const lines    = raw.split('\n').filter(Boolean);

// Cabeçalho: ,anime_name,anime_genre,character_name,character_mbti_type,character_enneagram_type
// (primeira coluna é índice numérico vazio — descartada)
const rows = [];
for (let i = 1; i < lines.length; i++) {        // pula header (linha 0)
  const parts = lines[i].split(',');
  if (parts.length < 6) continue;

  // parts[0] = índice numérico
  const anime_name     = parts[1]?.trim();
  const genre          = parts[2]?.trim();
  const character_name = parts[3]?.trim();
  const mbti_raw       = parts[4]?.trim();
  const enn_raw        = parts[5]?.trim();

  if (!character_name || !anime_name) continue;

  // 'XwX' é placeholder de "desconhecido" — salva como null
  const mbti      = mbti_raw && mbti_raw !== 'XwX' ? mbti_raw : null;
  const enneagram = enn_raw  && enn_raw  !== 'XwX' ? enn_raw  : null;

  rows.push({ anime_name, character_name, mbti, enneagram, genre });
}

console.log(`\n📂  CSV lido: ${rows.length} personagens encontrados`);

/* ─── Inserção em lotes ──────────────────────────────────── */
const BATCH = 200;
let   inserted = 0;
let   errors   = 0;

for (let start = 0; start < rows.length; start += BATCH) {
  const batch = rows.slice(start, start + BATCH);

  const { error } = await supabase
    .from('character_catalog')
    .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    console.error(`❌  Lote ${start}–${start + batch.length}: ${error.message}`);
    errors += batch.length;
  } else {
    inserted += batch.length;
    const pct = Math.round((inserted / rows.length) * 100);
    process.stdout.write(`\r⏳  ${inserted}/${rows.length} (${pct}%) inseridos...`);
  }
}

console.log(`\n\n✅  Importação concluída!`);
console.log(`   Inseridos : ${inserted}`);
if (errors) console.log(`   Com erro  : ${errors}`);
console.log('');
