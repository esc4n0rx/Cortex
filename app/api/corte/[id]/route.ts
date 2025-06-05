// app/api/corte/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const corteId = parseInt(params.id)

    if (isNaN(corteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Buscar dados principais do corte
    const { data: corte, error: corteError } = await supabase
      .from('cortex_cortes')
      .select('*')
      .eq('id', corteId)
      .single()

    if (corteError) {
      return NextResponse.json({ 
        error: `Erro ao buscar corte: ${corteError.message}` 
      }, { status: 500 })
    }

    if (!corte) {
      return NextResponse.json({ error: 'Corte não encontrado' }, { status: 404 })
    }

    // Buscar materiais cortados
    const { data: materiais, error: materiaisError } = await supabase
      .from('cortex_materiais_cortados')
      .select('*')
      .eq('corte_id', corteId)
      .order('total_cortado', { ascending: false })

    if (materiaisError) {
      console.error('Erro ao buscar materiais cortados:', materiaisError)
    }

    // Buscar separadores
    const { data: separadores, error: separadoresError } = await supabase
      .from('cortex_separadores_corte')
      .select('*')
      .eq('corte_id', corteId)
      .order('percentual_corte', { ascending: false })

    if (separadoresError) {
      console.error('Erro ao buscar separadores:', separadoresError)
    }

    return NextResponse.json({
      corte,
      materiais: materiais || [],
      separadores: separadores || []
    })

  } catch (error) {
    console.error('Erro ao buscar detalhes do corte:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}