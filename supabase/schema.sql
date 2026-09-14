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
--
-- Isso só pode acontecer UMA vez (a segunda vez, "user_media_list" já
-- é a tabela v2 e "user_media_list_legacy_v1" já existe da primeira
-- vez) — por isso o guard: só renomeia se o backup ainda não existe.
-- Sem isso, rodar este arquivo pela segunda vez falha com "relation
-- user_media_list_legacy_v1 already exists".
-- ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_media_list')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_media_list_legacy_v1')
  THEN
    ALTER TABLE public.user_media_list RENAME TO user_media_list_legacy_v1;
  END IF;
END $$;


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

-- Perfil público (/u/[username]): username/level já são públicos desde
-- sempre (profiles_select_all acima), e achievements/streak também já
-- eram (ver seções 5 e 6) — só a lista pessoal em si (o que alguém está
-- assistindo, notas dadas) precisa de consentimento explícito, porque é
-- a parte que revela hábito/opinião de verdade. Por isso o default é
-- false: ninguém fica público sem escolher.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'public_list'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN public_list BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

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
  status     TEXT        NOT NULL CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'planned', 'platinum')),
  progress   INT         NOT NULL DEFAULT 0,
  rating     NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
  favorite   BOOLEAN     NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id)
);
-- status compartilhado entre mídias pra não duplicar coluna por tipo:
--   anime/manga: watching=Assistindo, completed=Completo, on_hold=Em Pausa,
--                dropped=Abandonado, planned=Planejado
--   game (passo 7): watching=Jogando, completed=Completo, dropped=Abandonado,
--                   planned=Planejado, platinum=Platinado (só usado por jogos)

-- Upgrade in-place: se a constraint já existia sem 'platinum' (rodou uma
-- versão anterior deste schema), recria com o valor novo. Não faz nada
-- numa instalação nova (a CREATE TABLE acima já nasce com 'platinum').
ALTER TABLE public.user_media_list DROP CONSTRAINT IF EXISTS user_media_list_status_check;
ALTER TABLE public.user_media_list ADD CONSTRAINT user_media_list_status_check
  CHECK (status IN ('watching', 'completed', 'on_hold', 'dropped', 'planned', 'platinum'));

ALTER TABLE public.user_media_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_media_list_own" ON public.user_media_list;
CREATE POLICY "user_media_list_own" ON public.user_media_list
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Política ADICIONAL de leitura (soma com a de cima, não substitui —
-- múltiplas políticas permissivas do mesmo comando em Postgres são
-- "ou" entre si): visitante consegue ler a lista de quem ativou
-- public_list, sem precisar de sessão nenhuma. O dono sempre continua
-- vendo a própria lista de qualquer forma, pela política acima.
DROP POLICY IF EXISTS "user_media_list_public_read" ON public.user_media_list;
CREATE POLICY "user_media_list_public_read" ON public.user_media_list
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_media_list.user_id AND p.public_list = true
    )
  );

CREATE INDEX IF NOT EXISTS user_media_list_user_status_idx ON public.user_media_list (user_id, status);

DROP TRIGGER IF EXISTS user_media_list_updated_at ON public.user_media_list;
CREATE TRIGGER user_media_list_updated_at
  BEFORE UPDATE ON public.user_media_list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────────
-- 4. achievements — catálogo das conquistas (dado fixo, sem RLS de escrita)
--
-- id é TEXT (slug, ex.: 'eps_500') em vez de serial: as regras de
-- desbloqueio vivem em código (src/lib/achievements.js, herdado da v1
-- quase pronto), então o slug usado lá é a própria chave primária aqui
-- — sem precisar de tabela de lookup slug→id.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT  PRIMARY KEY,
  name        TEXT  NOT NULL,
  description TEXT,
  icon        TEXT,
  points      INT   NOT NULL DEFAULT 0,
  category    TEXT
);

-- Upgrade in-place caso este projeto já tivesse rodado uma versão anterior
-- deste schema com achievements.id BIGSERIAL — converte pra TEXT sem
-- apagar nada. Não faz nada se a tabela já nasceu com o formato novo.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'achievements'
      AND column_name = 'id' AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.user_achievements DROP CONSTRAINT IF EXISTS user_achievements_achievement_id_fkey;
    ALTER TABLE public.achievements ALTER COLUMN id DROP DEFAULT;
    ALTER TABLE public.achievements ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.user_achievements ALTER COLUMN achievement_id TYPE TEXT USING achievement_id::text;
    ALTER TABLE public.user_achievements
      ADD CONSTRAINT user_achievements_achievement_id_fkey
      FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='achievements' AND column_name='points') THEN
    ALTER TABLE public.achievements ADD COLUMN points INT NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='achievements' AND column_name='category') THEN
    ALTER TABLE public.achievements ADD COLUMN category TEXT;
  END IF;
END $$;

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_all" ON public.achievements;
CREATE POLICY "achievements_select_all" ON public.achievements
  FOR SELECT USING (true);
-- Sem policy de insert/update/delete: o catálogo de 27 badges é populado
-- via seed abaixo, não pelo app.

-- Seed das 27 conquistas (mesmas definições de src/lib/achievements.js —
-- a regra de desbloqueio roda em código; esta tabela só guarda o catálogo
-- pra exibir e servir de FK pra user_achievements).
INSERT INTO public.achievements (id, name, description, icon, points, category) VALUES
  ('first_add',      'Primeira Adição',   'Adicionou seu primeiro anime ou mangá à lista.',  '🌱', 10,  'Coleção'),
  ('collector_10',   'Colecionador',      'Tenha 10 títulos na sua lista.',                  '📚', 20,  'Coleção'),
  ('collector_50',   'Arquivista',        'Tenha 50 títulos na sua lista.',                  '🗃️', 50,  'Coleção'),
  ('collector_100',  'Bibliotecário',     '100 títulos salvos. Uma biblioteca completa.',    '🏛️', 100, 'Coleção'),
  ('first_complete', 'Concluidor',        'Completou seu primeiro anime ou mangá.',          '✅', 15,  'Coleção'),
  ('complete_20',    'Dedicado',          '20 títulos completos.',                           '🎯', 40,  'Coleção'),
  ('complete_50',    'Veterano',          '50 títulos marcados como completos.',             '🏆', 80,  'Coleção'),
  ('favorites_5',    'Coração Cheio',     'Favoritou 5 títulos.',                            '❤️', 20,  'Coleção'),
  ('favorites_25',   'Apaixonado',        'Favoritou 25 títulos.',                           '💖', 50,  'Coleção'),
  ('eps_100',        'Espectador',        '100 episódios assistidos.',                       '📺', 25,  'Maratona'),
  ('eps_500',        'Maratonista',       '500 episódios no total.',                         '🔥', 60,  'Maratona'),
  ('eps_1000',       'Viciado',           '1.000 episódios assistidos.',                     '⚡', 100, 'Maratona'),
  ('eps_3000',       'Lendário',          '3.000 episódios. Nível lendário.',                '🌟', 200, 'Maratona'),
  ('chapters_200',   'Leitor',            '200 capítulos de mangá lidos.',                   '📖', 40,  'Maratona'),
  ('hours_24',       '24 Horas',          'Um dia inteiro de anime assistido.',              '⏰', 30,  'Maratona'),
  ('hours_240',      'Dez Dias',          '240 horas de anime. São 10 dias inteiros.',       '🕰️', 100, 'Maratona'),
  ('genres_5',       'Eclético',          'Completou animes de 5 gêneros diferentes.',       '🎭', 30,  'Variedade'),
  ('genres_10',      'Diversificado',     '10 gêneros diferentes na sua lista.',             '🌈', 60,  'Variedade'),
  ('has_manga',      'Além do Anime',     'Adicionou um mangá, novel ou webtoon.',           '📗', 20,  'Variedade'),
  ('has_movie',      'Cinéfilo',          'Assistiu pelo menos um filme de anime.',          '🎬', 15,  'Variedade'),
  ('manga_10',       'Mangaka Fan',       '10 mangás ou novels na lista.',                   '📚', 40,  'Variedade'),
  ('high_score',     'Crítico',           'Avaliou pelo menos 10 títulos.',                  '⭐', 25,  'Variedade'),
  ('all_statuses',   'Explorador',        'Usou todos os 5 status de lista.',                '🗺️', 35,  'Variedade'),
  ('streak_3',       '3 Dias Seguidos',   'Ativo no app por 3 dias consecutivos.',           '🔥', 20,  'Dedicação'),
  ('streak_7',       'Semana Perfeita',   '7 dias consecutivos de atividade.',               '🗓️', 50,  'Dedicação'),
  ('streak_30',      'Mês Dedicado',      '30 dias seguidos de atividade. Impressionante.',  '🏅', 150, 'Dedicação'),
  ('early_adopter',  'Nakama OG',         'Um dos primeiros usuários do Nakama.',            '🎌', 30,  'Dedicação')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  icon = EXCLUDED.icon, points = EXCLUDED.points, category = EXCLUDED.category;


-- ────────────────────────────────────────────────────────────────
-- 5. user_achievements — badges desbloqueadas por usuário
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id TEXT        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
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
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT      NOT NULL,
  media_id     BIGINT    REFERENCES public.media_items(id) ON DELETE SET NULL,
  mbti         TEXT,
  enneagram    TEXT,
  image_url    TEXT,
  source_title TEXT  -- nome da obra em texto solto (import_characters.js); preenche o card
);            -- do comparador enquanto media_id (ligação de verdade com media_items) não existe
-- media_id fica nullable de propósito: o dataset importado do CSV (v1)
-- só tem o nome do anime como texto solto, sem ligação com media_items.
-- A resolução nome→media_id fica pra quando o catálogo tiver mais cobertura.
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS source_title TEXT;

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


-- ────────────────────────────────────────────────────────────────
-- 11. notifications — sino in-app de novo episódio
--
-- v1 client-side: sem back-end rodando sozinho (Vercel/Supabase Cron),
-- então a checagem acontece quando alguém com sessão aberta usa o app
-- (ver src/hooks/useNotifications.js) — não é push de verdade com o
-- app fechado, é "avisar assim que alguém abrir o Nakama depois que o
-- episódio saiu". UNIQUE(user_id, media_id, episode) existe justamente
-- pra permitir usar upsert+ignoreDuplicates como "criar se não existe
-- ainda" sem duplicar aviso do mesmo episódio.
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         BIGSERIAL   PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id   BIGINT      NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  episode    INT         NOT NULL,
  message    TEXT        NOT NULL,
  read       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, media_id, episode)
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_own" ON public.notifications;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications (user_id, read);
