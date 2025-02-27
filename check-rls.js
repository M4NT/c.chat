// Script para verificar as políticas RLS no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Obter a URL do Supabase e a chave anônima do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave anônima do Supabase:', supabaseAnonKey.substring(0, 10) + '...');

// Inicializar o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para verificar se o usuário está autenticado
async function checkAuth() {
  console.log('=== Verificando autenticação ===');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error.message);
      return null;
    }
    
    if (!session) {
      console.log('Nenhuma sessão encontrada. O usuário não está autenticado.');
      return null;
    }
    
    console.log('Usuário autenticado:');
    console.log('- ID:', session.user.id);
    console.log('- Email:', session.user.email);
    
    return session.user.id;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error.message);
    return null;
  }
}

// Função para testar acesso às tabelas
async function testTableAccess(userId) {
  console.log('\n=== Testando acesso às tabelas ===');
  
  const tables = [
    { name: 'users', query: () => supabase.from('users').select('id, name, email').limit(5) },
    { name: 'chats', query: () => supabase.from('chats').select('id, type, created_at').limit(5) },
    { name: 'chat_participants', query: () => supabase.from('chat_participants').select('chat_id, user_id, role').limit(5) },
    { name: 'messages', query: () => supabase.from('messages').select('id, chat_id, sender_id, content').limit(5) },
    { name: 'groups', query: () => supabase.from('groups').select('id, chat_id, name').limit(5) }
  ];
  
  for (const table of tables) {
    console.log(`\nTestando acesso à tabela ${table.name}...`);
    
    try {
      const { data, error } = await table.query();
      
      if (error) {
        console.error(`Erro ao acessar tabela ${table.name}:`, error.message);
        
        // Verificar se é um erro de RLS
        if (error.message.includes('permission denied') || 
            error.message.includes('new row violates') || 
            error.message.includes('policy') ||
            error.message.includes('recursion')) {
          console.log('Este parece ser um erro relacionado a políticas RLS.');
          console.log('Recomendação: Verifique as políticas RLS para esta tabela no painel do Supabase.');
        }
      } else {
        console.log(`Acesso bem-sucedido à tabela ${table.name}.`);
        console.log(`Registros encontrados: ${data ? data.length : 0}`);
        
        if (data && data.length > 0) {
          console.log('Exemplo de registro:');
          console.log(data[0]);
        }
      }
    } catch (error) {
      console.error(`Erro ao testar acesso à tabela ${table.name}:`, error.message);
    }
  }
}

// Função para testar inserção de dados
async function testInsert(userId) {
  console.log('\n=== Testando inserção de dados ===');
  
  if (!userId) {
    console.log('Usuário não autenticado. Pulando testes de inserção.');
    return;
  }
  
  // Testar inserção em users (não deve ser necessário, mas é um bom teste)
  console.log('\nTestando inserção em users...');
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: 'test-' + Date.now(),
        name: 'Usuário de Teste',
        email: `teste-${Date.now()}@exemplo.com`,
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .select();
    
    if (error) {
      console.error('Erro ao inserir em users:', error.message);
      
      if (error.message.includes('permission denied') || 
          error.message.includes('new row violates') || 
          error.message.includes('policy')) {
        console.log('Este parece ser um erro relacionado a políticas RLS.');
      }
    } else {
      console.log('Inserção bem-sucedida em users.');
    }
  } catch (error) {
    console.error('Erro ao testar inserção em users:', error.message);
  }
  
  // Testar inserção em chats
  console.log('\nTestando inserção em chats...');
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        type: 'direct',
        created_by: userId
      })
      .select();
    
    if (error) {
      console.error('Erro ao inserir em chats:', error.message);
      
      if (error.message.includes('permission denied') || 
          error.message.includes('new row violates') || 
          error.message.includes('policy')) {
        console.log('Este parece ser um erro relacionado a políticas RLS.');
      }
    } else {
      console.log('Inserção bem-sucedida em chats.');
      
      // Se a inserção for bem-sucedida, limpar o registro de teste
      if (data && data.length > 0) {
        const chatId = data[0].id;
        console.log(`Chat de teste criado com ID: ${chatId}. Removendo...`);
        
        const { error: deleteError } = await supabase
          .from('chats')
          .delete()
          .eq('id', chatId);
        
        if (deleteError) {
          console.error('Erro ao remover chat de teste:', deleteError.message);
        } else {
          console.log('Chat de teste removido com sucesso.');
        }
      }
    }
  } catch (error) {
    console.error('Erro ao testar inserção em chats:', error.message);
  }
}

// Função para gerar script SQL para corrigir problemas de RLS
function generateFixScript() {
  console.log('\n=== Gerando script para corrigir problemas de RLS ===');
  
  const script = `
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
  `;
  
  console.log('Script SQL gerado. Para corrigir problemas de RLS:');
  console.log('1. Acesse o painel do Supabase');
  console.log('2. Vá para "SQL Editor"');
  console.log('3. Crie um novo script');
  console.log('4. Cole o script abaixo e execute-o:');
  console.log('\n' + script);
  
  // Salvar o script em um arquivo
  const fs = require('fs');
  fs.writeFileSync('fix-rls.sql', script, 'utf8');
  console.log('\nO script também foi salvo no arquivo fix-rls.sql');
}

// Função principal
async function main() {
  console.log('=== Verificação de Políticas RLS ===');
  
  const userId = await checkAuth();
  await testTableAccess(userId);
  await testInsert(userId);
  generateFixScript();
  
  console.log('\n=== Verificação concluída ===');
  console.log('Se você encontrou erros relacionados a políticas RLS, use o script gerado para corrigi-los.');
  console.log('Após aplicar as correções, reinicie o servidor de desenvolvimento e teste novamente.');
}

// Executar a função principal
main().catch(error => {
  console.error('Erro durante a verificação:', error);
  process.exit(1);
}); 