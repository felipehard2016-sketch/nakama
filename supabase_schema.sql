-- ══════════════════════════════════════════════════════════
-- NAKAMA — Schema completo do Supabase
-- Execute no SQL Editor do painel: https://supabase.com
-- ══════════════════════════════════════════════════════════


-- ── 1. Tabela da lista de mídias ─────────────────────────
CREATE TABLE IF NOT EXISTS user_media_list (
  media_id      BIGINT        NOT NULL,
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_status   TEXT,
  favorited     BOOLEAN       DEFAULT false,
  progress      INT           DEFAULT 0,
  added_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW(),
  title         JSONB,
  cover_image   JSONB,
  average_score INT,
  episodes      INT,
  chapters      INT,
  format        TEXT,
  genres        TEXT[],
  season_year   INT,
  duration      INT,
  PRIMARY KEY (user_id, media_id)
);

ALTER TABLE user_media_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam própria lista"
  ON user_media_list FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 2. Storage — bucket "profiles" ───────────────────────
-- Execute também o passo manual abaixo no painel do Supabase:
--
--   Storage → New bucket
--   Name: profiles
--   Public bucket: ✅ SIM (marcar como público)
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--   Max upload size: 15 MB
--
-- Depois, adicione a policy de upload:

INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: usuário autenticado pode fazer upload na própria pasta
CREATE POLICY "Upload próprio perfil"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: qualquer um pode ler (bucket público)
CREATE POLICY "Leitura pública de perfis"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profiles');

-- Policy: usuário pode atualizar/deletar próprio arquivo
CREATE POLICY "Usuário gerencia próprio arquivo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── 3. Votos de personalidade de personagens ─────
CREATE TABLE IF NOT EXISTS character_personality (
  character_id  BIGINT      NOT NULL,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti          TEXT,
  enneagram     TEXT,
  voted_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (character_id, user_id)
);

ALTER TABLE character_personality ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ler os votos (para exibir a contagem)
CREATE POLICY "Leitura pública de votos"
  ON character_personality FOR SELECT
  TO public
  USING (true);

-- Usuário autenticado insere/atualiza apenas o próprio voto
CREATE POLICY "Usuário vota personagem"
  ON character_personality FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuário atualiza voto"
  ON character_personality FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ── 4. Perfil de personalidade do usuário ────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mbti        TEXT,
  enneagram   TEXT,
  zodiac      TEXT,
  fav_anime   TEXT,
  fav_manga   TEXT,
  bio         TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuário lê e escreve apenas o próprio perfil
CREATE POLICY "Usuário gerencia perfil de personalidade"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
