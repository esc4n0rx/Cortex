// app/api/corte/gerar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface EstoqueConsolidado {
  material: number
  estoque_total: number
  descricao?: string
}

interface DemandaItem {
  material: number
  quant_nt: number
  numero_nt: number
  nome_usuario?: string
  item_finalizado?: string
  dt_producao?: string
  desc_material?: string
  setor?: string
  usuario?: string
}

interface CorteResultado {
  material: number
  descricao: string
  total_cortado: number
  linhas_cortadas: number
  usuarios_cortaram: string[]
}

interface SeparadorCorte {
  usuario: string
  nome_usuario: string
  total_atendido: number
  total_cortado: number
  percentual_corte: number
}

export async function POST(request: NextRequest) {
  try {
    const { setor, data } = await request.json()

    if (!setor || !data) {
      return NextResponse.json({ 
        error: 'Setor e data são obrigatórios' 
      }, { status: 400 })
    }

    // Determinar o código do depósito baseado no setor
    const depositoCodigo = setor === 'Mercearia' ? 'DP01' : 'DP40'
    
    console.log(`Iniciando cálculo de corte para ${setor} (${depositoCodigo}) na data ${data}`)

    // 1. VALIDAR SE TEM DADOS DISPONÍVEIS
    const { data: estoqueCount, error: estoqueCountError } = await supabase
      .from('cortex_estoque')
      .select('id', { count: 'exact' })
      .eq('dep', depositoCodigo)

    const { data: demandaCount, error: demandaCountError } = await supabase
      .from('cortex_demanda')
      .select('id', { count: 'exact' })
      .eq('deposito', depositoCodigo)

    if (estoqueCountError || demandaCountError) {
      return NextResponse.json({ 
        error: 'Erro ao verificar dados disponíveis' 
      }, { status: 500 })
    }

    console.log(`Dados disponíveis - Estoque: ${estoqueCount?.length || 0}, Demanda: ${demandaCount?.length || 0}`)

    if (!estoqueCount || estoqueCount.length === 0) {
      return NextResponse.json({ 
        error: 'Não há dados de estoque disponíveis para este setor' 
      }, { status: 400 })
    }

    if (!demandaCount || demandaCount.length === 0) {
      return NextResponse.json({ 
        error: 'Não há dados de demanda disponíveis para este setor' 
      }, { status: 400 })
    }

    // 2. CONSOLIDAR ESTOQUE POR MATERIAL - SEM FILTROS RESTRITIVOS
    console.log('Consolidando estoque por material...')
    const { data: estoqueData, error: estoqueError } = await supabase
      .from('cortex_estoque')
      .select('material, estoque_disponivel, texto_breve_material')
      .eq('dep', depositoCodigo)
      .not('material', 'is', null)

    if (estoqueError) {
      console.error('Erro ao buscar estoque:', estoqueError)
      return NextResponse.json({ 
        error: `Erro ao buscar estoque: ${estoqueError.message}` 
      }, { status: 500 })
    }

    // Consolidar estoque por material (somar estoques, incluindo zeros)
    const estoqueConsolidado = new Map<number, EstoqueConsolidado>()
    
    estoqueData?.forEach(item => {
      if (item.material !== null && item.material !== undefined) {
        const estoqueValue = item.estoque_disponivel || 0 // Incluir zeros
        const existing = estoqueConsolidado.get(item.material)
        if (existing) {
          existing.estoque_total += estoqueValue
        } else {
          estoqueConsolidado.set(item.material, {
            material: item.material,
            estoque_total: estoqueValue,
            descricao: item.texto_breve_material || ''
          })
        }
      }
    })

    console.log(`Estoque consolidado: ${estoqueConsolidado.size} materiais únicos`)

    // 3. BUSCAR TODA A DEMANDA - SEM LIMITAÇÕES
    console.log('Buscando demanda completa...')
    
    // Buscar com paginação para garantir que pegamos todos os dados
    let allDemandaData: any[] = []
    const PAGE_SIZE = 1000
    let page = 0
    let hasMoreData = true

    while (hasMoreData) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data: demandaPage, error: demandaError } = await supabase
        .from('cortex_demanda')
        .select(`
          material, 
          quant_nt, 
          numero_nt, 
          nome_usuario, 
          item_finalizado, 
          dt_producao, 
          desc_material,
          setor,
          usuario
        `)
        .eq('deposito', depositoCodigo)
        .not('material', 'is', null)
        .not('quant_nt', 'is', null)
        .range(from, to)
        .order('numero_nt')

      if (demandaError) {
        console.error('Erro ao buscar demanda:', demandaError)
        return NextResponse.json({ 
          error: `Erro ao buscar demanda: ${demandaError.message}` 
        }, { status: 500 })
      }

      if (!demandaPage || demandaPage.length === 0) {
        hasMoreData = false
      } else {
        allDemandaData = allDemandaData.concat(demandaPage)
        page++
        
        // Se retornou menos que o page size, chegamos no fim
        if (demandaPage.length < PAGE_SIZE) {
          hasMoreData = false
        }
      }

      console.log(`Página ${page}: ${demandaPage?.length || 0} registros, Total acumulado: ${allDemandaData.length}`)
    }

    console.log(`Demanda total carregada: ${allDemandaData.length} linhas`)

    if (allDemandaData.length === 0) {
      return NextResponse.json({ 
        error: 'Não há dados de demanda para processar' 
      }, { status: 400 })
    }

    // 4. PROCESSAR DEMANDA LINHA POR LINHA - LÓGICA SIMPLIFICADA
    const cortesPorMaterial = new Map<number, CorteResultado>()
    const cortePorSeparador = new Map<string, SeparadorCorte>()
    
    let volumeTotal = 0
    let volumeOk = 0
    let volumeAtendido = 0
    let volumeCortado = 0

    // Cache para NTs e usuários
    const ntUsuarioCache = new Map<number, string>()

    // Primeiro pass: mapear usuários por NT
    allDemandaData.forEach(item => {
      if (item.numero_nt && (item.nome_usuario || item.usuario)) {
        const usuario = item.nome_usuario || item.usuario
        if (!ntUsuarioCache.has(item.numero_nt)) {
          ntUsuarioCache.set(item.numero_nt, usuario)
        }
      }
    })

    console.log(`Cache de usuários por NT: ${ntUsuarioCache.size} NTs mapeadas`)

    // Segundo pass: processar cada linha
    allDemandaData.forEach((item, index) => {
      if (index % 1000 === 0) {
        console.log(`Processando linha ${index + 1}/${allDemandaData.length}`)
      }

      volumeTotal++

      // Verificar se existe no estoque (mesmo que seja zero)
      const estoque = estoqueConsolidado.get(item.material!)
      if (!estoque) {
        // Material não existe no cadastro de estoque - pular
        return
      }

      volumeOk++

      // Verificar status da linha
      const foiFinalizado = item.item_finalizado === 'X'
      const foiCortado = item.dt_producao === '1900-01-01' || 
                         item.dt_producao === '01/01/1900' ||
                         item.dt_producao === '1900-01-01T00:00:00.000Z'

      // Identificar usuário responsável
      let usuarioResponsavel = item.nome_usuario || item.usuario || ''
      if (!usuarioResponsavel && item.numero_nt) {
        usuarioResponsavel = ntUsuarioCache.get(item.numero_nt) || ''
      }

      if (foiFinalizado && !foiCortado) {
        // ATENDIDO
        volumeAtendido++
        
        if (usuarioResponsavel) {
          if (!cortePorSeparador.has(usuarioResponsavel)) {
            cortePorSeparador.set(usuarioResponsavel, {
              usuario: usuarioResponsavel,
              nome_usuario: usuarioResponsavel,
              total_atendido: 0,
              total_cortado: 0,
              percentual_corte: 0
            })
          }
          cortePorSeparador.get(usuarioResponsavel)!.total_atendido += (item.quant_nt || 0)
        }
      } else if (foiCortado) {
        // CORTADO
        volumeCortado++

        // Registrar corte por material
        if (!cortesPorMaterial.has(item.material!)) {
          cortesPorMaterial.set(item.material!, {
            material: item.material!,
            descricao: item.desc_material || estoque.descricao || '',
            total_cortado: 0,
            linhas_cortadas: 0,
            usuarios_cortaram: []
          })
        }

        const corteInfo = cortesPorMaterial.get(item.material!)!
        corteInfo.total_cortado += (item.quant_nt || 0)
        corteInfo.linhas_cortadas += 1
        
        if (usuarioResponsavel && !corteInfo.usuarios_cortaram.includes(usuarioResponsavel)) {
          corteInfo.usuarios_cortaram.push(usuarioResponsavel)
        }

        // Registrar corte por separador
        if (usuarioResponsavel) {
          if (!cortePorSeparador.has(usuarioResponsavel)) {
            cortePorSeparador.set(usuarioResponsavel, {
              usuario: usuarioResponsavel,
              nome_usuario: usuarioResponsavel,
              total_atendido: 0,
              total_cortado: 0,
              percentual_corte: 0
            })
          }
          cortePorSeparador.get(usuarioResponsavel)!.total_cortado += (item.quant_nt || 0)
        }
      }
    })

    // Calcular percentuais dos separadores
    cortePorSeparador.forEach(separador => {
      const totalOperacoes = separador.total_atendido + separador.total_cortado
      if (totalOperacoes > 0) {
        separador.percentual_corte = (separador.total_cortado / totalOperacoes) * 100
      }
    })

    // Calcular percentual geral do setor
    const percentualCorteSetor = volumeOk > 0 ? (volumeCortado / volumeOk) * 100 : 0

    console.log(`Processamento concluído:`)
    console.log(`- Volume Total: ${volumeTotal}`)
    console.log(`- Volume OK: ${volumeOk}`)
    console.log(`- Volume Atendido: ${volumeAtendido}`)
    console.log(`- Volume Cortado: ${volumeCortado}`)
    console.log(`- Percentual Corte: ${percentualCorteSetor.toFixed(2)}%`)

    // Ordenar resultados
    const cortesMateriais = Array.from(cortesPorMaterial.values())
      .sort((a, b) => b.total_cortado - a.total_cortado)

    const cortesSeparadores = Array.from(cortePorSeparador.values())
      .filter(sep => (sep.total_atendido + sep.total_cortado) > 0) // Só separadores que tiveram atividade
      .sort((a, b) => b.percentual_corte - a.percentual_corte)

    // Gravar resultado do corte
    const resultadoCorte = {
      setor,
      data,
      deposito_codigo: depositoCodigo,
      volume_total: volumeTotal,
      volume_ok: volumeOk,
      volume_atendido: volumeAtendido,
      volume_cortado: volumeCortado,
      percentual_corte: Number(percentualCorteSetor.toFixed(2)),
      total_materiais_cortados: cortesMateriais.length,
      total_separadores: cortesSeparadores.length,
      data_processamento: new Date().toISOString()
    }

    // Salvar no banco
    const { data: corteId, error: corteError } = await supabase
      .from('cortex_cortes')
      .insert(resultadoCorte)
      .select('id')
      .single()

    if (corteError) {
      console.error('Erro ao salvar corte:', corteError)
    } else {
      console.log(`Corte salvo com ID: ${corteId?.id}`)
    }

    const response = {
      success: true,
      setor,
      data,
      resumo: {
        volume_total: volumeTotal,
        volume_ok: volumeOk,
        volume_atendido: volumeAtendido,
        volume_cortado: volumeCortado,
        percentual_corte: Number(percentualCorteSetor.toFixed(2)),
        meta_percentual: setor === 'Mercearia' ? 3 : 2,
        status_meta: percentualCorteSetor <= (setor === 'Mercearia' ? 3 : 2) ? 'OK' : 'ACIMA'
      },
      materiais_cortados: cortesMateriais.slice(0, 20), // Top 20
      separadores: cortesSeparadores,
      corte_id: corteId?.id,
      debug: {
        total_demanda_processada: allDemandaData.length,
        total_materiais_estoque: estoqueConsolidado.size,
        cache_usuarios_nt: ntUsuarioCache.size
      }
    }

    // Salvar detalhes se conseguiu salvar o corte principal
    if (corteId?.id) {
      // Salvar materiais cortados
      if (cortesMateriais.length > 0) {
        const materiaisParaSalvar = cortesMateriais.map(material => ({
          corte_id: corteId.id,
          material: material.material,
          descricao: material.descricao,
          total_cortado: material.total_cortado,
          linhas_cortadas: material.linhas_cortadas,
          usuarios_cortaram: material.usuarios_cortaram.join(', ')
        }))

        const { error: materiaisError } = await supabase
          .from('cortex_materiais_cortados')
          .insert(materiaisParaSalvar)

        if (materiaisError) {
          console.error('Erro ao salvar materiais cortados:', materiaisError)
        }
      }

      // Salvar separadores
      if (cortesSeparadores.length > 0) {
        const separadoresParaSalvar = cortesSeparadores.map(sep => ({
          corte_id: corteId.id,
          usuario: sep.usuario,
          nome_usuario: sep.nome_usuario,
          total_atendido: sep.total_atendido,
          total_cortado: sep.total_cortado,
          percentual_corte: Number(sep.percentual_corte.toFixed(2))
        }))

        const { error: separadoresError } = await supabase
          .from('cortex_separadores_corte')
          .insert(separadoresParaSalvar)

        if (separadoresError) {
          console.error('Erro ao salvar separadores:', separadoresError)
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro no algoritmo de corte:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}