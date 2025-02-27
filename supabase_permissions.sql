-- Verificar e corrigir permissões para todas as tabelas

-- Tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DROP POLICY IF EXISTS users_select_policy ON public.users;
CREATE POLICY users_select_policy ON public.users
    FOR SELECT 
    USING (true); -- Permitir que todos os usuários autenticados vejam todos os usuários

DROP POLICY IF EXISTS users_insert_policy ON public.users;
CREATE POLICY users_insert_policy ON public.users
    FOR INSERT 
    WITH CHECK (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

DROP POLICY IF EXISTS users_update_policy ON public.users;
CREATE POLICY users_update_policy ON public.users
    FOR UPDATE 
    USING (auth.uid() = id OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

-- Tabela chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- Políticas para chats
DROP POLICY IF EXISTS chats_select_policy ON public.chats;
CREATE POLICY chats_select_policy ON public.chats
    FOR SELECT 
    USING (
        id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS chats_insert_policy ON public.chats;
CREATE POLICY chats_insert_policy ON public.chats
    FOR INSERT 
    WITH CHECK (true); -- Permitir que todos os usuários autenticados criem chats

DROP POLICY IF EXISTS chats_update_policy ON public.chats;
CREATE POLICY chats_update_policy ON public.chats
    FOR UPDATE 
    USING (
        created_by = auth.uid() OR 
        auth.uid() IN (
            SELECT user_id FROM public.chat_participants 
            WHERE chat_id = id AND role = 'admin' AND left_at IS NULL
        )
    );

-- Tabela chat_participants
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_participants
DROP POLICY IF EXISTS chat_participants_select_policy ON public.chat_participants;
CREATE POLICY chat_participants_select_policy ON public.chat_participants
    FOR SELECT 
    USING (
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS chat_participants_insert_policy ON public.chat_participants;
CREATE POLICY chat_participants_insert_policy ON public.chat_participants
    FOR INSERT 
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats WHERE created_by = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT user_id FROM public.chat_participants 
            WHERE chat_id = chat_id AND role = 'admin' AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS chat_participants_update_policy ON public.chat_participants;
CREATE POLICY chat_participants_update_policy ON public.chat_participants
    FOR UPDATE 
    USING (
        user_id = auth.uid() OR
        chat_id IN (
            SELECT id FROM public.chats WHERE created_by = auth.uid()
        ) OR
        auth.uid() IN (
            SELECT user_id FROM public.chat_participants 
            WHERE chat_id = chat_id AND role = 'admin' AND left_at IS NULL
        )
    );

-- Tabela messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas para messages
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
CREATE POLICY messages_select_policy ON public.messages
    FOR SELECT 
    USING (
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
CREATE POLICY messages_insert_policy ON public.messages
    FOR INSERT 
    WITH CHECK (
        sender_id = auth.uid() AND
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS messages_update_policy ON public.messages;
CREATE POLICY messages_update_policy ON public.messages
    FOR UPDATE 
    USING (
        sender_id = auth.uid() AND
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

-- Tabela groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Políticas para groups
DROP POLICY IF EXISTS groups_select_policy ON public.groups;
CREATE POLICY groups_select_policy ON public.groups
    FOR SELECT 
    USING (
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND left_at IS NULL
        )
    );

DROP POLICY IF EXISTS groups_insert_policy ON public.groups;
CREATE POLICY groups_insert_policy ON public.groups
    FOR INSERT 
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats WHERE created_by = auth.uid()
        )
    );

DROP POLICY IF EXISTS groups_update_policy ON public.groups;
CREATE POLICY groups_update_policy ON public.groups
    FOR UPDATE 
    USING (
        chat_id IN (
            SELECT id FROM public.chats WHERE created_by = auth.uid()
        ) OR
        chat_id IN (
            SELECT chat_id FROM public.chat_participants 
            WHERE user_id = auth.uid() AND role = 'admin' AND left_at IS NULL
        )
    );

-- Tabela files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Políticas para files
DROP POLICY IF EXISTS files_select_policy ON public.files;
CREATE POLICY files_select_policy ON public.files
    FOR SELECT 
    USING (
        message_id IN (
            SELECT id FROM public.messages 
            WHERE chat_id IN (
                SELECT chat_id FROM public.chat_participants 
                WHERE user_id = auth.uid() AND left_at IS NULL
            )
        )
    );

DROP POLICY IF EXISTS files_insert_policy ON public.files;
CREATE POLICY files_insert_policy ON public.files
    FOR INSERT 
    WITH CHECK (
        uploader_id = auth.uid()
    );

-- Conceder permissões para o serviço de armazenamento
GRANT ALL ON SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO postgres, anon, authenticated, service_role;

-- Conceder permissões para o serviço de autenticação
GRANT ALL ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, anon, authenticated, service_role;

-- Conceder permissões para o esquema público
GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role; 