-- ══════════════════════════════════════════════════════════════════
-- NAKAMA — Tabela de reviews (resenhas de anime/mangá)
-- Execute no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.anime_reviews (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id     INT         NOT NULL,
  title        TEXT,
  body         TEXT        NOT NULL,
  score        NUMERIC(3,1),           -- nota da review (1-10, meia estrela)
  is_spoiler   BOOLEAN     DEFAULT false,
  upvotes      INT         DEFAULT 0,
  downvotes    INT         DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Um usuário só pode escrever uma review por mídia
CREATE UNIQUE INDEX IF NOT EXISTS anime_reviews_user_media
  ON public.anime_reviews (user_id, media_id);

-- Index para buscar reviews de uma mídia rapidamente
CREATE INDEX IF NOT EXISTS anime_reviews_media_id
  ON public.anime_reviews (media_id, created_at DESC);

-- RLS
ALTER TABLE public.anime_reviews ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler reviews
CREATE POLICY "reviews_select"
  ON public.anime_reviews FOR SELECT
  USING (true);

-- Só o dono pode inserir/atualizar/deletar a própria review
CREATE POLICY "reviews_insert"
  ON public.anime_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update"
  ON public.anime_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete"
  ON public.anime_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ── Tabela de votos (upvote/downvote por usuário) ──
CREATE TABLE IF NOT EXISTS public.review_votes (
  review_id UUID NOT NULL REFERENCES public.anime_reviews(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote      SMALLINT NOT NULL CHECK (vote IN (-1, 1)),  -- 1=up, -1=down
  PRIMARY KEY (review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "votes_select" ON public.review_votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON public.review_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update" ON public.review_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON public.review_votes FOR DELETE USING (auth.uid() = user_id);

-- ── Função/trigger para updated_at automático ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS anime_reviews_updated_at ON public.anime_reviews;
CREATE TRIGGER anime_reviews_updated_at
  BEFORE UPDATE ON public.anime_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
