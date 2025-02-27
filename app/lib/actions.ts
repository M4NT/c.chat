'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  if (!email || !password) {
    return { error: 'Email e senha são obrigatórios' }
  }
  
  try {
    console.log("Iniciando tentativa de login via Server Action...")
    const supabase = getSupabase()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error("Erro de autenticação:", error.message)
      return { error: error.message }
    }
    
    // Atualizar status do usuário para online
    if (data.user) {
      await supabase
        .from('users')
        .update({
          status: 'online',
          last_seen: new Date().toISOString(),
        })
        .eq('id', data.user.id)
    }
    
    console.log("Login bem-sucedido")
    // Em vez de redirecionar diretamente, retornamos sucesso
    return { success: true }
  } catch (error: any) {
    console.error("Erro inesperado durante login:", error)
    return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
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