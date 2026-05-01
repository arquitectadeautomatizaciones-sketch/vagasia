-- Adiciona coluna auth_user_id à tabela businesses para ligação com Supabase Auth
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS businesses_auth_user_id_idx ON businesses (auth_user_id);
