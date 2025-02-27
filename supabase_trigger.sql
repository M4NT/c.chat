-- Habilitar RLS na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção de novos usuários
DROP POLICY IF EXISTS insert_users_policy ON public.users;
CREATE POLICY insert_users_policy ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Criar política para permitir que usuários vejam seus próprios dados
DROP POLICY IF EXISTS select_own_user_policy ON public.users;
CREATE POLICY select_own_user_policy ON public.users
    FOR SELECT 
    USING (auth.uid() = id);

-- Criar política para permitir que usuários atualizem seus próprios dados
DROP POLICY IF EXISTS update_own_user_policy ON public.users;
CREATE POLICY update_own_user_policy ON public.users
    FOR UPDATE 
    USING (auth.uid() = id);

-- Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    password_hash,
    status, 
    last_seen
  )
  VALUES (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'name', 'Usuário'),
    'MANAGED_BY_SUPABASE_AUTH',
    coalesce(new.raw_user_meta_data->>'status', 'online'),
    coalesce(new.raw_user_meta_data->>'last_seen', now()::text)::timestamp
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 