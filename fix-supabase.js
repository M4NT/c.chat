// Script para verificar e tentar corrigir a conexão com o Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Função para verificar a conexão com o Supabase
async function checkSupabaseConnection() {
  console.log('\nVerificando conexão com o Supabase...');
  
  try {
    // Tentar fazer uma consulta simples
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Erro ao conectar com o Supabase:', error.message);
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o Supabase:', error.message);
    return false;
  }
}

// Função para verificar a autenticação
async function checkAuthentication() {
  console.log('\nVerificando autenticação...');
  
  try {
    // Verificar a sessão atual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erro ao verificar sessão:', sessionError.message);
      return false;
    }
    
    if (session) {
      console.log('Sessão ativa encontrada!');
      console.log('Usuário:', session.user.email);
      return true;
    } else {
      console.log('Nenhuma sessão ativa encontrada.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error.message);
    return false;
  }
}

// Função para tentar criar um novo projeto Supabase
async function suggestNewProject() {
  console.log('\nSugestões para resolver o problema:');
  console.log('1. O projeto Supabase atual parece estar inacessível (404).');
  console.log('2. Recomendamos criar um novo projeto no Supabase:');
  console.log('   a. Acesse https://supabase.com/dashboard');
  console.log('   b. Crie um novo projeto');
  console.log('   c. Copie a URL e a chave anônima do novo projeto');
  console.log('   d. Atualize o arquivo .env.local com as novas credenciais');
  console.log('   e. Execute o script SQL para criar as tabelas necessárias');
  
  // Verificar se o arquivo SQL existe
  const sqlFilePath = path.join(__dirname, 'supabase_schema.sql');
  if (fs.existsSync(sqlFilePath)) {
    console.log('\nArquivo SQL encontrado:', sqlFilePath);
    console.log('Execute este arquivo SQL no editor SQL do seu novo projeto Supabase.');
  } else {
    console.log('\nArquivo SQL não encontrado. Você precisará criar as tabelas manualmente.');
  }
  
  // Criar um arquivo .env.local.example com as instruções
  const envExamplePath = path.join(__dirname, '.env.local.example');
  const envExampleContent = `# Substitua com suas credenciais do Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima

# Instruções:
# 1. Crie um novo projeto no Supabase (https://supabase.com/dashboard)
# 2. Copie a URL e a chave anônima do seu projeto
# 3. Substitua os valores acima com suas credenciais
# 4. Renomeie este arquivo para .env.local
# 5. Execute o script SQL para criar as tabelas necessárias
`;

  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('\nArquivo .env.local.example criado com instruções.');
}

// Função para verificar as tabelas necessárias
async function checkRequiredTables() {
  console.log('\nVerificando tabelas necessárias...');
  
  const requiredTables = [
    'users',
    'chats',
    'chat_participants',
    'messages',
    'groups'
  ];
  
  const tableResults = {};
  
  for (const table of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`Tabela '${table}': Não encontrada ou erro (${error.message})`);
        tableResults[table] = false;
      } else {
        console.log(`Tabela '${table}': Encontrada`);
        tableResults[table] = true;
      }
    } catch (error) {
      console.log(`Tabela '${table}': Erro ao verificar (${error.message})`);
      tableResults[table] = false;
    }
  }
  
  return tableResults;
}

// Função principal
async function main() {
  console.log('Iniciando verificação do Supabase...');
  
  const isConnected = await checkSupabaseConnection();
  
  if (!isConnected) {
    console.log('\nNão foi possível conectar ao Supabase.');
    await suggestNewProject();
    return;
  }
  
  const isAuthenticated = await checkAuthentication();
  
  if (!isAuthenticated) {
    console.log('\nNão há sessão ativa. Tentando criar um usuário de teste...');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'teste@exemplo.com',
        password: 'senha123',
        options: {
          data: {
            name: 'Usuário Teste',
            status: 'online',
            last_seen: new Date().toISOString()
          }
        }
      });
      
      if (error) {
        console.error('Erro ao criar usuário de teste:', error.message);
      } else {
        console.log('Usuário de teste criado com sucesso!');
        console.log('Email: teste@exemplo.com');
        console.log('Senha: senha123');
      }
    } catch (error) {
      console.error('Erro ao criar usuário de teste:', error.message);
    }
  }
  
  const tableResults = await checkRequiredTables();
  
  const missingTables = Object.keys(tableResults).filter(table => !tableResults[table]);
  
  if (missingTables.length > 0) {
    console.log('\nAlgumas tabelas necessárias não foram encontradas:');
    missingTables.forEach(table => console.log(`- ${table}`));
    console.log('\nVocê precisa executar o script SQL para criar as tabelas.');
  } else {
    console.log('\nTodas as tabelas necessárias foram encontradas!');
  }
  
  console.log('\nVerificação concluída!');
}

// Executar a função principal
main().catch(error => {
  console.error('Erro durante a verificação:', error);
}); 