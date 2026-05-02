-- Add whatsapp_number column to businesses (the actual phone number, e.g. +351XXXXXXXXX)
-- Distinct from whatsapp_phone_number_id which is Meta's internal API identifier
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
