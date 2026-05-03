-- Agrega la columna is_active a la tabla businesses.
-- Todos los negocios existentes quedan activos por defecto.
-- Ejecutar una sola vez en el SQL Editor de Supabase.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
