'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export async function loginAction(prevState: any, formData: FormData) {
	const email = formData.get('email') as string
	const password = formData.get('password') as string
	const supabase = getSupabase()

	// Verificar se já existe uma sessão e fazer logout se necessário
	const { data: { session: existingSession } } = await supabase.auth.getSession()
	if (existingSession) {
		await supabase.auth.signOut()
		console.log('Sessão existente encontrada, logout realizado')
	}

	// Tentar fazer login
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})

	if (error) {
		console.error('Erro ao fazer login:', error)
		return {
			success: false,
			message: error.message,
		}
	}

	if (!data.session) {
		console.error('Login bem-sucedido, mas nenhuma sessão foi criada')
		return {
			success: false,
			message: 'Falha ao criar sessão. Tente novamente.',
		}
	}

	// Definir cookies para manter a sessão
	console.log('Definindo cookies de sessão...')
	
	// Access Token - Expira em 7 dias
	cookies().set('sb-access-token', data.session.access_token, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
	
	// Refresh Token - Expira em 30 dias
	cookies().set('sb-refresh-token', data.session.refresh_token, {
		path: '/',
		maxAge: 60 * 60 * 24 * 30, // 30 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
	
	// User ID - Para acesso rápido no cliente
	cookies().set('sb-user-id', data.session.user.id, {
		path: '/',
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
	
	// Estado de autenticação simples - Para verificação rápida
	cookies().set('sb-auth-state', 'authenticated', {
		path: '/',
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
	
	// Provider Token - Para gerenciamento de sessão
	cookies().set('sb-provider-token', data.session.provider_token || '', {
		path: '/',
		maxAge: 60 * 60 * 24 * 7, // 7 dias
		httpOnly: false, // Permitir acesso via JavaScript
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	})
	
	console.log('Cookies de sessão definidos')

	// Retornar sucesso sem dados de sessão
	// O redirect() não funciona bem com Server Actions e forms
	return {
		success: true,
		message: 'Login bem-sucedido!',
	}
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  
  if (!email || !password || !name) {
    return { error: 'Todos os campos são obrigatórios' }
  }
  
  try {
    console.log("Iniciando registro de usuário via Server Action...")
    const supabase = getSupabase()
    
    // Registrar o usuário com Supabase Auth
    // O trigger handle_new_user cuidará de inserir o usuário na tabela users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          status: 'online',
          last_seen: new Date().toISOString(),
        }
      }
    })
    
    if (authError) {
      console.error("Erro no registro:", authError.message)
      return { error: authError.message }
    }
    
    console.log("Registro bem-sucedido")
    return { success: true }
  } catch (error: any) {
    console.error("Erro inesperado durante registro:", error)
    return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
  }
}

export async function logoutAction() {
  try {
    const supabase = getSupabase()
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    // Atualizar status para offline antes de sair
    if (user) {
      await supabase
        .from('users')
        .update({
          status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('id', user.id)
    }
    
    // Fazer logout
    await supabase.auth.signOut()
    
    console.log("Logout bem-sucedido")
    // Em vez de redirecionar diretamente, retornamos sucesso
    return { success: true }
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    return { error: 'Ocorreu um erro ao fazer logout.' }
  }
}

// Nova função para inicializar o banco de dados com dados de exemplo
export async function initializeChatData() {
  try {
    const supabase = getSupabase()
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error("Usuário não autenticado")
      return { error: 'Usuário não autenticado' }
    }
    
    console.log("Iniciando inicialização de dados de chat para o usuário:", user.id)
    
    // Verificar se já existem chats para o usuário
    const { data: existingChats, error: existingChatsError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id)
      .is('left_at', null)
    
    if (existingChatsError) {
      console.error("Erro ao verificar chats existentes:", existingChatsError)
      return { error: 'Erro ao verificar chats existentes' }
    }
    
    if (existingChats && existingChats.length > 0) {
      console.log("Usuário já possui chats, pulando inicialização:", existingChats)
      return { success: true, message: 'Usuário já possui chats' }
    }
    
    // Buscar outros usuários para criar conversas
    let { data: otherUsers, error: otherUsersError } = await supabase
      .from('users')
      .select('id, name')
      .neq('id', user.id)
      .limit(3)
    
    if (otherUsersError) {
      console.error("Erro ao buscar outros usuários:", otherUsersError)
      return { error: 'Erro ao buscar outros usuários' }
    }
    
    console.log("Outros usuários encontrados:", otherUsers)
    
    if (!otherUsers || otherUsers.length === 0) {
      console.log("Nenhum outro usuário encontrado para criar conversas")
      
      // Criar usuários de exemplo se não existirem outros usuários
      const exampleUsers = [
        { email: 'exemplo1@teste.com', name: 'Usuário Exemplo 1', password: 'senha123' },
        { email: 'exemplo2@teste.com', name: 'Usuário Exemplo 2', password: 'senha123' },
        { email: 'exemplo3@teste.com', name: 'Usuário Exemplo 3', password: 'senha123' }
      ]
      
      console.log("Tentando criar usuários de exemplo:", exampleUsers)
      
      for (const exampleUser of exampleUsers) {
        // Verificar se o usuário já existe
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', exampleUser.email)
          .single()
        
        if (existingUser) {
          console.log("Usuário já existe:", existingUser)
          continue
        }
        
        try {
          // Criar usuário de exemplo usando signUp em vez de admin.createUser
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: exampleUser.email,
            password: exampleUser.password,
            options: {
              data: {
                name: exampleUser.name,
                status: 'online',
                last_seen: new Date().toISOString()
              }
            }
          })
          
          if (authError) {
            console.error("Erro ao criar usuário de exemplo:", authError)
            continue
          }
          
          console.log("Usuário de exemplo criado:", authData?.user?.id || 'ID não disponível')
        } catch (error) {
          console.error("Erro ao criar usuário de exemplo:", error)
        }
      }
      
      // Buscar os usuários criados
      const { data: createdUsers, error: createdUsersError } = await supabase
        .from('users')
        .select('id, name')
        .neq('id', user.id)
        .limit(3)
      
      if (createdUsersError) {
        console.error("Erro ao buscar usuários criados:", createdUsersError)
      }
      
      if (!createdUsers || createdUsers.length === 0) {
        console.error("Não foi possível criar usuários de exemplo")
        return { error: 'Não foi possível criar usuários de exemplo' }
      }
      
      console.log("Usuários criados:", createdUsers)
      
      // Usar os usuários criados
      otherUsers = createdUsers
    }
    
    // Obter o nome do usuário atual
    const { data: currentUserData, error: currentUserError } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()
    
    if (currentUserError) {
      console.error("Erro ao buscar nome do usuário atual:", currentUserError)
      return { error: 'Erro ao buscar nome do usuário atual' }
    }
    
    const currentUserName = currentUserData?.name || 'Usuário'
    console.log("Nome do usuário atual:", currentUserName)
    
    // Criar chats diretos com cada usuário
    for (const otherUser of otherUsers) {
      console.log("Criando chat com usuário:", otherUser)
      
      try {
        // Criar um novo chat
        const { data: chatData, error: chatError } = await supabase
          .from('chats')
          .insert({
            type: 'direct',
            company_id: null,
            created_by: user.id,
          })
          .select('id')
          .single()
        
        if (chatError) {
          console.error("Erro ao criar chat:", chatError)
          continue
        }
        
        console.log("Chat criado:", chatData)
        
        // Adicionar participantes
        const participantsToInsert = [
          { chat_id: chatData.id, user_id: user.id, role: 'member' },
          { chat_id: chatData.id, user_id: otherUser.id, role: 'member' }
        ]
        
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(participantsToInsert)
        
        if (participantsError) {
          console.error("Erro ao adicionar participantes:", participantsError)
          continue
        }
        
        console.log("Participantes adicionados ao chat")
        
        // Adicionar algumas mensagens de exemplo
        const messages = [
          { 
            chat_id: chatData.id, 
            sender_id: otherUser.id, 
            type: 'text', 
            content: `Olá, eu sou ${otherUser.name}!`,
            created_at: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
          },
          { 
            chat_id: chatData.id, 
            sender_id: user.id, 
            type: 'text', 
            content: 'Olá! Tudo bem com você?',
            created_at: new Date(Date.now() - 3500000).toISOString() // 58 minutos atrás
          },
          { 
            chat_id: chatData.id, 
            sender_id: otherUser.id, 
            type: 'text', 
            content: 'Tudo ótimo! E com você?',
            created_at: new Date(Date.now() - 3400000).toISOString() // 56 minutos atrás
          }
        ]
        
        for (const message of messages) {
          const { error: messageError } = await supabase
            .from('messages')
            .insert(message)
          
          if (messageError) {
            console.error("Erro ao adicionar mensagem:", messageError)
          }
        }
        
        console.log("Mensagens adicionadas ao chat")
        
        // Atualizar o timestamp da última mensagem no chat
        await supabase
          .from('chats')
          .update({ last_message_at: new Date(Date.now() - 3400000).toISOString() })
          .eq('id', chatData.id)
        
        console.log("Chat criado com sucesso:", chatData.id)
      } catch (error) {
        console.error("Erro ao criar chat com usuário:", otherUser, error)
      }
    }
    
    // Criar um grupo
    try {
      const { data: groupChatData, error: groupChatError } = await supabase
        .from('chats')
        .insert({
          type: 'group',
          company_id: null,
          created_by: user.id,
        })
        .select('id')
        .single()
      
      if (groupChatError) {
        console.error("Erro ao criar chat de grupo:", groupChatError)
      } else {
        console.log("Chat de grupo criado:", groupChatData)
        
        // Criar o grupo
        const { error: groupError } = await supabase
          .from('groups')
          .insert({
            chat_id: groupChatData.id,
            name: 'Grupo de Exemplo',
            tag: 'exemplo',
            image_url: null
          })
        
        if (groupError) {
          console.error("Erro ao criar grupo:", groupError)
        } else {
          console.log("Grupo criado")
          
          // Adicionar participantes ao grupo
          const groupParticipants = [
            { chat_id: groupChatData.id, user_id: user.id, role: 'admin' },
            ...otherUsers.map(ou => ({ chat_id: groupChatData.id, user_id: ou.id, role: 'member' }))
          ]
          
          const { error: groupParticipantsError } = await supabase
            .from('chat_participants')
            .insert(groupParticipants)
          
          if (groupParticipantsError) {
            console.error("Erro ao adicionar participantes ao grupo:", groupParticipantsError)
          } else {
            console.log("Participantes adicionados ao grupo")
            
            // Adicionar mensagem de sistema
            const { error: systemMessageError } = await supabase
              .from('messages')
              .insert({
                chat_id: groupChatData.id,
                sender_id: user.id,
                type: 'system',
                content: `Grupo "Grupo de Exemplo" criado por ${currentUserName}`
              })
            
            if (systemMessageError) {
              console.error("Erro ao adicionar mensagem de sistema:", systemMessageError)
            } else {
              console.log("Mensagem de sistema adicionada ao grupo")
            }
            
            console.log("Grupo criado com sucesso:", groupChatData.id)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao criar grupo:", error)
    }
    
    return { success: true, message: 'Dados de chat inicializados com sucesso' }
  } catch (error) {
    console.error("Erro ao inicializar dados de chat:", error)
    return { error: 'Ocorreu um erro ao inicializar dados de chat.' }
  }
} 