const { createClient } = require('@supabase/supabase-js')

// Inicializar cliente Supabase com valores diretos
const supabaseUrl = 'https://nssldsdyczxvthmsnjcm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zc2xkc2R5Y3p4dnRobXNuamNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NzA1NzYsImV4cCI6MjAyNDU0NjU3Nn0.Nh83ebqzf3p_DKfoYbXlDZuDjMN7-PVbOX_6kMQJn_0'

console.log('Supabase URL:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseKey)

// Credenciais de login
const email = 'teste@teste.com'
const password = 'teste123'

async function loginAndCheck() {
  try {
    console.log(`Tentando fazer login com ${email}...`)
    
    // Fazer login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Erro ao fazer login:', error.message)
      return
    }
    
    console.log('Login bem-sucedido!')
    console.log('Sessão:', data.session ? 'Ativa' : 'Inativa')
    console.log('Usuário:', data.user.id)
    
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
      console.log(users)
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
      console.log(chats)
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
      console.log(participants)
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
      console.log(messages)
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
      console.log(groups)
    }
    
  } catch (error) {
    console.error('Erro ao fazer login e verificar acesso:', error)
  }
}

loginAndCheck() 