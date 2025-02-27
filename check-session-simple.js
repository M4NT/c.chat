require('dotenv').config({ path: '.env.local' });
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
  console.log('Verificando sessão...');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error.message);
      return;
    }
    
    if (!session) {
      console.log('Nenhuma sessão encontrada. O usuário não está autenticado.');
      return;
    }
    
    console.log('Sessão encontrada:');
    console.log('- ID do usuário:', session.user.id);
    console.log('- Email:', session.user.email);
    
    if (session.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      console.log('- Expira em:', expiresAt.toLocaleString());
    }
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
  }
}

checkSession(); 