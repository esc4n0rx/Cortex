import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const material = searchParams.get('material')

    let query = supabase
      .from('cortex_cadastro_itens')
      .select('*', { count: 'exact' })
      .eq('status', 'ativo')

    // Filtros
    if (material) {
      query = query.eq('material', parseInt(material))
    } else if (search) {
      query = query.or(`descricao.ilike.%${search}%,material.eq.${parseInt(search) || 0}`)
    }

    // Paginação
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .order('material', { ascending: true })
      .order('um', { ascending: true })

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
    console.error('Erro ao buscar itens:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, material, descricao, um, qtd_por_caixa, contador } = body

    if (!id || !material || !descricao || !um || !qtd_por_caixa) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: id, material, descricao, um, qtd_por_caixa' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('cortex_cadastro_itens')
      .update({
        descricao,
        um: um.toUpperCase(),
        qtd_por_caixa: parseInt(qtd_por_caixa),
        contador: parseInt(contador) || 0
      })
      .eq('id', parseInt(id))
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Item atualizado com sucesso',
      data: data[0]
    })

  } catch (error) {
    console.error('Erro ao atualizar item:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    const { error } = await supabase
      .from('cortex_cadastro_itens')
      .update({ status: 'inativo' })
      .eq('id', parseInt(id))

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Item removido com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao remover item:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}