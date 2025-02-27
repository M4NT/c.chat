// Script para verificar a autenticação na aplicação
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
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Função para verificar a sessão atual
async function checkSession() {
  console.log('\nVerificando sessão atual...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error.message);
      return null;
    }
    
    if (session) {
      console.log('Sessão ativa encontrada!');
      console.log('Usuário:', session.user.email);
      console.log('ID:', session.user.id);
      console.log('Expiração:', new Date(session.expires_at * 1000).toLocaleString());
      
      // Verificar se o token está expirado
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at < now) {
        console.log('ATENÇÃO: O token está expirado!');
      } else {
        const timeLeft = session.expires_at - now;
        console.log(`Tempo restante: ${Math.floor(timeLeft / 60)} minutos e ${timeLeft % 60} segundos`);
      }
      
      return session;
    } else {
      console.log('Nenhuma sessão ativa encontrada.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return null;
  }
}

// Função para fazer login
async function login(email, password) {
  console.log(`\nTentando fazer login com ${email}...`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro ao fazer login:', error.message);
      return null;
    }
    
    console.log('Login bem-sucedido!');
    console.log('Usuário:', data.user.email);
    console.log('ID:', data.user.id);
    
    return data;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return null;
  }
}

// Função para verificar o usuário na tabela users
async function checkUserInDatabase(userId) {
  console.log('\nVerificando usuário na tabela users...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao verificar usuário na tabela users:', error.message);
      return null;
    }
    
    if (data) {
      console.log('Usuário encontrado na tabela users:');
      console.log('Nome:', data.name);
      console.log('Email:', data.email);
      console.log('Status:', data.status);
      console.log('Último acesso:', new Date(data.last_seen).toLocaleString());
      
      return data;
    } else {
      console.log('Usuário não encontrado na tabela users.');
      return null;
    }
  } catch (error) {
    console.error('Erro ao verificar usuário na tabela users:', error);
    return null;
  }
}

// Função para verificar os chats do usuário
async function checkUserChats(userId) {
  console.log('\nVerificando chats do usuário...');
  
  try {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId)
      .is('left_at', null);
    
    if (error) {
      console.error('Erro ao verificar chats do usuário:', error.message);
      return [];
    }
    
    if (data && data.length > 0) {
      console.log(`Usuário participa de ${data.length} chats:`);
      
      for (const chat of data) {
        console.log(`- Chat ID: ${chat.chat_id}`);
        
        // Verificar tipo de chat
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .select('*')
          .eq('id', chat.chat_id)
          .single();
        
        if (chatError) {
          console.error(`  Erro ao verificar chat ${chat.chat_id}:`, chatError.message);
        } else if (chatData) {
          console.log(`  Tipo: ${chatData.type}`);
          console.log(`  Criado em: ${new Date(chatData.created_at).toLocaleString()}`);
          
          // Verificar participantes
          const { data: participants, error: participantsError } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', chat.chat_id)
            .is('left_at', null);
          
          if (participantsError) {
            console.error(`  Erro ao verificar participantes do chat ${chat.chat_id}:`, participantsError.message);
          } else if (participants) {
            console.log(`  Participantes: ${participants.length}`);
          }
          
          // Verificar mensagens
          const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('id')
            .eq('chat_id', chat.chat_id)
            .is('deleted_at', null);
          
          if (messagesError) {
            console.error(`  Erro ao verificar mensagens do chat ${chat.chat_id}:`, messagesError.message);
          } else if (messages) {
            console.log(`  Mensagens: ${messages.length}`);
          }
        }
      }
      
      return data;
    } else {
      console.log('Usuário não participa de nenhum chat.');
      return [];
    }
  } catch (error) {
    console.error('Erro ao verificar chats do usuário:', error);
    return [];
  }
}

// Função para fazer logout
async function logout() {
  console.log('\nFazendo logout...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
      return false;
    }
    
    console.log('Logout bem-sucedido!');
    return true;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return false;
  }
}

// Função principal
async function main() {
  console.log('Iniciando verificação de autenticação...');
  
  // Verificar sessão atual
  let session = await checkSession();
  
  if (!session) {
    // Tentar fazer login com usuário de teste
    const loginData = await login('teste@exemplo.com', 'senha123');
    
    if (loginData) {
      session = loginData.session;
      
      // Verificar usuário na tabela users
      const userData = await checkUserInDatabase(loginData.user.id);
      
      // Verificar chats do usuário
      if (userData) {
        await checkUserChats(loginData.user.id);
      }
      
      // Fazer logout
      await logout();
    }
  } else {
    // Verificar usuário na tabela users
    const userData = await checkUserInDatabase(session.user.id);
    
    // Verificar chats do usuário
    if (userData) {
      await checkUserChats(session.user.id);
    }
  }
  
  console.log('\nVerificação concluída!');
}

// Executar a função principal
main().catch(error => {
  console.error('Erro durante a verificação:', error);
}); 