-- FASE 1 / PASO 5 — Aplicar NOT NULL
-- Ejecutar SOLO después de confirmar que las 5 verificaciones devuelven 0 nulls
-- El backfill (paso 4) debe estar completado antes de ejecutar esto

ALTER TABLE available_slots  ALTER COLUMN professional_id SET NOT NULL;
ALTER TABLE appointments      ALTER COLUMN professional_id SET NOT NULL;
ALTER TABLE business_hours    ALTER COLUMN professional_id SET NOT NULL;

-- NOTA: pending_responses y waiting_list quedan NULLABLE intencionalmente
-- (pueden recibir datos de bots externos sin professional_id conocido)
