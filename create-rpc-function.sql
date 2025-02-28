-- Função para buscar todos os usuários exceto o usuário atual
-- Esta função contorna as políticas RLS
CREATE OR REPLACE FUNCTION get_all_users(current_user_id UUID)
RETURNS SETOF "public"."users" AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM "public"."users"
  WHERE id != current_user_id
  AND deleted_at IS NULL
  ORDER BY name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 