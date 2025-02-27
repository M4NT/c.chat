-- Script para corrigir o problema de recursão infinita nas políticas RLS
-- Execute este script no SQL Editor do Supabase

-- Remover todas as políticas existentes para chat_participants
DROP POLICY IF EXISTS ON chat_participants;

-- Criar uma política simplificada para chat_participants
CREATE POLICY "Permitir acesso a chat_participants"
  ON chat_participants FOR SELECT
  USING (true);

-- Criar política para inserção em chat_participants
CREATE POLICY "Permitir inserção em chat_participants"
  ON chat_participants FOR INSERT
  WITH CHECK (true);

-- Criar política para atualização em chat_participants
CREATE POLICY "Permitir atualização em chat_participants"
  ON chat_participants FOR UPDATE
  USING (true);

-- Criar política para exclusão em chat_participants
CREATE POLICY "Permitir exclusão em chat_participants"
  ON chat_participants FOR DELETE
  USING (true);

-- Remover políticas problemáticas de outras tabelas que dependem de chat_participants
DROP POLICY IF EXISTS ON messages;
DROP POLICY IF EXISTS ON groups;
DROP POLICY IF EXISTS ON chats;

-- Criar políticas simplificadas para chats
CREATE POLICY "Permitir acesso a chats"
  ON chats FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção em chats"
  ON chats FOR INSERT
  WITH CHECK (true);

-- Criar políticas simplificadas para messages
CREATE POLICY "Permitir acesso a messages"
  ON messages FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção em messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Criar políticas simplificadas para groups
CREATE POLICY "Permitir acesso a groups"
  ON groups FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção em groups"
  ON groups FOR INSERT
  WITH CHECK (true);

-- ATENÇÃO: Este script cria políticas muito permissivas e deve ser usado apenas para fins de desenvolvimento.
-- Para um ambiente de produção, você deve criar políticas mais restritivas. 