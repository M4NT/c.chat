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
  
  // Verificar se o login foi bem-sucedido e redirecionar
  useEffect(() => {
    if (state.success) {
      console.log('Login bem-sucedido, redirecionando...')
      setLoginSuccess(true)
      
      // Verificar cookies para confirmar autenticação
      const hasCookies = document.cookie.includes('sb-access-token') || 
        document.cookie.includes('sb-auth-state')
      
      if (hasCookies) {
        console.log('Cookies de autenticação encontrados, prosseguindo com redirecionamento')
      } else {
        console.warn('Nenhum cookie de autenticação encontrado após login bem-sucedido')
      }
      
      // Tentar redirecionar com router.push primeiro
      try {
        router.push('/')
        
        // Fallback: usar window.location.href após um pequeno delay
        // Isso garante que o redirecionamento aconteça mesmo se router.push falhar
        setTimeout(() => {
          if (window.location.pathname.includes('/auth/login')) {
            console.log('Redirecionamento com router.push não funcionou, usando window.location')
            window.location.href = '/'
          }
        }, 500)
      } catch (error) {
        console.error('Erro ao redirecionar após login:', error)
        // Fallback direto para window.location
        window.location.href = '/'
      }
    }
  }, [state.success, router])

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
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              disabled={loginSuccess}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={loginSuccess}
            />
          </div>
          <LoginButton disabled={loginSuccess} />
          <div className="text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/auth/register" className="text-primary hover:underline">
              Registre-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

