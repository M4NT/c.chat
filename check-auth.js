// Script para verificar a autenticação e o estado do banco de dados no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Inicializa o cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave anônima do Supabase:', supabaseAnonKey.substring(0, 10) + '...');

// Criar cliente Supabase com opções de depuração
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('Verificando conexão com o Supabase...');
  
  try {
    // Verificar se podemos nos conectar ao Supabase usando um método mais simples
    console.log('Tentando acessar a tabela users...');
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Erro ao conectar ao Supabase:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      
      // Tentar uma consulta mais simples
      console.log('\nTentando uma consulta mais simples...');
      try {
        const { error: simpleError } = await supabase.from('users').select('*').limit(1);
        if (simpleError) {
          console.error('Erro na consulta simples:', simpleError);
          console.error('Detalhes do erro:', JSON.stringify(simpleError, null, 2));
        }
      } catch (e) {
        console.error('Erro ao executar consulta simples:', e);
      }
      
      return false;
    }
    
    console.log('Conexão com o Supabase estabelecida com sucesso');
    console.log('Resultado da consulta:', data);
    
    // Verificar tabelas existentes
    console.log('\nVerificando tabelas existentes...');
    
    const tables = [
      'users',
      'chats',
      'groups',
      'chat_participants',
      'messages',
      'files',
      'reactions'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          console.error(`Erro ao verificar tabela ${table}:`, error.message);
        } else {
          console.log(`✓ Tabela ${table} existe${data ? ` (${data.count} registros)` : ''}`);
        }
      } catch (e) {
        console.error(`Erro ao verificar tabela ${table}:`, e);
      }
    }
    
    // Verificar políticas RLS
    console.log('\nVerificando políticas RLS...');
    
    try {
      const { data: policies, error: policiesError } = await supabase.rpc('get_policies');
      
      if (policiesError) {
        console.error('Erro ao verificar políticas RLS:', policiesError.message);
        console.log('Nota: Você precisa executar o script supabase_rpc.sql para adicionar a função get_policies');
      } else if (policies) {
        console.log(`Encontradas ${policies.length} políticas RLS`);
        
        // Agrupar políticas por tabela
        const policyByTable = policies.reduce((acc, policy) => {
          if (!acc[policy.table_name]) {
            acc[policy.table_name] = [];
          }
          acc[policy.table_name].push(policy.name);
          return acc;
        }, {});
        
        for (const [table, tablePolicies] of Object.entries(policyByTable)) {
          console.log(`  - ${table}: ${tablePolicies.join(', ')}`);
        }
      }
    } catch (rpcError) {
      console.error('Erro ao chamar função RPC get_policies:', rpcError.message);
      console.log('Nota: Você precisa executar o script supabase_rpc.sql para adicionar a função get_policies');
    }
    
    // Verificar usuários existentes
    console.log('\nVerificando usuários existentes...');
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, status')
        .limit(10);
      
      if (usersError) {
        console.error('Erro ao verificar usuários:', usersError.message);
      } else if (users && users.length > 0) {
        console.log(`Encontrados ${users.length} usuários:`);
        users.forEach(user => {
          console.log(`  - ${user.name} (${user.email}) - Status: ${user.status}`);
        });
      } else {
        console.log('Nenhum usuário encontrado na tabela users');
      }
    } catch (e) {
      console.error('Erro ao verificar usuários:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Erro inesperado:', error);
    return false;
  }
}

async function testAuthentication() {
  console.log('\nTestando autenticação...');
  
  try {
    // Verificar sessão atual
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError.message);
      } else if (session) {
        console.log('Sessão ativa encontrada:');
        console.log('  - Usuário:', session.user.email);
        console.log('  - ID:', session.user.id);
        
        // Fazer logout para testar nova autenticação
        console.log('Fazendo logout para testar nova autenticação...');
        await supabase.auth.signOut();
      } else {
        console.log('Nenhuma sessão ativa encontrada');
      }
    } catch (e) {
      console.error('Erro ao verificar sessão:', e);
    }
    
    // Tentar fazer login com um usuário de teste
    const testEmail = 'teste@exemplo.com';
    const testPassword = 'senha123';
    
    console.log(`\nTentando fazer login com ${testEmail}...`);
    
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      
      if (signInError) {
        console.log(`Não foi possível fazer login: ${signInError.message}`);
        
        // Tentar criar um usuário de teste
        console.log('\nTentando criar um usuário de teste...');
        
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
              data: {
                name: 'Usuário de Teste',
                status: 'online',
                last_seen: new Date().toISOString()
              }
            }
          });
          
          if (signUpError) {
            console.error('Erro ao criar usuário de teste:', signUpError.message);
            console.error('Detalhes do erro:', JSON.stringify(signUpError, null, 2));
          } else if (signUpData.user) {
            console.log('Usuário de teste criado com sucesso!');
            console.log('ID do usuário:', signUpData.user.id);
            
            // Verificar se o trigger handle_new_user está funcionando
            console.log('\nVerificando se o trigger handle_new_user está funcionando...');
            console.log('Aguardando 3 segundos para o trigger ser executado...');
            
            // Aguardar um pouco para o trigger ser executado
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', signUpData.user.id)
                .single();
              
              if (userError) {
                console.error('Erro ao buscar dados do usuário na tabela users:', userError.message);
                console.log('O trigger handle_new_user pode não estar funcionando corretamente');
              } else if (userData) {
                console.log('Usuário encontrado na tabela users:');
                console.log(userData);
                console.log('O trigger handle_new_user está funcionando corretamente');
              } else {
                console.log('Usuário não encontrado na tabela users');
                console.log('O trigger handle_new_user não está funcionando corretamente');
              }
            } catch (e) {
              console.error('Erro ao verificar usuário na tabela users:', e);
            }
          } else {
            console.log('Usuário criado, mas confirmação de email pode ser necessária');
            console.log('Dados retornados:', JSON.stringify(signUpData, null, 2));
          }
        } catch (e) {
          console.error('Erro ao criar usuário de teste:', e);
        }
      } else if (signInData.user) {
        console.log('Login bem-sucedido!');
        console.log('ID do usuário:', signInData.user.id);
        
        // Verificar se o usuário existe na tabela users
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', signInData.user.id)
            .single();
          
          if (userError) {
            console.error('Erro ao buscar dados do usuário na tabela users:', userError.message);
          } else if (userData) {
            console.log('Dados do usuário na tabela users:');
            console.log(userData);
          } else {
            console.log('Usuário não encontrado na tabela users');
            console.log('Isso pode indicar um problema com o trigger handle_new_user');
          }
        } catch (e) {
          console.error('Erro ao verificar usuário na tabela users:', e);
        }
        
        // Fazer logout
        try {
          const { error: signOutError } = await supabase.auth.signOut();
          
          if (signOutError) {
            console.error('Erro ao fazer logout:', signOutError.message);
          } else {
            console.log('Logout bem-sucedido!');
          }
        } catch (e) {
          console.error('Erro ao fazer logout:', e);
        }
      } else {
        console.log('Login falhou por motivo desconhecido');
        console.log('Dados retornados:', JSON.stringify(signInData, null, 2));
      }
    } catch (e) {
      console.error('Erro ao tentar fazer login:', e);
    }
  } catch (error) {
    console.error('Erro inesperado durante teste de autenticação:', error);
  }
}

async function main() {
  const dbCheck = await checkDatabase();
  
  if (dbCheck) {
    await testAuthentication();
  } else {
    console.log('\nVerificação do banco de dados falhou. Pulando teste de autenticação.');
    
    // Verificar se o Supabase está acessível
    console.log('\nVerificando se o Supabase está acessível...');
    try {
      const response = await fetch(supabaseUrl);
      console.log('Status da resposta:', response.status);
      console.log('Supabase está acessível:', response.ok);
    } catch (e) {
      console.error('Erro ao acessar o Supabase:', e);
    }
  }
  
  console.log('\nVerificação concluída!');
}

main(); 