-- FASE 1 / PASO 1 — Crear tabla professionals
-- Ejecutar en Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS professionals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('owner', 'collaborator')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_professionals_business_id ON professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_user_id    ON professionals(user_id);
