-- Script para corrigir o problema de recursão infinita nas políticas RLS
-- Este script remove as políticas problemáticas e cria novas políticas sem recursão

-- Primeiro, vamos remover todas as políticas existentes que estão causando recursão
DROP POLICY IF EXISTS "Usuários podem ver seus próprios chats" ON chats;
DROP POLICY IF EXISTS "Usuários podem ver chats em que são participantes" ON chats;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias participações" ON chat_participants;
DROP POLICY IF EXISTS "Usuários podem ver participações em seus chats" ON chat_participants;
DROP POLICY IF EXISTS "Usuários podem ver mensagens em seus chats" ON messages;
DROP POLICY IF EXISTS "Usuários podem ver mensagens em chats em que são participantes" ON messages;
DROP POLICY IF EXISTS "Usuários podem ver grupos de seus chats" ON groups;

-- Agora, vamos criar novas políticas sem recursão

-- Política para a tabela chat_participants
CREATE POLICY "Usuários podem ver suas próprias participações" 
ON chat_participants FOR SELECT 
TO authenticated 
USING (
  auth.uid() = user_id
);

-- Política para a tabela chats
CREATE POLICY "Usuários podem ver seus próprios chats" 
ON chats FOR SELECT 
TO authenticated 
USING (
  created_by = auth.uid() OR
  id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Política para a tabela messages
CREATE POLICY "Usuários podem ver mensagens em seus chats" 
ON messages FOR SELECT 
TO authenticated 
USING (
  sender_id = auth.uid() OR
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Política para a tabela groups
CREATE POLICY "Usuários podem ver grupos de seus chats" 
ON groups FOR SELECT 
TO authenticated 
USING (
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- Adicionar políticas para INSERT, UPDATE e DELETE

-- chat_participants
CREATE POLICY "Usuários podem adicionar participantes aos seus chats" 
ON chat_participants FOR INSERT 
TO authenticated 
WITH CHECK (
  chat_id IN (
    SELECT id FROM chats WHERE created_by = auth.uid()
  )
);

-- chats
CREATE POLICY "Usuários podem criar chats" 
ON chats FOR INSERT 
TO authenticated 
WITH CHECK (
  created_by = auth.uid()
);

-- messages
CREATE POLICY "Usuários podem enviar mensagens em chats em que são participantes" 
ON messages FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND
  chat_id IN (
    SELECT chat_id FROM chat_participants WHERE user_id = auth.uid()
  )
);

-- groups
CREATE POLICY "Usuários podem criar grupos para seus chats" 
ON groups FOR INSERT 
TO authenticated 
WITH CHECK (
  chat_id IN (
    SELECT id FROM chats WHERE created_by = auth.uid()
  )
);

-- Verificar se as políticas foram aplicadas corretamente
-- Execute o comando abaixo no SQL Editor do Supabase para verificar as políticas:
-- SELECT * FROM pg_policies WHERE tablename IN ('chats', 'chat_participants', 'messages', 'groups'); 