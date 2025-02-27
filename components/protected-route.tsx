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
	
	useEffect(() => {
		async function checkAuth() {
			try {
				const supabase = getSupabase()
				const { data: { session } } = await supabase.auth.getSession()
				
				if (!session) {
					router.push(redirectTo)
					return
				}
				
				setIsAuthenticated(true)
			} catch (error) {
				console.error('Erro ao verificar autenticação:', error)
				router.push(redirectTo)
			} finally {
				setIsCheckingAuth(false)
			}
		}
		
		checkAuth()
	}, [router, redirectTo])
	
	// Compatibilidade com o AuthProvider existente
	useEffect(() => {
		if (!isLoading && !user) {
			router.push(redirectTo)
		}
	}, [user, isLoading, router, redirectTo])
	
	if (isLoading || isCheckingAuth) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		)
	}
	
	if (!user && !isAuthenticated) {
		return null // Não renderiza nada enquanto redireciona
	}
	
	return <>{children}</>
} 