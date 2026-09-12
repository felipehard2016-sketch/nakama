-- ══════════════════════════════════════════════════════════════════
-- NAKAMA v2 — Schema completo (passo 3 do roadmap)
--
-- Como aplicar: Supabase Dashboard → SQL Editor → New query → cole
-- este arquivo inteiro → Run. É seguro rodar mais de uma vez
-- (CREATE ... IF NOT EXISTS / DROP POLICY IF EXISTS em tudo).
--
-- Esquema pensado para múltiplas mídias desde o início: media_items é
-- um catálogo único compartilhado por todos os usuários (anime, manga
-- e, na fase de jogos, game), e user_media_list guarda só a relação
-- usuário↔mídia — assim o módulo de jogos (passo 7) reaproveita as
-- mesmas tabelas em vez de duplicá-las.
-- ══════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────
-- 0. LEGADO v1 — não apaga nada, só abre espaço para a v2
--
-- A v1 já tinha uma tabela `user_media_list`, mas com um formato bem
-- diferente (dado de anime denormalizado direto na linha, sem
-- catálogo compartilhado). Ela é renomeada em vez de apagada: os
-- dados continuam no banco para você conferir/migrar manualmente
-- depois, se quiser. As demais tabelas da v1 (character_personality,
-- user_profiles, episode_progress, anime_reviews, review_votes) não
-- têm conflito de nome com a v2 — ficam como estão, sem uso pelo
-- código novo, até você decidir apagá-las.
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.user_media_list RENAME TO user_media_list_legacy_v1;


-- ────────────────────────────────────────────────────────────────
-- Função utilitária: mantém updated_at em dia em qualquer tabela
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────────
-- 1. profiles — um por usuário autenticado
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT        UNIQUE,
  avatar_url TEXT,
  level      INT         NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Cria o perfil (e a linha de streak) sozinho quando um usuário se cadastra.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
-- (o trigger em si é criado no fim do arquivo, depois que `streaks` existir)


-- ────────────────────────────────────────────────────────────────
-- 2. media_items — catálogo compartilhado (anime | manga | game)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.media_items (
  id          BIGSERIAL   PRIMARY KEY,
  type        TEXT        NOT NULL CHECK (type IN ('anime', 'manga', 'game')),
  external_id TEXT        NOT NULL,   -- id na AniList (anime/manga) ou RAWG/IGDB (game)
  title       TEXT        NOT NULL,
  cover_url   TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}'::jsonb,  -- cache do resto do payload da API de origem
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, external_id)
);

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "media_items_select_all" ON public.media_items;
CREATE POLICY "media_items_select_all" ON public.media_items
  FOR SELECT USING (true);

-- Qualquer usuário autenticado pode adicionar/atualizar itens do catálogo
-- (é o que acontece ao adicionar um anime novo à lista, por exemplo).
DROP POLICY IF EXISTS "media_items_insert_authenticated" ON public.media_items;
CREATE POLICY "media_items_insert_authenticated" ON public.media_items
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "media_items_update_authenticated" ON public.media_items;
CREATE POLICY "media_items_update_authenticated" ON public.media_items
  FOR UPDATE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS media_items_type_idx ON public.media_items (type);


-- ────────────────────────────────────────────────────────────────
-- 3. user_media_list — lista pessoal (usuário ↔ mídia)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_media_list (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id   BIGINT      NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'planned')),
  progress   INT         NOT NULL DEFAULT 0,
  rating     NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
  favorite   BOOLEAN     NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);
-- status: watching=Assistindo, completed=Completo, on_hold=Em Pausa,
--         dropped=Abandonado, planned=Planejado

ALTER TABLE public.user_media_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_media_list_own" ON public.user_media_list;
CREATE POLICY "user_media_list_own" ON public.user_media_list
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_media_list_user_status_idx ON public.user_media_list (user_id, status);

DROP TRIGGER IF EXISTS user_media_list_updated_at ON public.user_media_list;
CREATE TRIGGER user_media_list_updated_at
  BEFORE UPDATE ON public.user_media_list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────────
-- 4. achievements — catálogo das 27 conquistas (dado fixo, sem RLS de escrita)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT      NOT NULL,
  description TEXT,
  icon        TEXT,
  condition   JSONB     NOT NULL DEFAULT '{}'::jsonb  -- regra avaliada pelo código, ex.: {"type":"episodes_watched","threshold":100}
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_all" ON public.achievements;
CREATE POLICY "achievements_select_all" ON public.achievements
  FOR SELECT USING (true);
-- Sem policy de insert/update/delete: o catálogo de 27 badges é populado
-- via seed/SQL Editor pelo dono do projeto, não pelo app.


-- ────────────────────────────────────────────────────────────────
-- 5. user_achievements — badges desbloqueadas por usuário
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id BIGINT      NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_all" ON public.user_achievements;
CREATE POLICY "user_achievements_select_all" ON public.user_achievements
  FOR SELECT USING (true);  -- público para dar pra mostrar badges no perfil de qualquer um

DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
CREATE POLICY "user_achievements_insert_own" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_delete_own" ON public.user_achievements;
CREATE POLICY "user_achievements_delete_own" ON public.user_achievements
  FOR DELETE USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────────
-- 6. streaks — um por usuário
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id            UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak     INT  NOT NULL DEFAULT 0,
  longest_streak     INT  NOT NULL DEFAULT 0,
  last_activity_date DATE
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streaks_select_all" ON public.streaks;
CREATE POLICY "streaks_select_all" ON public.streaks
  FOR SELECT USING (true);  -- público, pra mostrar streak no perfil

DROP POLICY IF EXISTS "streaks_upsert_own" ON public.streaks;
CREATE POLICY "streaks_upsert_own" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "streaks_update_own" ON public.streaks;
CREATE POLICY "streaks_update_own" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- Agora que `streaks` existe, liga o trigger declarado no bloco de `profiles`.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────────
-- 7. characters — dataset de personagens com MBTI/eneagrama (~5.159)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.characters (
  id        BIGSERIAL PRIMARY KEY,
  name      TEXT      NOT NULL,
  media_id  BIGINT    REFERENCES public.media_items(id) ON DELETE SET NULL,
  mbti      TEXT,
  enneagram TEXT,
  image_url TEXT
);
-- media_id fica nullable de propósito: o dataset importado do CSV (v1)
-- só tem o nome do anime como texto solto, sem ligação com media_items.
-- A resolução nome→media_id entra junto do comparador de personagens (passo 6).

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "characters_select_all" ON public.characters;
CREATE POLICY "characters_select_all" ON public.characters
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS characters_media_id_idx ON public.characters (media_id);
CREATE INDEX IF NOT EXISTS characters_name_idx ON public.characters (lower(name));


-- ────────────────────────────────────────────────────────────────
-- 8. reviews — resenhas de usuários por mídia
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id   BIGINT      NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  rating     NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_all" ON public.reviews;
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
CREATE POLICY "reviews_update_own" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reviews_media_id_idx ON public.reviews (media_id);


-- ────────────────────────────────────────────────────────────────
-- 9. arc_notes — companion: timeline de arcos / notas de teoria
--    (privado do autor; spoiler é só uma flag de exibição no futuro)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.arc_notes (
  id         BIGSERIAL   PRIMARY KEY,
  media_id   BIGINT      NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  arc_name   TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  is_spoiler BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.arc_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arc_notes_own" ON public.arc_notes;
CREATE POLICY "arc_notes_own" ON public.arc_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS arc_notes_media_user_idx ON public.arc_notes (media_id, user_id);


-- ────────────────────────────────────────────────────────────────
-- 10. game_builds — calculadora/simulador de builds (fase futura)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_builds (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game       TEXT        NOT NULL CHECK (game IN ('poe2', 'diablo4', 'last_epoch', 'warframe', 'genshin')),
  build_name TEXT        NOT NULL,
  skill_tree JSONB       NOT NULL DEFAULT '{}'::jsonb,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_builds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_builds_select_all" ON public.game_builds;
CREATE POLICY "game_builds_select_all" ON public.game_builds
  FOR SELECT USING (true);  -- público, pra permitir compartilhar build por link

DROP POLICY IF EXISTS "game_builds_own_write" ON public.game_builds;
CREATE POLICY "game_builds_own_write" ON public.game_builds
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS game_builds_user_game_idx ON public.game_builds (user_id, game);
