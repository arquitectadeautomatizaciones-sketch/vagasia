CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  qualidade SMALLINT CHECK (qualidade >= 1 AND qualidade <= 5),
  tempo_espera SMALLINT CHECK (tempo_espera >= 1 AND tempo_espera <= 5),
  simpatia SMALLINT CHECK (simpatia >= 1 AND simpatia <= 5),
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
