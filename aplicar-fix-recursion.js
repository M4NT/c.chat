const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = 'https://nssldsdyczxvthmsnjcm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zc2xkc2R5Y3p4dnRobXNuamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NTc5NzcsImV4cCI6MjAyNDUzMzk3N30.Nh83ebqzf1iGHTaGzXhq7gQHdQCEVyBs6cTGHrQy6OU'

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

async function aplicarFixRecursion() {
  try {
    console.log('Aplicando script fix-recursion.sql...')
    
    // Ler o conteúdo do arquivo SQL
    const sqlPath = path.resolve('fix-recursion.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Dividir o script em comandos individuais
    const comandos = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
    
    console.log(`Encontrados ${comandos.length} comandos SQL para executar`)
    
    // Executar cada comando individualmente
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i] + ';'
      console.log(`Executando comando ${i + 1}/${comandos.length}...`)
      
      // Executar o comando SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: comando })
      
      if (error) {
        console.error(`Erro ao executar comando ${i + 1}:`, error.message)
      } else {
        console.log(`Comando ${i + 1} executado com sucesso`)
      }
    }
    
    console.log('Script aplicado com sucesso!')
    console.log('Execute o script check-rls-policies.js para verificar se as políticas foram corrigidas')
    
  } catch (error) {
    console.error('Erro ao aplicar script:', error)
  }
}

// Executar a função
aplicarFixRecursion() 