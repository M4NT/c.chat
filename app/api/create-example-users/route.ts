import { NextResponse } from 'next/server'
import { createExampleUsers } from '@/app/lib/actions'

export async function GET() {
  try {
    const result = await createExampleUsers()
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Erro ao criar usuários de exemplo:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuários de exemplo' },
      { status: 500 }
    )
  }
} 