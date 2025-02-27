'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, getSupabase, signIn, signOut, signUp } from '@/lib/supabase'
import { Database } from '@/types/database.types'

type User = Database['public']['Tables']['users']['Row']

interface AuthContextType {
	user: User | null
	isLoading: boolean
	signUp: (email: string, password: string, name: string) => Promise<void>
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()
	
	// Verificar se o usuário está autenticado ao carregar a página
	useEffect(() => {
		const checkUser = async () => {
			try {
				const currentUser = await getCurrentUser()
				setUser(currentUser)
			} catch (error) {
				console.error('Erro ao verificar usuário:', error)
				setUser(null)
			} finally {
				setIsLoading(false)
			}
		}
		
		checkUser()
		
		// Configurar listener para mudanças de autenticação
		const supabase = getSupabase()
		
		const { data: { subscription } } = supabase.auth.onAuthStateChange(
			async (event, session) => {
				if (event === 'SIGNED_IN' && session?.user) {
					const currentUser = await getCurrentUser()
					setUser(currentUser)
				} else if (event === 'SIGNED_OUT') {
					setUser(null)
				}
			}
		)
		
		return () => {
			subscription.unsubscribe()
		}
	}, [])
	
	// Função para registrar um novo usuário
	const handleSignUp = async (email: string, password: string, name: string) => {
		setIsLoading(true)
		try {
			await signUp(email, password, name)
			router.push('/auth/login')
		} catch (error) {
			console.error('Erro ao registrar:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	// Função para fazer login
	const handleSignIn = async (email: string, password: string) => {
		setIsLoading(true)
		try {
			await signIn(email, password)
			const currentUser = await getCurrentUser()
			setUser(currentUser)
			router.push('/')
		} catch (error) {
			console.error('Erro ao fazer login:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	// Função para fazer logout
	const handleSignOut = async () => {
		setIsLoading(true)
		try {
			await signOut()
			setUser(null)
			router.push('/auth/login')
		} catch (error) {
			console.error('Erro ao fazer logout:', error)
			throw error
		} finally {
			setIsLoading(false)
		}
	}
	
	const value = {
		user,
		isLoading,
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