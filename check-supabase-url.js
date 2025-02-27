// Script para verificar a URL do Supabase
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const http = require('http');

// Obter a URL do Supabase do arquivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Erro: Variável de ambiente NEXT_PUBLIC_SUPABASE_URL não encontrada');
  process.exit(1);
}

console.log('URL do Supabase:', supabaseUrl);
if (supabaseAnonKey) {
  console.log('Chave anônima do Supabase:', supabaseAnonKey.substring(0, 10) + '...');
} else {
  console.error('Erro: Variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY não encontrada');
}

// Função para fazer uma requisição HTTP/HTTPS
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Verificar se o Supabase está acessível
async function checkSupabaseUrl() {
  console.log('\nVerificando se o Supabase está acessível...');
  
  try {
    // Verificar o URL base
    console.log(`\nVerificando URL base: ${supabaseUrl}`);
    const baseResponse = await makeRequest(supabaseUrl);
    console.log(`Status: ${baseResponse.statusCode}`);
    console.log(`Tipo de conteúdo: ${baseResponse.headers['content-type']}`);
    console.log(`Acessível: ${baseResponse.statusCode >= 200 && baseResponse.statusCode < 400}`);
    
    // Verificar o endpoint de autenticação
    const authUrl = `${supabaseUrl}/auth/v1/`;
    console.log(`\nVerificando endpoint de autenticação: ${authUrl}`);
    try {
      const authResponse = await makeRequest(authUrl);
      console.log(`Status: ${authResponse.statusCode}`);
      console.log(`Tipo de conteúdo: ${authResponse.headers['content-type']}`);
      console.log(`Acessível: ${authResponse.statusCode >= 200 && authResponse.statusCode < 400}`);
    } catch (error) {
      console.error(`Erro ao acessar endpoint de autenticação: ${error.message}`);
    }
    
    // Verificar o endpoint REST
    const restUrl = `${supabaseUrl}/rest/v1/`;
    console.log(`\nVerificando endpoint REST: ${restUrl}`);
    try {
      const restResponse = await makeRequest(restUrl);
      console.log(`Status: ${restResponse.statusCode}`);
      console.log(`Tipo de conteúdo: ${restResponse.headers['content-type']}`);
      console.log(`Acessível: ${restResponse.statusCode >= 200 && restResponse.statusCode < 400}`);
    } catch (error) {
      console.error(`Erro ao acessar endpoint REST: ${error.message}`);
    }
    
    // Verificar se o projeto existe
    console.log('\nVerificando se o projeto existe...');
    
    // Extrair o ID do projeto da URL
    const projectId = supabaseUrl.split('//')[1].split('.')[0];
    console.log(`ID do projeto: ${projectId}`);
    
    // Verificar se o projeto existe no Supabase
    const projectUrl = `https://supabase.com/dashboard/project/${projectId}`;
    console.log(`URL do dashboard do projeto: ${projectUrl}`);
    console.log('Acesse esta URL no navegador para verificar se o projeto existe');
    
    console.log('\nSugestões:');
    if (baseResponse.statusCode === 404) {
      console.log('1. O projeto Supabase pode não existir mais ou o ID do projeto está incorreto');
      console.log('2. Verifique se o projeto ainda está ativo no dashboard do Supabase');
      console.log('3. Crie um novo projeto no Supabase e atualize as variáveis de ambiente');
    } else if (baseResponse.statusCode >= 400) {
      console.log('1. O servidor Supabase retornou um erro');
      console.log('2. Verifique se o projeto ainda está ativo no dashboard do Supabase');
      console.log('3. Verifique se as credenciais estão corretas');
    } else {
      console.log('1. O servidor Supabase parece estar acessível');
      console.log('2. Verifique se as credenciais estão corretas');
      console.log('3. Verifique se as tabelas necessárias foram criadas no banco de dados');
    }
  } catch (error) {
    console.error(`Erro ao verificar URL do Supabase: ${error.message}`);
    console.log('\nSugestões:');
    console.log('1. Verifique sua conexão com a internet');
    console.log('2. Verifique se o URL do Supabase está correto');
    console.log('3. O servidor Supabase pode estar temporariamente indisponível');
  }
}

// Executar a verificação
checkSupabaseUrl(); 