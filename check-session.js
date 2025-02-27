require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      console.log('\nVerifique os cookies no navegador:');
      console.log('1. Abra o DevTools (F12)');
      console.log('2. Vá para a aba "Application"');
      console.log('3. No painel esquerdo, expanda "Cookies" e selecione seu domínio');
      console.log('4. Verifique se existem os cookies: sb-access-token, sb-refresh-token, sb-user-id');
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

function checkAuthComponents() {
  console.log('\n=== Verificando componentes de autenticação ===');
  
  // Verificar AuthProvider
  const authProviderPath = path.join(process.cwd(), 'components/auth-provider.tsx');
  const protectedRoutePath = path.join(process.cwd(), 'components/protected-route.tsx');
  
  if (fs.existsSync(authProviderPath)) {
    console.log('✅ AuthProvider encontrado');
    const authProviderContent = fs.readFileSync(authProviderPath, 'utf8');
    
    if (authProviderContent.includes('onAuthStateChange')) {
      console.log('✅ Listener de autenticação encontrado no AuthProvider');
    } else {
      console.log('❌ Listener de autenticação NÃO encontrado no AuthProvider');
    }
  } else {
    console.log('❌ AuthProvider NÃO encontrado');
  }
  
  // Verificar ProtectedRoute
  if (fs.existsSync(protectedRoutePath)) {
    console.log('✅ ProtectedRoute encontrado');
    const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
    
    if (protectedRouteContent.includes('getSession')) {
      console.log('✅ Verificação de sessão encontrada no ProtectedRoute');
    } else {
      console.log('❌ Verificação de sessão NÃO encontrada no ProtectedRoute');
    }
  } else {
    console.log('❌ ProtectedRoute NÃO encontrado');
  }
}

// Função principal
async function main() {
  console.log('=== Diagnóstico de Autenticação ===');
  
  // Verificar sessão
  const hasSession = await checkSession();
  
  // Verificar componentes
  checkAuthComponents();
  
  console.log('\n=== Diagnóstico concluído ===');
  if (!hasSession) {
    console.log('Problema detectado: Nenhuma sessão ativa encontrada.');
    console.log('\nPossíveis soluções:');
    console.log('1. Execute o script fix-rls-simple.sql no SQL Editor do Supabase');
    console.log('2. Reinicie o servidor de desenvolvimento');
    console.log('3. Limpe os cookies do navegador e tente fazer login novamente');
  } else {
    console.log('Sessão ativa encontrada. Se ainda estiver tendo problemas:');
    console.log('1. Verifique se as políticas RLS estão configuradas corretamente');
    console.log('2. Verifique se o redirecionamento após o login está funcionando');
  }
}

main().catch(error => {
  console.error('Erro durante o diagnóstico:', error);
  process.exit(1); 