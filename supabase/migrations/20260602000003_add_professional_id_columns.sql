-- FASE 1 / PASO 3 — Añadir professional_id (nullable) a las 5 tablas
-- Ejecutar en Supabase Dashboard SQL Editor
-- REQUIERE que professionals ya exista (paso 1)
-- Las columnas se añaden como NULLABLE — el backfill se hace por separado

ALTER TABLE available_slots
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

ALTER TABLE pending_responses
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

ALTER TABLE waiting_list
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

ALTER TABLE business_hours
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

-- Índices para las columnas más consultadas
CREATE INDEX IF NOT EXISTS idx_available_slots_professional_id ON available_slots(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id    ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_professional_id  ON business_hours(professional_id);
