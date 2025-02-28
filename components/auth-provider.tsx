'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getSupabase, signIn, signOut, signUp } from '@/lib/supabase'
import { Database } from '@/types/database.types'

// Função para obter o valor de um cookie pelo nome
function getCookieValue(name: string): string | null {
	if (typeof document === 'undefined') return null
	
	const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
	return match ? decodeURIComponent(match[2]) : null
}

type User = Database['public']['Tables']['users']['Row']

interface AuthContextType {
	user: User | null
	isLoading: boolean
	sessionChecked: boolean
	authError: string | null
	signUp: (email: string, password: string, name: string) => Promise<void>
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [sessionChecked, setSessionChecked] = useState(false)
	const [authError, setAuthError] = useState<string | null>(null)
	const router = useRouter()
	
	// Verificar se estamos em uma página de autenticação
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const path = window.location.pathname
			const isAuthPath = path.includes('/auth/login') || path.includes('/auth/register')
			
			// Se estamos em uma página de autenticação, não precisamos verificar a sessão
			if (isAuthPath) {
				setIsLoading(false)
				setSessionChecked(true)
			}
		}
	}, [])
	
	// Verificar sessão ao carregar
	useEffect(() => {
		// Definir um timeout para evitar verificação infinita
		const timeoutId = setTimeout(() => {
			if (isLoading) {
				console.log("AuthProvider: Timeout de verificação de sessão atingido")
				setIsLoading(false)
				setSessionChecked(true)
			}
		}, 2000) // Timeout reduzido para 2 segundos
		
		const checkSession = async () => {
			try {
				console.log("AuthProvider: Verificando sessão...")
				
				// Verificar cookies diretamente
				const hasAuthCookies = 
					getCookieValue('sb-access-token') || 
					getCookieValue('sb-refresh-token') ||
					getCookieValue('sb-auth-state')
				
				if (!hasAuthCookies) {
					console.log("AuthProvider: Nenhum cookie de autenticação encontrado")
					setUser(null)
					setIsLoading(false)
					setSessionChecked(true)
					return
				}
				
				console.log("AuthProvider: Cookies de autenticação encontrados, buscando sessão")
				
				const supabase = getSupabase()
				const { data: { session }, error } = await supabase.auth.getSession()
				
				if (error) {
					console.error("AuthProvider: Erro ao obter sessão:", error)
					setAuthError(error.message)
					setUser(null)
					setIsLoading(false)
					setSessionChecked(true)
					return
				}
				
				if (!session) {
					console.log("AuthProvider: Nenhuma sessão encontrada, tentando restaurar")
					
					try {
						// Tentar restaurar a sessão
						const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
						
						if (refreshError) {
							console.error("AuthProvider: Erro ao restaurar sessão:", refreshError)
							setAuthError(refreshError.message)
							setUser(null)
							setIsLoading(false)
							setSessionChecked(true)
							return
						}
						
						if (!refreshData.session) {
							console.log("AuthProvider: Não foi possível restaurar a sessão")
							setUser(null)
							setIsLoading(false)
							setSessionChecked(true)
							return
						}
						
						console.log("AuthProvider: Sessão restaurada com sucesso")
						
						// Buscar dados do usuário
						const { data: userData, error: userError } = await supabase
							.from('users')
							.select('*')
							.eq('id', refreshData.session.user.id)
							.single()
						
						if (userError) {
							console.error("AuthProvider: Erro ao buscar dados do usuário:", userError)
							setAuthError(userError.message)
							setUser(null)
							setIsLoading(false)
							setSessionChecked(true)
							return
						}
						
						// Definir usuário
						setUser(userData)
						
						setIsLoading(false)
						setSessionChecked(true)
						return
					} catch (error) {
						console.error("AuthProvider: Erro ao restaurar sessão:", error)
						setUser(null)
						setIsLoading(false)
						setSessionChecked(true)
						return
					}
				}
				
				console.log("AuthProvider: Sessão encontrada para usuário:", session.user.id)
				
				// Buscar dados completos do usuário
				const { data: userData, error: userError } = await supabase
					.from('users')
					.select('*')
					.eq('id', session.user.id)
					.single()
				
				if (userError) {
					console.error("AuthProvider: Erro ao buscar dados do usuário:", userError)
					setAuthError(userError.message)
					setUser(null)
					setIsLoading(false)
					setSessionChecked(true)
					return
				}
				
				// Definir usuário
				setUser(userData)
				
				setIsLoading(false)
				setSessionChecked(true)
			} catch (error) {
				console.error("AuthProvider: Erro ao verificar sessão:", error)
				setUser(null)
				setIsLoading(false)
				setSessionChecked(true)
			}
		}
		
		checkSession()
		
		return () => clearTimeout(timeoutId)
	}, [])
	
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
							
							// Tentar fazer login novamente usando os cookies
							try {
								console.log('AuthProvider - Tentando reautenticar com os cookies...')
								
								// Forçar uma nova autenticação usando os tokens dos cookies
								const accessToken = getCookieValue('sb-access-token')
								const refreshToken = getCookieValue('sb-refresh-token')
								
								if (accessToken && refreshToken) {
									const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
										access_token: accessToken,
										refresh_token: refreshToken
									})
									
									if (sessionError) {
										console.error('AuthProvider - Erro ao definir sessão com tokens dos cookies:', sessionError)
										setUser(null)
										setIsLoading(false)
										setSessionChecked(true)
										return null
									}
									
									if (sessionData.session) {
										console.log('AuthProvider - Sessão restaurada com tokens dos cookies:', {
											userId: sessionData.session.user.id,
											email: sessionData.session.user.email
										})
										
										// Buscar dados completos do usuário
										const { data: userData, error: userError } = await supabase
											.from('users')
											.select('*')
											.eq('id', sessionData.session.user.id)
											.single()
										
										if (userError) {
											console.error('AuthProvider - Erro ao buscar dados do usuário após restaurar sessão:', userError)
										}
										
										if (userData) {
											setUser(userData)
											setIsLoading(false)
											setSessionChecked(true)
											return sessionData.session
										}
									}
								} else {
									console.log('AuthProvider - Tokens não encontrados nos cookies')
								}
							} catch (reAuthError) {
								console.error('AuthProvider - Erro ao reautenticar com cookies:', reAuthError)
							}
							
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
							
							if (userData) {
								setUser(userData)
								setIsLoading(false)
								setSessionChecked(true)
								return refreshData.session
							}
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
			
			if (userData) {
				setUser(userData)
				setIsLoading(false)
				setSessionChecked(true)
				return session
			}
			
			setUser(null)
			setIsLoading(false)
			setSessionChecked(true)
			return null
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
		// Se estamos em uma página de autenticação, não precisamos verificar a sessão
		if (typeof window !== 'undefined') {
			const path = window.location.pathname
			const isAuthPath = path.includes('/auth/login') || path.includes('/auth/register')
			
			if (!isAuthPath) {
				checkCurrentSession()
			}
		}
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
				
				if (userData) {
					setUser(userData)
					setIsLoading(false)
					setSessionChecked(true)
				}
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
			// Usar window.location para evitar problemas com o router do Next.js
			window.location.href = '/'
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
			// Usar window.location para evitar problemas com o router do Next.js
			window.location.href = '/auth/login'
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
		authError,
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