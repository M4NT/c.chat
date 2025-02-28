-- Função para buscar todos os usuários
-- Esta função contorna as políticas RLS
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS SETOF "public"."users" AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM "public"."users"
  WHERE deleted_at IS NULL
  ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 