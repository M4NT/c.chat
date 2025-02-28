require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Obter as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL do Supabase:', supabaseUrl);
console.log('Chave do Supabase:', supabaseKey ? 'Definida' : 'Não definida');

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  try {
    console.log('Consultando usuários...');
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, status')
      .limit(10);
    
    if (error) {
      console.error('Erro ao consultar usuários:', error);
      return;
    }
    
    console.log(`Encontrados ${data?.length || 0} usuários:`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

// Executar a verificação
checkUsers(); 