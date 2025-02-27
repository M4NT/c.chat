import type React from "react"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

export const metadata = {
  title: 'Chat App',
  description: 'Aplicativo de mensagens em tempo real',
  generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
