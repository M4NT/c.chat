'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Loader2 } from 'lucide-react'
import { getSupabase, checkSupabaseConnection } from '@/lib/supabase'

interface ProtectedRouteProps {
	children: React.ReactNode
	redirectTo?: string
}

export function ProtectedRoute({ 
	children, 
	redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
	const { user, isLoading, sessionChecked } = useAuth()
	const router = useRouter()
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [localSessionChecked, setLocalSessionChecked] = useState(false)
	const [checkCount, setCheckCount] = useState(0)
	const [manualAuthCheck, setManualAuthCheck] = useState(false)
	const [redirectInitiated, setRedirectInitiated] = useState(false)
	const [isConnectionOk, setIsConnectionOk] = useState(true)
	const [timeoutReached, setTimeoutReached] = useState(false)
	
	// Verificação manual de cookies
	useEffect(() => {
		// Verificar cookies diretamente
		const hasCookies = document.cookie.includes('sb-access-token') || 
			document.cookie.includes('sb-auth-state');
		
		if (hasCookies) {
			console.log('ProtectedRoute - Cookies de autenticação encontrados diretamente');
			setManualAuthCheck(true);
		} else {
			console.log('ProtectedRoute - Nenhum cookie de autenticação encontrado diretamente');
			setManualAuthCheck(false);
		}
		
		// Se o AuthProvider já verificou a sessão, não precisamos verificar novamente
		if (sessionChecked) {
			setIsCheckingAuth(false);
			setLocalSessionChecked(true);
		}
	}, [sessionChecked]);
	
	// Adicionando logs para debug
	useEffect(() => {
		console.log('ProtectedRoute - Estado atual:', { 
			user: user ? {
				id: user.id,
				email: user.email,
				name: user.name
			} : 'Ausente', 
			isLoading, 
			isCheckingAuth, 
			isAuthenticated,
			localSessionChecked,
			checkCount,
			manualAuthCheck
		})
	}, [user, isLoading, isCheckingAuth, isAuthenticated, localSessionChecked, checkCount, manualAuthCheck])
	
	// Verificação via Supabase diretamente
	useEffect(() => {
		async function checkAuth() {
			console.log('ProtectedRoute - Verificando autenticação via Supabase...')
			try {
				const supabase = getSupabase()
				const { data: { session }, error } = await supabase.auth.getSession()
				
				if (error) {
					console.error('ProtectedRoute - Erro ao obter sessão:', error)
					setIsAuthenticated(false)
					setIsCheckingAuth(false)
					setLocalSessionChecked(true)
					return
				}
				
				if (!session) {
					console.log('ProtectedRoute - Nenhuma sessão encontrada')
					
					// Se temos cookies mas não temos sessão, tentar restaurar a sessão
					if (manualAuthCheck) {
						console.log('ProtectedRoute - Cookies encontrados, tentando restaurar sessão...')
						try {
							// Tentar recuperar a sessão
							const { error: refreshError } = await supabase.auth.refreshSession()
							
							if (refreshError) {
								console.error('ProtectedRoute - Erro ao restaurar sessão:', refreshError)
								setIsAuthenticated(false)
								setIsCheckingAuth(false)
								setLocalSessionChecked(true)
								return
							}
							
							// Verificar novamente se a sessão foi restaurada
							const { data: { session: refreshedSession } } = await supabase.auth.getSession()
							
							if (!refreshedSession) {
								console.log('ProtectedRoute - Não foi possível restaurar a sessão')
								setIsAuthenticated(false)
								setIsCheckingAuth(false)
								setLocalSessionChecked(true)
								return
							}
							
							console.log('ProtectedRoute - Sessão restaurada com sucesso')
							setIsAuthenticated(true)
							setIsCheckingAuth(false)
							setLocalSessionChecked(true)
							return
						} catch (refreshError) {
							console.error('ProtectedRoute - Erro ao tentar restaurar sessão:', refreshError)
							setIsAuthenticated(false)
							setIsCheckingAuth(false)
							setLocalSessionChecked(true)
							return
						}
					} else {
						setIsAuthenticated(false)
						setIsCheckingAuth(false)
						setLocalSessionChecked(true)
						return
					}
				}
				
				console.log('ProtectedRoute - Sessão válida encontrada:', {
					userId: session.user.id,
					email: session.user.email,
					expiresAt: session.expires_at 
						? new Date(session.expires_at * 1000).toLocaleString()
						: 'Não definido',
					accessToken: session.access_token ? `${session.access_token.substring(0, 10)}...` : 'Não disponível'
				})
				
				// Verificar se o token está próximo de expirar e renovar se necessário
				if (session.expires_at) {
					const expiresAt = new Date(session.expires_at * 1000)
					const now = new Date()
					const timeUntilExpiry = expiresAt.getTime() - now.getTime()
					
					// Se o token expira em menos de 5 minutos, renovar
					if (timeUntilExpiry < 5 * 60 * 1000) {
						console.log('ProtectedRoute - Token próximo de expirar, renovando...')
						const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
						
						if (refreshError) {
							console.error('ProtectedRoute - Erro ao renovar token:', refreshError)
						} else if (refreshData.session) {
							console.log('ProtectedRoute - Token renovado com sucesso')
						}
					}
				}
				
				setIsAuthenticated(true)
				setIsCheckingAuth(false)
				setLocalSessionChecked(true)
			} catch (error) {
				console.error('ProtectedRoute - Erro ao verificar autenticação:', error)
				setIsAuthenticated(false)
				setIsCheckingAuth(false)
				setLocalSessionChecked(true)
			}
		}
		
		checkAuth()
	}, [checkCount, manualAuthCheck])
	
	// Verificação final e redirecionamento se necessário
	useEffect(() => {
		// Verificar se estamos na página de login antes de tentar redirecionar
		if (typeof window !== 'undefined' && window.location.pathname.includes('/auth/login')) {
			console.log("ProtectedRoute - Estamos na página de login, não precisamos verificar autenticação")
			setIsCheckingAuth(false)
			setRedirectInitiated(true)
			return
		}
		
		// Só tomar decisão quando ambas as verificações estiverem concluídas
		if (!isLoading && (localSessionChecked || sessionChecked)) {
			console.log('ProtectedRoute - Verificações concluídas:', {
				userFromAuth: user ? 'Presente' : 'Ausente',
				isAuthenticated,
				manualAuthCheck,
				redirectInitiated
			})
			
			// Se não estiver autenticado por nenhum dos métodos, redirecionar
			if (!user && !isAuthenticated && !manualAuthCheck && !redirectInitiated) {
				// Se já tentamos menos de 2 vezes, tentar novamente
				if (checkCount < 2) {
					console.log(`ProtectedRoute - Tentativa ${checkCount + 1} de verificação de autenticação...`)
					setTimeout(() => {
						setCheckCount(prev => prev + 1)
						setIsCheckingAuth(true)
						setLocalSessionChecked(false)
					}, 500) // Reduzido para 0.5 segundo
				} else {
					console.log('ProtectedRoute - Usuário não autenticado após múltiplas tentativas, redirecionando...')
					
					// Marcar que o redirecionamento foi iniciado para evitar múltiplos redirecionamentos
					setRedirectInitiated(true)
					
					// Verificar cookies antes de redirecionar
					const hasCookies = document.cookie.includes('sb-access-token') || 
						document.cookie.includes('sb-auth-state');
					
					if (!hasCookies) {
						// Adicionar um pequeno delay antes de redirecionar
						// Isso dá tempo para que qualquer atualização de estado pendente seja concluída
						setTimeout(() => {
							console.log('ProtectedRoute - Executando redirecionamento para', redirectTo)
							window.location.href = redirectTo
						}, 300) // Reduzido para 300ms
					} else {
						console.log("ProtectedRoute - Cookies de autenticação encontrados, tentando restaurar sessão antes de redirecionar")
						// Dar mais tempo para a sessão ser restaurada
						setTimeout(() => {
							if (!user) {
								console.log("ProtectedRoute - Sessão não restaurada após timeout, redirecionando para login")
								window.location.href = redirectTo
							} else {
								setIsCheckingAuth(false)
							}
						}, 500) // Reduzido para 0.5 segundo
					}
				}
			} else {
				// Se chegou aqui, o usuário está autenticado ou o timeout foi atingido
				setIsCheckingAuth(false)
			}
		}
	}, [user, isLoading, isAuthenticated, localSessionChecked, sessionChecked, router, redirectTo, checkCount, manualAuthCheck, redirectInitiated])
	
	// Verificar conexão com Supabase
	useEffect(() => {
		const checkConnection = async () => {
			const isConnected = await checkSupabaseConnection()
			setIsConnectionOk(isConnected)
			
			if (!isConnected) {
				console.error("Não foi possível conectar ao Supabase. Continuando com funcionalidade limitada.")
			}
		}
		
		checkConnection()
		
		// Definir um timeout para evitar carregamento infinito
		const timeoutId = setTimeout(() => {
			console.log("Timeout de autenticação atingido. Permitindo acesso com funcionalidade limitada.")
			setTimeoutReached(true)
			setIsCheckingAuth(false)
			
			// Forçar a exibição do conteúdo mesmo sem autenticação confirmada
			if (isCheckingAuth) {
				console.log("Forçando exibição do conteúdo após timeout")
				setIsCheckingAuth(false)
				setRedirectInitiated(true) // Evitar redirecionamentos após timeout
			}
		}, 1000) // Reduzido para 1 segundo
		
		return () => clearTimeout(timeoutId)
	}, [isCheckingAuth])
	
	// Verificação adicional para evitar loop infinito
	useEffect(() => {
		// Se estamos verificando por mais de 5 segundos, forçar a parada
		const forceStopId = setTimeout(() => {
			if (isCheckingAuth) {
				console.log("Forçando parada da verificação de autenticação após 2 segundos")
				setIsCheckingAuth(false)
				setRedirectInitiated(true) // Evitar redirecionamentos após timeout
				setTimeoutReached(true) // Marcar que o timeout foi atingido
			}
		}, 1000) // Reduzido para 1 segundo
		
		return () => clearTimeout(forceStopId)
	}, [isCheckingAuth])
	
	// Se o usuário não estiver carregando e não estiver autenticado, redirecionar para login
	useEffect(() => {
		// Evitar loops de redirecionamento verificando se já estamos na página de login
		if (typeof window !== 'undefined' && window.location.pathname.includes('/auth/login')) {
			console.log("Já estamos na página de login, evitando redirecionamento")
			setIsCheckingAuth(false)
			return
		}
		
		// Forçar exibição do conteúdo após 1 segundo, independentemente do estado de autenticação
		const forceShowId = setTimeout(() => {
			if (isCheckingAuth) {
				console.log("Forçando exibição do conteúdo após 1 segundo")
				setIsCheckingAuth(false)
				setTimeoutReached(true)
				setRedirectInitiated(true) // Evitar redirecionamentos após timeout
			}
		}, 500) // Reduzido para 0.5 segundos
		
		if (!isLoading && !user && !timeoutReached) {
			console.log("Usuário não autenticado, redirecionando para login")
			
			// Verificar cookies antes de redirecionar
			const hasCookies = document.cookie.includes('sb-access-token') || 
				document.cookie.includes('sb-auth-state');
			
			if (!hasCookies) {
				// Só redirecionar se não houver cookies de autenticação
				console.log("Nenhum cookie de autenticação encontrado, redirecionando para login")
				// Usar window.location para evitar problemas com o router do Next.js
				window.location.href = redirectTo
			} else {
				console.log("Cookies de autenticação encontrados, tentando restaurar sessão antes de redirecionar")
				// Dar mais tempo para a sessão ser restaurada
				setTimeout(() => {
					if (!user) {
						console.log("Sessão não restaurada após timeout, redirecionando para login")
						// Usar window.location para evitar problemas com o router do Next.js
						window.location.href = redirectTo
					}
				}, 1000) // Reduzido para 1 segundo
			}
		} else if (!isLoading || timeoutReached) {
			// Se o usuário estiver carregado ou o timeout foi atingido, parar de verificar
			setIsCheckingAuth(false)
		}
		
		return () => clearTimeout(forceShowId)
	}, [isLoading, user, router, timeoutReached, redirectTo])
	
	// Mostrar tela de carregamento enquanto verifica autenticação
	if (isCheckingAuth) {
		console.log("ProtectedRoute - Exibindo loading...")
		return (
			<div className="flex h-screen w-full items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-sm text-muted-foreground">Carregando...</p>
				</div>
			</div>
		)
	}
	
	// Se o timeout foi atingido ou a conexão falhou, mostrar aviso mas permitir acesso
	if (timeoutReached || !isConnectionOk) {
		// Remover o aviso de autenticação e mostrar apenas o conteúdo
		return <>{children}</>
	}
	
	// Se chegou aqui, o usuário está autenticado ou o timeout foi atingido
	return <>{children}</>
} 