"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { initSupabase } from "@/lib/supabase"
import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"

type Config = {
  supabaseUrl: string
  supabaseKey: string
  whatsappToken: string
}

type ConfigContextType = {
  config: Config
  setConfig: (config: Partial<Config>) => void
  isConfigValid: {
    supabase: boolean
    whatsapp: boolean
  }
  setIsConfigValid: (valid: Partial<{ supabase: boolean; whatsapp: boolean }>) => void
}

const ConfigContext = createContext<ConfigContextType | null>(null)

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) throw new Error("useConfig must be used within a ConfigProvider")
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<Config>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    whatsappToken: "",
  })

  const [isConfigValid, setIsConfigValidState] = useState({
    supabase: false,
    whatsapp: false,
  })

  const setConfig = (newConfig: Partial<Config>) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }))
  }

  const setIsConfigValid = (valid: Partial<{ supabase: boolean; whatsapp: boolean }>) => {
    setIsConfigValidState((prev) => ({ ...prev, ...valid }))
  }

  // Inicializar o cliente Supabase quando o componente for montado
  useEffect(() => {
    if (config.supabaseUrl && config.supabaseKey) {
      try {
        initSupabase()
        setIsConfigValid({ supabase: true })
      } catch (error) {
        console.error("Erro ao inicializar Supabase:", error)
        setIsConfigValid({ supabase: false })
      }
    }
  }, [config.supabaseUrl, config.supabaseKey])

  return (
    <ConfigContext.Provider value={{ config, setConfig, isConfigValid, setIsConfigValid }}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ConfigContext.Provider>
  )
}

