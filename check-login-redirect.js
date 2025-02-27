require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para simular o login
async function simulateLogin(email, password) {
  console.log(`\n=== Simulando login para ${email} ===`);
  
  try {
    // Verificar se já existe uma sessão ativa
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    
    if (existingSession) {
      console.log('Já existe uma sessão ativa, invalidando...');
      await supabase.auth.signOut();
    }
    
    // Fazer login com as credenciais fornecidas
    console.log('Tentando fazer login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Erro de autenticação:', error.message);
      return false;
    }
    
    if (!data.session) {
      console.error('Login bem-sucedido, mas nenhuma sessão foi criada');
      return false;
    }
    
    console.log('Login bem-sucedido!');
    console.log('Detalhes da sessão:');
    console.log('- ID do usuário:', data.user.id);
    console.log('- Email:', data.user.email);
    
    if (data.session.expires_at) {
      const expiresAt = new Date(data.session.expires_at * 1000);
      console.log('- Expira em:', expiresAt.toLocaleString());
    }
    
    // Verificar se o usuário existe na tabela users
    console.log('\nVerificando dados do usuário na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError.message);
    } else if (userData) {
      console.log('Dados do usuário encontrados:');
      console.log('- Nome:', userData.name);
      console.log('- Status:', userData.status);
    } else {
      console.log('Usuário não encontrado na tabela users.');
    }
    
    return true;
  } catch (error) {
    console.error('Erro inesperado durante login:', error.message);
    return false;
  }
}

// Função para verificar o estado da sessão
async function checkSession() {
  console.log('\n=== Verificando sessão atual ===');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error.message);
      return false;
    }
    
    if (!session) {
      console.log('Nenhuma sessão encontrada. O usuário não está autenticado.');
      return false;
    }
    
    console.log('Sessão encontrada:');
    console.log('- ID do usuário:', session.user.id);
    console.log('- Email:', session.user.email);
    
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const isExpired = expiresAt < now;
      
      console.log('- Expira em:', expiresAt.toLocaleString());
      console.log('- Status:', isExpired ? 'EXPIRADA' : 'VÁLIDA');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('=== Verificação de Login e Redirecionamento ===');
  
  // Verificar se já existe uma sessão
  const hasSession = await checkSession();
  
  if (hasSession) {
    console.log('\nJá existe uma sessão ativa. Fazendo logout primeiro...');
    await supabase.auth.signOut();
  }
  
  // Solicitar credenciais
  const email = process.argv[2] || 'teste@exemplo.com';
  const password = process.argv[3] || 'senha123';
  
  // Simular login
  const loginSuccess = await simulateLogin(email, password);
  
  if (loginSuccess) {
    console.log('\n=== Simulação de Redirecionamento ===');
    console.log('Login bem-sucedido. Em um navegador, você seria redirecionado para a página principal.');
    console.log('Verifique se o redirecionamento está funcionando corretamente no navegador.');
    
    console.log('\nPara testar no navegador:');
    console.log('1. Abra o DevTools (F12)');
    console.log('2. Vá para a aba "Console"');
    console.log('3. Faça login com suas credenciais');
    console.log('4. Observe os logs para ver se o redirecionamento está sendo iniciado');
    console.log('5. Verifique se você é redirecionado para a página principal');
  } else {
    console.log('\nLogin falhou. Verifique suas credenciais e tente novamente.');
  }
}

main().catch(error => {
  console.error('Erro durante a verificação:', error);
  process.exit(1);
}); 