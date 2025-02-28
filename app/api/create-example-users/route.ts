import { NextResponse } from 'next/server'
import { createExampleUsers } from '@/app/lib/actions'

export async function GET() {
  try {
    console.log("API: Buscando usuários cadastrados...");
    const result = await createExampleUsers()
    
    console.log("API: Resultado da busca de usuários:", result);
    return NextResponse.json(result)
  } catch (error) {
    console.error("API: Erro ao buscar usuários:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Erro ao buscar usuários", 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
} 