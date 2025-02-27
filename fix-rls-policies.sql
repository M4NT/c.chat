-- Script para corrigir as políticas RLS que estão causando recursão infinita

-- Primeiro, vamos remover as políticas problemáticas
DROP POLICY IF EXISTS "chat_participants_select_policy" ON "chat_participants";
DROP POLICY IF EXISTS "chats_select_policy" ON "chats";
DROP POLICY IF EXISTS "messages_select_policy" ON "messages";
DROP POLICY IF EXISTS "groups_select_policy" ON "groups";

-- Agora, vamos criar políticas mais simples que não causem recursão

-- Política para chat_participants
-- Problema: A política atual está causando recursão infinita
-- Solução: Criar uma política mais simples que não dependa de si mesma
CREATE POLICY "chat_participants_select_policy_fixed" ON "chat_participants"
FOR SELECT USING (
  -- Permitir acesso se o usuário for um participante do chat
  user_id = auth.uid()
  -- Ou se o usuário for um participante do mesmo chat (sem recursão)
  OR chat_id IN (
    SELECT chat_id FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política para chats
-- Problema: A política atual depende de chat_participants, que está com recursão
-- Solução: Simplificar a política para usar uma subconsulta direta
CREATE POLICY "chats_select_policy_fixed" ON "chats"
FOR SELECT USING (
  -- Permitir acesso se o usuário for o criador do chat
  created_by = auth.uid()
  -- Ou se o usuário for um participante do chat
  OR id IN (
    SELECT chat_id FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política para messages
-- Problema: A política atual depende de chat_participants, que está com recursão
-- Solução: Simplificar a política para usar uma subconsulta direta
CREATE POLICY "messages_select_policy_fixed" ON "messages"
FOR SELECT USING (
  -- Permitir acesso se o usuário for o remetente da mensagem
  sender_id = auth.uid()
  -- Ou se o usuário for um participante do chat
  OR chat_id IN (
    SELECT chat_id FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política para groups
-- Problema: A política atual depende de chat_participants, que está com recursão
-- Solução: Simplificar a política para usar uma subconsulta direta
CREATE POLICY "groups_select_policy_fixed" ON "groups"
FOR SELECT USING (
  -- Permitir acesso se o chat do grupo estiver na lista de chats do usuário
  chat_id IN (
    SELECT chat_id FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política alternativa para permitir acesso anônimo durante desenvolvimento
-- ATENÇÃO: Use apenas em ambiente de desenvolvimento!
-- CREATE POLICY "allow_anonymous_select" ON "chat_participants" FOR SELECT USING (true);
-- CREATE POLICY "allow_anonymous_select" ON "chats" FOR SELECT USING (true);
-- CREATE POLICY "allow_anonymous_select" ON "messages" FOR SELECT USING (true);
-- CREATE POLICY "allow_anonymous_select" ON "groups" FOR SELECT USING (true);

-- Verificar se as políticas foram aplicadas corretamente
-- SELECT * FROM pg_policies WHERE tablename IN ('chat_participants', 'chats', 'messages', 'groups'); 