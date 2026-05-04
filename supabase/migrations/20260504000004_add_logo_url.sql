ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Criar bucket público para logos de negócios
-- (executar também no dashboard: Storage → New bucket → "business-logos" → Public: on)
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO NOTHING;
