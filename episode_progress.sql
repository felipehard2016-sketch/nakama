-- ══════════════════════════════════════════════════════════
-- NAKAMA — Progresso de episódios individuais
-- Execute no SQL Editor: https://supabase.com
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS episode_progress (
  user_id        UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id       BIGINT  NOT NULL,
  episode_number INT     NOT NULL,
  watched_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id, episode_number)
);

-- Índice para buscar todos os episódios de uma mídia rapidamente
CREATE INDEX IF NOT EXISTS idx_episode_progress_media
  ON episode_progress (user_id, media_id);

ALTER TABLE episode_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprio progresso de episódios"
  ON episode_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
