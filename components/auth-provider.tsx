'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getSupabase, signIn, signOut, signUp } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']

interface AuthContextType {
	user: User | null
	isLoading: boolean
	sessionChecked: boolean
	signUp: (email: string, password: string, name: string) => Promise<void>
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [sessionChecked, setSessionChecked] = useState(false)
	const router = useRouter()
	
	// Verificar se há cookies de autenticação
	const checkAuthCookies = useCallback(() => {
		if (typeof window === 'undefined') return false
		
		const hasCookies = document.cookie.includes('sb-access-token') || 
			document.cookie.includes('sb-auth-state')
		
		console.log('AuthProvider - Verificação de cookies:', 
			hasCookies ? 'Cookies de autenticação encontrados' : 'Nenhum cookie de autenticação encontrado')
		
		return hasCookies
	}, [])
	
	// Verificar sessão atual
	const checkCurrentSession = useCallback(async () => {
		console.log('AuthProvider - Verificando sessão atual...')
		try {
			const supabase = getSupabase()
			const { data: { session }, error } = await supabase.auth.getSession()
			
			if (error) {
				console.error('AuthProvider - Erro ao obter sessão:', error)
				setUser(null)
				setIsLoading(false)
				setSessionChecked(true)
				return null
			}
			
			if (!session) {
				console.log('AuthProvider - Nenhuma sessão encontrada')
				
				// Se temos cookies mas não temos sessão, tentar restaurar a sessão
				if (checkAuthCookies()) {
					console.log('AuthProvider - Cookies encontrados, tentando restaurar sessão...')
					try {
						// Tentar recuperar a sessão
						const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
						
						if (refreshError) {
							console.error('AuthProvider - Erro ao restaurar sessão:', refreshError)
							setUser(null)
							setIsLoading(false)
							setSessionChecked(true)
							return null
						}
						
						if (refreshData.session) {
							console.log('AuthProvider - Sessão restaurada com sucesso:', {
								userId: refreshData.session.user.id,
								email: refreshData.session.user.email,
								expiresAt: refreshData.session.expires_at 
									? new Date(refreshData.session.expires_at * 1000).toLocaleString()
									: 'Não definido'
							})
							
							// Buscar dados completos do usuário
							const { data: userData, error: userError } = await supabase
								.from('users')
								.select('*')
								.eq('id', refreshData.session.user.id)
								.single()
							
							if (userError) {
								console.error('AuthProvider - Erro ao buscar dados do usuário após restaurar sessão:', userError)
							}
							
							const fullUser = userData 
								? { ...refreshData.session.user, ...userData }
								: refreshData.session.user
							
							setUser(fullUser as User)
							setIsLoading(false)
							setSessionChecked(true)
							return refreshData.session
						}
					} catch (refreshError) {
						console.error('AuthProvider - Erro ao tentar restaurar sessão:', refreshError)
					}
				}
				
				setUser(null)
				setIsLoading(false)
				setSessionChecked(true)
				return null
			}
			
			console.log('AuthProvider - Sessão válida encontrada:', {
				userId: session.user.id,
				email: session.user.email,
				expiresAt: session.expires_at 
					? new Date(session.expires_at * 1000).toLocaleString()
					: 'Não definido'
			})
			
			// Buscar dados completos do usuário
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('*')
				.eq('id', session.user.id)
				.single()
			
			if (userError) {
				console.error('AuthProvider - Erro ao buscar dados do usuário:', userError)
			}
			
			const fullUser = userData 
				? { ...session.user, ...userData }
				: session.user
			
			setUser(fullUser as User)
			setIsLoading(false)
			setSessionChecked(true)
			return session
		} catch (error) {
			console.error('AuthProvider - Erro ao verificar sessão:', error)
			setUser(null)
			setIsLoading(false)
			setSessionChecked(true)
			return null
		}
	}, [checkAuthCookies])
	
	// Verificar sessão ao montar o componente
	useEffect(() => {
		console.log('AuthProvider - Inicializando verificação de sessão...')
		checkCurrentSession()
	}, [checkCurrentSession])
	
	// Configurar listeners de autenticação
	useEffect(() => {
		console.log('AuthProvider - Configurando listeners de autenticação...')
		const supabase = getSupabase()
		
		// Listener para eventos de autenticação
		const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
			console.log('AuthProvider - Evento de autenticação:', event, {
				sessionPresente: session ? 'Sim' : 'Não',
				userId: session?.user?.id,
				email: session?.user?.email,
				expiresAt: session?.expires_at 
					? new Date(session.expires_at * 1000).toLocaleString()
					: 'Não definido'
			})
			
			if (event === 'SIGNED_IN' && session) {
				console.log('AuthProvider - Usuário autenticado, atualizando estado...')
				
				// Buscar dados completos do usuário
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('*')
					.eq('id', session.user.id)
					.single()
				
				if (userError) {
					console.error('AuthProvider - Erro ao buscar dados do usuário após login:', userError)
				}
				
				const fullUser = userData 
					? { ...session.user, ...userData }
					: session.user
				
				setUser(fullUser as User)
				setIsLoading(false)
				setSessionChecked(true)
			} else if (event === 'SIGNED_OUT') {
				console.log('AuthProvider - Usuário desconectado, limpando estado...')
				setUser(null)
				setIsLoading(false)
				setSessionChecked(true)
			} else if (event === 'TOKEN_REFRESHED' && session) {
				console.log('AuthProvider - Token atualizado, verificando sessão...')
				checkCurrentSession()
			}
		})
		
		// Limpar subscription ao desmontar
		return () => {
			console.log('AuthProvider - Limpando listeners de autenticação...')
			subscription.unsubscribe()
		}
	}, [checkCurrentSession])
	
	// Adicionar logs para debug
	useEffect(() => {
		console.log('AuthProvider - Estado atual:', { 
			user: user ? {
				id: user.id,
				email: user.email,
				name: user.name
			} : 'Ausente', 
			isLoading,
			sessionChecked,
			hasCookies: typeof window !== 'undefined' ? checkAuthCookies() : 'N/A (Server)'
		})
	}, [user, isLoading, sessionChecked, checkAuthCookies])
	
	// Função para registrar um novo usuário
	const handleSignUp = async (email: string, password: string, name: string) => {
		setIsLoading(true)
		try {
			console.log('AuthProvider - Iniciando registro de novo usuário...')
			await signUp(email, password, name)
			console.log('AuthProvider - Usuário registrado com sucesso')
			router.push('/auth/login')
		} catch (error) {
			console.error('AuthProvider - Erro ao registrar:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	// Função para fazer login
	const handleSignIn = async (email: string, password: string) => {
		setIsLoading(true)
		try {
			console.log('AuthProvider - Iniciando login...')
			const result = await signIn(email, password)
			console.log('AuthProvider - Login bem-sucedido via signIn:', {
				userId: result.user?.id,
				sessionExists: !!result.session
			})
			
			const currentUser = await getCurrentUser()
			if (currentUser) {
				setUser(currentUser)
				console.log('AuthProvider - Usuário carregado após login:', {
					id: currentUser.id,
					name: currentUser.name,
					email: currentUser.email
				})
			} else {
				console.error('AuthProvider - getCurrentUser retornou null após login bem-sucedido')
			}
			
			console.log('AuthProvider - Login bem-sucedido, redirecionando...')
			router.push('/')
		} catch (error) {
			console.error('AuthProvider - Erro ao fazer login:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	// Função para fazer logout
	const handleSignOut = async () => {
		setIsLoading(true)
		try {
			console.log('AuthProvider - Iniciando logout...')
			await signOut()
			setUser(null)
			console.log('AuthProvider - Logout bem-sucedido, redirecionando...')
			router.push('/auth/login')
		} catch (error) {
			console.error('AuthProvider - Erro ao fazer logout:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	const value = {
		user,
		isLoading,
		sessionChecked,
		signUp: handleSignUp,
		signIn: handleSignIn,
		signOut: handleSignOut,
	}
	
	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth deve ser usado dentro de um AuthProvider')
	}
	return context
} 