-- Script para corrigir o problema de recursão infinita nas políticas RLS
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

-- Criar políticas simplificadas para todas as tabelas
-- Estas políticas são muito permissivas e devem ser usadas apenas para desenvolvimento

-- Políticas para users
CREATE POLICY "Acesso público para leitura de users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios dados"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para chats
CREATE POLICY "Acesso público para leitura de chats"
  ON chats FOR SELECT
  USING (true);

CREATE POLICY "Qualquer usuário pode criar chats"
  ON chats FOR INSERT
  WITH CHECK (true);

-- Políticas para chat_participants
CREATE POLICY "Acesso público para leitura de chat_participants"
  ON chat_participants FOR SELECT
  USING (true);

CREATE POLICY "Qualquer usuário pode adicionar participantes"
  ON chat_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Qualquer usuário pode atualizar participantes"
  ON chat_participants FOR UPDATE
  USING (true);

CREATE POLICY "Qualquer usuário pode remover participantes"
  ON chat_participants FOR DELETE
  USING (true);

-- Políticas para messages
CREATE POLICY "Acesso público para leitura de messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Qualquer usuário pode enviar mensagens"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Políticas para groups
CREATE POLICY "Acesso público para leitura de groups"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Qualquer usuário pode criar grupos"
  ON groups FOR INSERT
  WITH CHECK (true);

-- ATENÇÃO: Este script cria políticas muito permissivas e deve ser usado apenas para fins de desenvolvimento.
-- Para um ambiente de produção, você deve criar políticas mais restritivas. 