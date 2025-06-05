// app/api/corte/historico/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const setor = searchParams.get('setor')
    const dataInicial = searchParams.get('data_inicial')
    const dataFinal = searchParams.get('data_final')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('cortex_cortes')
      .select('*', { count: 'exact' })

    // Filtros
    if (setor && setor !== 'todos') {
      query = query.eq('setor', setor)
    }

    if (dataInicial) {
      query = query.gte('data', dataInicial)
    }

    if (dataFinal) {
      query = query.lte('data', dataFinal)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('data', { ascending: false })
      .order('setor', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico de cortes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}