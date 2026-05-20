-- ══════════════════════════════════════════════════════════
-- NAKAMA — Catálogo de personalidades de personagens
-- Execute no SQL Editor: https://supabase.com
-- Tabela separada da "character_personality" (que é de votos)
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS character_catalog (
  id             SERIAL       PRIMARY KEY,
  anime_name     TEXT         NOT NULL,
  character_name TEXT         NOT NULL,
  mbti           TEXT,
  enneagram      TEXT,
  genre          TEXT
);

-- Índices para lookup rápido por nome
CREATE INDEX IF NOT EXISTS idx_catalog_character_name
  ON character_catalog (lower(character_name));

CREATE INDEX IF NOT EXISTS idx_catalog_anime_name
  ON character_catalog (lower(anime_name));

-- RLS: leitura pública (dados não são sensíveis)
ALTER TABLE character_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pública do catálogo"
  ON character_catalog FOR SELECT
  TO public
  USING (true);
