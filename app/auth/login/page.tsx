"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useFormState, useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { loginAction } from "@/app/lib/actions"

// Componente para o botão de login com estado de carregamento
function LoginButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Entrar
    </Button>
  )
}

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  // @ts-ignore - Ignorando erro de tipagem do useFormState com Server Actions
  const [state, formAction] = useFormState(loginAction, { error: null })
  
  // Redirecionar quando o login for bem-sucedido
  useEffect(() => {
    if (state?.success) {
      router.push('/')
    }
  }, [state?.success, router])
  
  // Mostrar toast de erro quando houver erro no estado
  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: state.error,
      })
    }
  }, [state?.error, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/placeholder.svg" alt="Logo" width={48} height={48} className="rounded-lg" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com sua conta para continuar</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="exemplo@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button variant="link" className="px-0 text-sm" type="button">
                  Esqueceu a senha?
                </Button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            {state?.error && (
              <div className="text-sm text-destructive">
                {state.error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <LoginButton />
            <p className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/auth/register" className="text-primary underline-offset-4 hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

