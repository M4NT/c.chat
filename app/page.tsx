"use client"

import { AppShell } from "@/components/app-shell"
import { ProtectedRoute } from "@/components/protected-route"

export default function Page() {
  return (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  )
}

