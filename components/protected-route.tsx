'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './auth-provider'
import { Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface ProtectedRouteProps {
	children: React.ReactNode
	redirectTo?: string
}

export function ProtectedRoute({ 
	children, 
	redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
	const { user, isLoading } = useAuth()
	const router = useRouter()
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)
	const [isAuthenticated, setIsAuthenticated] = useState(false)
	const [sessionChecked, setSessionChecked] = useState(false)
	const [checkCount, setCheckCount] = useState(0)
	const [manualAuthCheck, setManualAuthCheck] = useState(false)
	
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
	}, []);
	
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
			sessionChecked,
			checkCount,
			manualAuthCheck
		})
	}, [user, isLoading, isCheckingAuth, isAuthenticated, sessionChecked, checkCount, manualAuthCheck])
	
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
					setSessionChecked(true)
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
								setSessionChecked(true)
								return
							}
							
							// Verificar novamente se a sessão foi restaurada
							const { data: { session: refreshedSession } } = await supabase.auth.getSession()
							
							if (!refreshedSession) {
								console.log('ProtectedRoute - Não foi possível restaurar a sessão')
								setIsAuthenticated(false)
								setIsCheckingAuth(false)
								setSessionChecked(true)
								return
							}
							
							console.log('ProtectedRoute - Sessão restaurada com sucesso')
							setIsAuthenticated(true)
							setIsCheckingAuth(false)
							setSessionChecked(true)
							return
						} catch (refreshError) {
							console.error('ProtectedRoute - Erro ao tentar restaurar sessão:', refreshError)
							setIsAuthenticated(false)
							setIsCheckingAuth(false)
							setSessionChecked(true)
							return
						}
					} else {
						setIsAuthenticated(false)
						setIsCheckingAuth(false)
						setSessionChecked(true)
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
				setSessionChecked(true)
			} catch (error) {
				console.error('ProtectedRoute - Erro ao verificar autenticação:', error)
				setIsAuthenticated(false)
				setIsCheckingAuth(false)
				setSessionChecked(true)
			}
		}
		
		checkAuth()
	}, [checkCount, manualAuthCheck])
	
	// Verificação final e redirecionamento se necessário
	useEffect(() => {
		// Só tomar decisão quando ambas as verificações estiverem concluídas
		if (!isLoading && sessionChecked) {
			console.log('ProtectedRoute - Verificações concluídas:', {
				userFromAuth: user ? 'Presente' : 'Ausente',
				isAuthenticated,
				manualAuthCheck
			})
			
			// Se não estiver autenticado por nenhum dos métodos, redirecionar
			if (!user && !isAuthenticated && !manualAuthCheck) {
				// Se já tentamos menos de 3 vezes, tentar novamente
				if (checkCount < 3) {
					console.log(`ProtectedRoute - Tentativa ${checkCount + 1} de verificação de autenticação...`)
					setTimeout(() => {
						setCheckCount(prev => prev + 1)
						setIsCheckingAuth(true)
						setSessionChecked(false)
					}, 1000) // Esperar 1 segundo antes de tentar novamente
				} else {
					console.log('ProtectedRoute - Usuário não autenticado após múltiplas tentativas, redirecionando...')
					
					// Adicionar um pequeno delay antes de redirecionar
					// Isso dá tempo para que qualquer atualização de estado pendente seja concluída
					setTimeout(() => {
						console.log('ProtectedRoute - Executando redirecionamento para', redirectTo)
						router.push(redirectTo)
					}, 1000)
				}
			}
		}
	}, [user, isLoading, isAuthenticated, sessionChecked, router, redirectTo, checkCount, manualAuthCheck])
	
	// Mostrar loading enquanto verifica autenticação
	if (isLoading || isCheckingAuth) {
		console.log('ProtectedRoute - Exibindo loading...')
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		)
	}
	
	// Se estiver autenticado por qualquer um dos métodos, renderizar o conteúdo protegido
	if (user || isAuthenticated || manualAuthCheck) {
		console.log('ProtectedRoute - Usuário autenticado, renderizando conteúdo protegido')
		return <>{children}</>
	}
	
	// Se não estiver autenticado, não renderiza nada (o redirecionamento já foi iniciado)
	console.log('ProtectedRoute - Não autenticado, aguardando redirecionamento...')
	return null
} 