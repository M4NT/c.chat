-- Script para corrigir problemas de recursão infinita nas políticas RLS
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas existentes que estão causando recursão
DROP POLICY IF EXISTS "Usuários podem ver participantes de chats em que participam" ON "public"."chat_participants";
DROP POLICY IF EXISTS "Usuários podem ver seus próprios chats" ON "public"."chats";
DROP POLICY IF EXISTS "Usuários podem ver mensagens de chats em que participam" ON "public"."messages";
DROP POLICY IF EXISTS "Usuários podem ver grupos de chats em que participam" ON "public"."groups";

-- 2. Criar novas políticas sem recursão

-- Política para usuários (todos podem ver todos os usuários)
CREATE POLICY "Todos podem ver usuários" 
ON "public"."users"
FOR SELECT 
TO authenticated
USING (true);

-- Política para chat_participants (base para outras políticas)
CREATE POLICY "Usuários podem ver seus próprios registros de participação" 
ON "public"."chat_participants"
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Política para chats
CREATE POLICY "Usuários podem ver chats em que são participantes" 
ON "public"."chats"
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política para mensagens
CREATE POLICY "Usuários podem ver mensagens de seus chats" 
ON "public"."messages"
FOR SELECT 
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Política para grupos
CREATE POLICY "Usuários podem ver grupos de seus chats" 
ON "public"."groups"
FOR SELECT 
TO authenticated
USING (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Políticas para inserção de dados

-- Permitir que usuários autenticados criem chats
CREATE POLICY "Usuários podem criar chats"
ON "public"."chats"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuários autenticados se adicionem como participantes
CREATE POLICY "Usuários podem adicionar participantes"
ON "public"."chat_participants"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuários autenticados enviem mensagens em chats que participam
CREATE POLICY "Usuários podem enviar mensagens em seus chats"
ON "public"."messages"
FOR INSERT
TO authenticated
WITH CHECK (
  chat_id IN (
    SELECT chat_id 
    FROM chat_participants 
    WHERE user_id = auth.uid() AND left_at IS NULL
  )
);

-- Permitir que usuários autenticados criem grupos
CREATE POLICY "Usuários podem criar grupos"
ON "public"."groups"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ATENÇÃO: Este script cria políticas muito permissivas e deve ser usado apenas para fins de desenvolvimento.
-- Para um ambiente de produção, você deve criar políticas mais restritivas. 