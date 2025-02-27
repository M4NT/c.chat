require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Inicializa o cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave anônima (primeiros 5 caracteres):', supabaseAnonKey?.substring(0, 5) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente não configuradas corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para verificar a configuração de cookies no Next.js
async function checkCookieConfiguration() {
  try {
    console.log('\n=== Verificando configuração de cookies ===');
    
    // Verificar se o arquivo .env.local existe
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('Arquivo .env.local encontrado');
    } else {
      console.log('Arquivo .env.local não encontrado');
    }
    
    // Verificar se o arquivo next.config.js existe e tem configurações de cookies
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('Arquivo next.config.js encontrado');
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (configContent.includes('cookies')) {
        console.log('Configuração de cookies encontrada em next.config.js');
      } else {
        console.log('Configuração de cookies não encontrada em next.config.js');
      }
    } else {
      console.log('Arquivo next.config.js não encontrado');
    }
    
    // Verificar a configuração de cookies no arquivo actions.ts
    const actionsPath = path.join(process.cwd(), 'app', 'lib', 'actions.ts');
    if (fs.existsSync(actionsPath)) {
      console.log('Arquivo actions.ts encontrado');
      const actionsContent = fs.readFileSync(actionsPath, 'utf8');
      
      if (actionsContent.includes('cookies()')) {
        console.log('Uso de cookies encontrado em actions.ts');
        
        if (actionsContent.includes('sb-access-token')) {
          console.log('Cookie de acesso (sb-access-token) encontrado');
        } else {
          console.log('Cookie de acesso (sb-access-token) não encontrado');
        }
        
        if (actionsContent.includes('sb-refresh-token')) {
          console.log('Cookie de refresh (sb-refresh-token) encontrado');
        } else {
          console.log('Cookie de refresh (sb-refresh-token) não encontrado');
        }
      } else {
        console.log('Uso de cookies não encontrado em actions.ts');
      }
    } else {
      console.log('Arquivo actions.ts não encontrado');
    }
  } catch (error) {
    console.error('Erro ao verificar configuração de cookies:', error);
  }
}

// Função para verificar a sessão atual
async function checkSession() {
  try {
    console.log('\n=== Verificando sessão atual ===');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao verificar sessão:', error.message);
      return null;
    }
    
    if (!session) {
      console.log('Nenhuma sessão ativa encontrada');
      return null;
    }
    
    console.log('Sessão ativa encontrada:');
    console.log('- ID do usuário:', session.user.id);
    console.log('- Email:', session.user.email);
    console.log('- Criado em:', new Date(session.user.created_at).toLocaleString());
    
    if (session.expires_at) {
      console.log('- Expiração do token:', new Date(session.expires_at * 1000).toLocaleString());
      const isExpired = Date.now() > session.expires_at * 1000;
      console.log('- Token expirado?', isExpired ? 'SIM' : 'NÃO');
    } else {
      console.log('- Expiração do token: Não definida');
    }
    
    return session;
  } catch (error) {
    console.error('Erro ao verificar sessão:', error.message);
    return null;
  }
}

// Função para verificar a configuração do AuthProvider
async function checkAuthProvider() {
  try {
    console.log('\n=== Verificando configuração do AuthProvider ===');
    
    const authProviderPath = path.join(process.cwd(), 'components', 'auth-provider.tsx');
    if (fs.existsSync(authProviderPath)) {
      console.log('Arquivo auth-provider.tsx encontrado');
      const authProviderContent = fs.readFileSync(authProviderPath, 'utf8');
      
      if (authProviderContent.includes('onAuthStateChange')) {
        console.log('Listener de mudanças de autenticação encontrado');
      } else {
        console.log('Listener de mudanças de autenticação não encontrado');
      }
      
      if (authProviderContent.includes('getCurrentUser')) {
        console.log('Função getCurrentUser encontrada');
      } else {
        console.log('Função getCurrentUser não encontrada');
      }
    } else {
      console.log('Arquivo auth-provider.tsx não encontrado');
    }
    
    // Verificar a configuração do ProtectedRoute
    const protectedRoutePath = path.join(process.cwd(), 'components', 'protected-route.tsx');
    if (fs.existsSync(protectedRoutePath)) {
      console.log('Arquivo protected-route.tsx encontrado');
      const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf8');
      
      if (protectedRouteContent.includes('getSession')) {
        console.log('Verificação de sessão encontrada em protected-route.tsx');
      } else {
        console.log('Verificação de sessão não encontrada em protected-route.tsx');
      }
    } else {
      console.log('Arquivo protected-route.tsx não encontrado');
    }
  } catch (error) {
    console.error('Erro ao verificar configuração do AuthProvider:', error);
  }
}

// Função para verificar a configuração do Supabase
async function checkSupabaseConfig() {
  try {
    console.log('\n=== Verificando configuração do Supabase ===');
    
    const supabasePath = path.join(process.cwd(), 'lib', 'supabase.ts');
    if (fs.existsSync(supabasePath)) {
      console.log('Arquivo supabase.ts encontrado');
      const supabaseContent = fs.readFileSync(supabasePath, 'utf8');
      
      if (supabaseContent.includes('createClient')) {
        console.log('Função createClient encontrada');
      } else {
        console.log('Função createClient não encontrada');
      }
      
      if (supabaseContent.includes('signIn')) {
        console.log('Função signIn encontrada');
      } else {
        console.log('Função signIn não encontrada');
      }
      
      if (supabaseContent.includes('signOut')) {
        console.log('Função signOut encontrada');
      } else {
        console.log('Função signOut não encontrada');
      }
      
      if (supabaseContent.includes('getCurrentUser')) {
        console.log('Função getCurrentUser encontrada');
      } else {
        console.log('Função getCurrentUser não encontrada');
      }
    } else {
      console.log('Arquivo supabase.ts não encontrado');
    }
  } catch (error) {
    console.error('Erro ao verificar configuração do Supabase:', error);
  }
}

// Função principal
async function main() {
  try {
    // Verificar configuração de cookies
    await checkCookieConfiguration();
    
    // Verificar sessão atual
    await checkSession();
    
    // Verificar configuração do AuthProvider
    await checkAuthProvider();
    
    // Verificar configuração do Supabase
    await checkSupabaseConfig();
    
    console.log('\n=== Verificação concluída ===');
  } catch (error) {
    console.error('Erro durante a verificação:', error);
  }
}

main(); 