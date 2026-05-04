CREATE OR REPLACE FUNCTION get_birthday_clients(p_business_id uuid, p_month int, p_day int)
RETURNS TABLE (id uuid, name text, phone text, email text, data_nascimento date)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, phone, email, data_nascimento
  FROM clients
  WHERE business_id = p_business_id
    AND data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM data_nascimento) = p_month
    AND EXTRACT(DAY FROM data_nascimento) = p_day;
$$;
