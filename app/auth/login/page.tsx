"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useFormState, useFormStatus } from "react-dom"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { loginAction } from "@/app/lib/actions"
import { getSupabase } from "@/lib/supabase"

// Componente para o botão de login com estado de carregamento
function LoginButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        "Entrar"
      )}
    </Button>
  )
}

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  // @ts-ignore - Ignorando erro de tipagem do useFormState com Server Actions
  const [state, formAction] = useFormState(loginAction, { success: false, message: '' })
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [redirectAttempts, setRedirectAttempts] = useState(0)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  
  // Forçar exibição do formulário após um timeout, mesmo se a verificação de sessão demorar
  useEffect(() => {
    const forceShowFormTimeout = setTimeout(() => {
      if (isCheckingSession) {
        console.log('Timeout de verificação de sessão atingido, exibindo formulário de login')
        setIsCheckingSession(false)
      }
    }, 1000) // Reduzido para 1 segundo
    
    return () => clearTimeout(forceShowFormTimeout)
  }, [isCheckingSession])
  
  // Verificar sessão e redirecionar se já estiver autenticado
  useEffect(() => {
    async function checkSession() {
      try {
        console.log('Verificando sessão na página de login...')
        const supabase = getSupabase()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log('Usuário já autenticado, redirecionando para a página principal...')
          window.location.href = '/'
          return
        }
        
        console.log('Nenhuma sessão encontrada, exibindo formulário de login')
        setIsCheckingSession(false)
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        setIsCheckingSession(false)
      }
    }
    
    checkSession()
  }, [])
  
  // Verificar se o login foi bem-sucedido e redirecionar
  useEffect(() => {
    if (state.success && !loginSuccess && !isRedirecting) {
      console.log('Login bem-sucedido, preparando redirecionamento...')
      setLoginSuccess(true)
      
      // Verificar cookies para confirmar autenticação
      const hasCookies = document.cookie.includes('sb-access-token') || 
        document.cookie.includes('sb-auth-state')
      
      if (hasCookies) {
        console.log('Cookies de autenticação encontrados, prosseguindo com redirecionamento')
      } else {
        console.warn('Nenhum cookie de autenticação encontrado após login bem-sucedido')
      }
      
      // Dar um tempo para os cookies serem processados antes de redirecionar
      setTimeout(() => {
        console.log('Tentando redirecionar para a página principal...')
        setIsRedirecting(true)
        // Usar window.location para evitar problemas com o router do Next.js
        window.location.href = '/'
      }, 1000) // Reduzido para 1 segundo
    }
  }, [state.success, loginSuccess, isRedirecting])
  
  // Fallback para redirecionamento se o primeiro método não funcionar
  useEffect(() => {
    if (loginSuccess && redirectAttempts < 3 && !isRedirecting) {
      const timer = setTimeout(() => {
        // Verificar se ainda estamos na página de login
        if (window.location.pathname.includes('/auth/login')) {
          console.log(`Tentativa ${redirectAttempts + 1} de redirecionamento com window.location`)
          setRedirectAttempts(prev => prev + 1)
          setIsRedirecting(true)
          window.location.href = '/'
        }
      }, 1000 * (redirectAttempts + 1)) // Reduzido para 1 segundo * tentativas
      
      return () => clearTimeout(timer)
    }
  }, [loginSuccess, redirectAttempts, isRedirecting])
  
  // Redirecionamento forçado após 3 segundos se ainda estiver na página de login
  useEffect(() => {
    if (loginSuccess) {
      const forceRedirectTimer = setTimeout(() => {
        if (window.location.pathname.includes('/auth/login')) {
          console.log('Forçando redirecionamento após timeout')
          window.location.href = '/'
        }
      }, 3000) // Reduzido para 3 segundos
      
      return () => clearTimeout(forceRedirectTimer)
    }
  }, [loginSuccess])

  // Mostrar loading enquanto verifica a sessão
  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
          <Button 
            variant="outline" 
            onClick={() => setIsCheckingSession(false)}
            className="mt-4"
          >
            Continuar para o login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-muted-foreground">Entre com sua conta para continuar</p>
        </div>
        
        {state.message && !state.success && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        
        {loginSuccess && (
          <Alert>
            <AlertDescription>Login bem-sucedido! Redirecionando...</AlertDescription>
          </Alert>
        )}
        
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required />
          </div>
          <LoginButton disabled={loginSuccess} />
        </form>
        
        <div className="text-center text-sm">
          Não tem uma conta?{" "}
          <Link href="/auth/register" className="text-primary hover:underline">
            Registre-se
          </Link>
        </div>
      </div>
    </div>
  )
}

