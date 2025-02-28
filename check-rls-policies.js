const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Ler variáveis do arquivo .env.local
function loadEnv() {
  try {
    const envPath = path.resolve('.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim()
        envVars[key] = value
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Erro ao carregar variáveis de ambiente:', error.message)
    return {}
  }
}

const env = loadEnv()
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

console.log('Supabase URL:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRlsPolicies() {
  try {
    console.log('Verificando políticas RLS com chave anônima...')
    
    // Verificar acesso às tabelas
    console.log('\nVerificando acesso às tabelas:')
    
    // Verificar users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5)
    
    console.log('\nTabela users:')
    if (usersError) {
      console.error('Erro ao acessar users:', usersError.message)
    } else {
      console.log(`Encontrados ${users?.length || 0} registros`)
      if (users && users.length > 0) {
        console.log('Primeiro usuário:', users[0])
      }
    }
    
    // Verificar chats
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, type, created_at')
      .limit(5)
    
    console.log('\nTabela chats:')
    if (chatsError) {
      console.error('Erro ao acessar chats:', chatsError.message)
    } else {
      console.log(`Encontrados ${chats?.length || 0} registros`)
      if (chats && chats.length > 0) {
        console.log('Primeiro chat:', chats[0])
      }
    }
    
    // Verificar chat_participants
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('chat_id, user_id, role')
      .limit(5)
    
    console.log('\nTabela chat_participants:')
    if (participantsError) {
      console.error('Erro ao acessar chat_participants:', participantsError.message)
    } else {
      console.log(`Encontrados ${participants?.length || 0} registros`)
      if (participants && participants.length > 0) {
        console.log('Primeiro participante:', participants[0])
      }
    }
    
    // Verificar messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id, content')
      .limit(5)
    
    console.log('\nTabela messages:')
    if (messagesError) {
      console.error('Erro ao acessar messages:', messagesError.message)
    } else {
      console.log(`Encontrados ${messages?.length || 0} registros`)
      if (messages && messages.length > 0) {
        console.log('Primeira mensagem:', messages[0])
      }
    }
    
    // Verificar groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('chat_id, name, tag')
      .limit(5)
    
    console.log('\nTabela groups:')
    if (groupsError) {
      console.error('Erro ao acessar groups:', groupsError.message)
    } else {
      console.log(`Encontrados ${groups?.length || 0} registros`)
      if (groups && groups.length > 0) {
        console.log('Primeiro grupo:', groups[0])
      }
    }
    
    // Verificar se o script fix-recursion.sql foi aplicado
    console.log('\nVerificando se o script fix-recursion.sql foi aplicado:')
    
    // Se conseguimos acessar todas as tabelas sem erros de permissão, o script provavelmente foi aplicado
    const scriptAplicado = 
      !usersError && 
      !chatsError && 
      !participantsError && 
      !messagesError && 
      !groupsError
    
    console.log('Script fix-recursion.sql aplicado:', scriptAplicado ? 'Sim' : 'Não')
    
    if (!scriptAplicado) {
      console.log('\nVocê precisa aplicar o script fix-recursion.sql no SQL Editor do Supabase para corrigir as políticas RLS.')
      console.log('Erros encontrados:')
      if (usersError) console.log('- users:', usersError.message)
      if (chatsError) console.log('- chats:', chatsError.message)
      if (participantsError) console.log('- chat_participants:', participantsError.message)
      if (messagesError) console.log('- messages:', messagesError.message)
      if (groupsError) console.log('- groups:', groupsError.message)
    }
    
  } catch (error) {
    console.error('Erro ao verificar políticas RLS:', error)
  }
}

checkRlsPolicies() 