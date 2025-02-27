import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database.types"

// Inicializa o cliente Supabase com as variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function initSupabase() {
	if (!supabaseClient && supabaseUrl && supabaseAnonKey) {
		supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
	}
	return getSupabase()
}

export function getSupabase() {
	if (!supabaseClient) {
		supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
	}
	return supabaseClient
}

// Funções de autenticação
export async function signUp(email: string, password: string, name: string) {
	const supabase = getSupabase()
	
	// Registrar o usuário com Supabase Auth
	const { data: authData, error: authError } = await supabase.auth.signUp({
		email,
		password,
	})
	
	if (authError) throw authError
	
	// Se o registro for bem-sucedido, adicionar informações adicionais na tabela users
	if (authData.user) {
		const { error: profileError } = await supabase
			.from('users')
			.insert({
				id: authData.user.id,
				email,
				name,
				password_hash: 'MANAGED_BY_SUPABASE_AUTH', // Não armazenamos a senha diretamente
				status: 'online',
				last_seen: new Date().toISOString(),
			})
		
		if (profileError) throw profileError
	}
	
	return authData
}

export async function signIn(email: string, password: string) {
	const supabase = getSupabase()
	
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	})
	
	if (error) throw error
	
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
	
	return data
}

export async function signOut() {
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
	const { error } = await supabase.auth.signOut()
	if (error) throw error
}

export async function getCurrentUser() {
	const supabase = getSupabase()
	
	const { data: { user } } = await supabase.auth.getUser()
	
	if (!user) return null
	
	// Buscar informações adicionais do usuário da tabela users
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('id', user.id)
		.single()
	
	if (error) throw error
	
	return data
}

export async function uploadFile(file: File, bucket = 'files') {
	const supabase = getSupabase()
	const fileExt = file.name.split('.').pop()
	const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
	const filePath = `${fileName}`
	
	const { data, error } = await supabase.storage
		.from(bucket)
		.upload(filePath, file)
	
	if (error) {
		console.error("Erro ao fazer upload do arquivo:", error)
		throw error
	}
	
	return data
}

