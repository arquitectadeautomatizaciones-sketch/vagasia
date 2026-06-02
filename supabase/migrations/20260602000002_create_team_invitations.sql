-- FASE 1 / PASO 2 — Crear tabla team_invitations
-- Ejecutar en Supabase Dashboard SQL Editor
-- REQUIERE que professionals ya exista (paso 1)

CREATE TABLE IF NOT EXISTS team_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  token           UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_token          ON team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_business_id    ON team_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_professional_id ON team_invitations(professional_id);
