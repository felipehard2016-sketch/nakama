-- ═══════════════════════════════════════════════════════════════
-- Nakama — Migrations pendentes
-- Execute no Supabase: Dashboard → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Coluna rewatch_count em user_media_list ───────────────
ALTER TABLE public.user_media_list
  ADD COLUMN IF NOT EXISTS rewatch_count INT NOT NULL DEFAULT 0;

-- ─── 2. Tabela episode_progress ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.episode_progress (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id       INT         NOT NULL,
  episode_number INT         NOT NULL,
  watched_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id, episode_number)
);

ALTER TABLE public.episode_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "episode_progress_own"
  ON public.episode_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS episode_progress_user_media
  ON public.episode_progress (user_id, media_id);

-- ─── 3. Tabela user_profiles ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "profiles_select_all"
  ON public.user_profiles FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "profiles_update_own"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "profiles_insert_own"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger: cria perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 4. Tabela anime_reviews ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.anime_reviews (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id    INT         NOT NULL,
  title       TEXT,
  body        TEXT        NOT NULL,
  score       NUMERIC(4,1),
  is_spoiler  BOOLEAN     NOT NULL DEFAULT false,
  upvotes     INT         NOT NULL DEFAULT 0,
  downvotes   INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);

ALTER TABLE public.anime_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "reviews_select_all"
  ON public.anime_reviews FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "reviews_insert_own"
  ON public.anime_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "reviews_update_own"
  ON public.anime_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "reviews_delete_own"
  ON public.anime_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS anime_reviews_media_id
  ON public.anime_reviews (media_id);

-- ─── 5. Tabela review_votes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_votes (
  review_id  BIGINT  NOT NULL REFERENCES public.anime_reviews(id) ON DELETE CASCADE,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  PRIMARY KEY (review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "votes_select_all"
  ON public.review_votes FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "votes_upsert_own"
  ON public.review_votes FOR ALL USING (auth.uid() = user_id);
