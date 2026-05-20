-- ══════════════════════════════════════════════════════════
-- NAKAMA — Migração: adicionar user_score e rewatch_count
-- Execute no SQL Editor: https://supabase.com
-- ══════════════════════════════════════════════════════════

-- Adiciona colunas se ainda não existirem
ALTER TABLE user_media_list
  ADD COLUMN IF NOT EXISTS user_score    NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS rewatch_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status        TEXT;

-- Índice para buscar por nota
CREATE INDEX IF NOT EXISTS idx_user_media_score
  ON user_media_list (user_id, user_score)
  WHERE user_score IS NOT NULL;
