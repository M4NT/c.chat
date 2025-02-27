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
import { registerAction } from "@/app/lib/actions"

// Componente para o botão de registro com estado de carregamento
function RegisterButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Criar conta
    </Button>
  )
}

// Função para validar senhas iguais
function validatePasswords(prevState: any, formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  
  if (password !== confirmPassword) {
    return { error: 'As senhas não coincidem' }
  }
  
  // Se as senhas coincidirem, prosseguir com o registro
  return registerAction(prevState, formData)
}

export default function RegisterPage() {
  const { toast } = useToast()
  const router = useRouter()
  // @ts-ignore - Ignorando erro de tipagem do useFormState com Server Actions
  const [state, formAction] = useFormState(validatePasswords, { error: null })
  
  // Redirecionar quando o registro for bem-sucedido
  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Conta criada com sucesso",
        description: "Você será redirecionado para a página de login.",
      })
      // Pequeno atraso para mostrar o toast antes de redirecionar
      const timeout = setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
      
      return () => clearTimeout(timeout)
    }
  }, [state?.success, router, toast])
  
  // Mostrar toast de erro quando houver erro no estado
  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar conta",
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
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Preencha os dados abaixo para criar sua conta</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="João Silva"
                required
              />
            </div>
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
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
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
            <RegisterButton />
            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{" "}
              <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                Fazer login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

