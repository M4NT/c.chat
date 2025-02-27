
-- Script para corrigir problemas de RLS no Supabase
-- Execute este script no SQL Editor do Supabase

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS ON users;
DROP POLICY IF EXISTS ON chats;
DROP POLICY IF EXISTS ON chat_participants;
DROP POLICY IF EXISTS ON messages;
DROP POLICY IF EXISTS ON groups;

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para users
CREATE POLICY "Usuários podem ver todos os usuários"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Criar políticas básicas para chats
CREATE POLICY "Usuários podem ver chats dos quais participam"
  ON chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar chats"
  ON chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Criar políticas básicas para chat_participants
CREATE POLICY "Usuários podem ver participantes de chats dos quais participam"
  ON chat_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_participants AS cp
      WHERE cp.chat_id = chat_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem adicionar participantes a chats que criaram"
  ON chat_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND chats.created_by = auth.uid()
    )
  );

-- Criar políticas básicas para messages
CREATE POLICY "Usuários podem ver mensagens de chats dos quais participam"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem enviar mensagens em chats dos quais participam"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

-- Criar políticas básicas para groups
CREATE POLICY "Usuários podem ver grupos dos quais participam"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.chat_id = chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar grupos"
  ON groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = chat_id
      AND chats.created_by = auth.uid()
    )
  );
  