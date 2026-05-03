-- Script para darle rol de administradora a Diana en VagasIA.
--
-- INSTRUCCIONES:
--   1. Abre el SQL Editor en el dashboard de Supabase.
--   2. Reemplaza 'diana@ejemplo.com' con el email real de Diana.
--   3. Ejecuta el script.
--   4. Diana debe cerrar sesión y volver a entrar para que el cambio surta efecto.
--
-- El operador || en jsonb hace un merge: agrega "is_admin": true sin borrar
-- los otros campos (business_id, onboarding_completed, etc.).

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'diana@ejemplo.com';

-- Verifica que quedó aplicado:
SELECT id, email, raw_app_meta_data
FROM auth.users
WHERE email = 'diana@ejemplo.com';
