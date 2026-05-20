-- ══════════════════════════════════════════════════════════════════
-- NAKAMA — Trigger: criar user_profiles automaticamente
-- Execute INTEIRO no SQL Editor do Supabase
-- ══════════════════════════════════════════════════════════════════

-- 1. Função que roda quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER          -- roda com privilégios de owner, não do usuário
SET search_path = public  -- evita injeção via search_path
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    bio,
    updated_at
  )
  VALUES (
    NEW.id,
    NULL,
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;   -- idempotente: não falha se já existe

  RETURN NEW;
END;
$$;

-- 2. Liga a função ao evento de criação de usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO (opcional — rode depois para confirmar que funcionou)
-- ══════════════════════════════════════════════════════════════════
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
