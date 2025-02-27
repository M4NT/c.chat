-- Função para listar todas as políticas RLS no banco de dados
CREATE OR REPLACE FUNCTION public.get_policies()
RETURNS TABLE (
    table_name text,
    schema_name text,
    name text,
    action text,
    roles text[],
    cmd text,
    qual text,
    with_check text
) LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.relname::text AS table_name,
        n.nspname::text AS schema_name,
        p.polname::text AS name,
        CASE p.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            WHEN '*' THEN 'ALL'
        END AS action,
        ARRAY(
            SELECT rolname::text
            FROM pg_roles
            WHERE oid = ANY(p.polroles)
        ) AS roles,
        p.polcmd::text AS cmd,
        pg_get_expr(p.polqual, p.polrelid)::text AS qual,
        pg_get_expr(p.polwithcheck, p.polrelid)::text AS with_check
    FROM
        pg_policy p
    JOIN
        pg_class pc ON p.polrelid = pc.oid
    JOIN
        pg_namespace n ON pc.relnamespace = n.oid
    WHERE
        n.nspname = 'public'
    ORDER BY
        n.nspname, pc.relname, p.polname;
END;
$$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION public.get_policies() TO anon, authenticated, service_role;

-- Função para verificar se uma tabela existe
CREATE OR REPLACE FUNCTION public.table_exists(schema_name text, table_name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    exists_bool boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = schema_name
        AND table_name = table_name
    ) INTO exists_bool;
    
    RETURN exists_bool;
END;
$$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION public.table_exists(text, text) TO anon, authenticated, service_role;

-- Função para contar registros em uma tabela
CREATE OR REPLACE FUNCTION public.count_records(schema_name text, table_name text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    count_result integer;
    query text;
BEGIN
    IF NOT public.table_exists(schema_name, table_name) THEN
        RETURN 0;
    END IF;
    
    query := 'SELECT COUNT(*) FROM ' || schema_name || '.' || table_name;
    EXECUTE query INTO count_result;
    
    RETURN count_result;
END;
$$;

-- Conceder permissão para executar a função
GRANT EXECUTE ON FUNCTION public.count_records(text, text) TO anon, authenticated, service_role; 