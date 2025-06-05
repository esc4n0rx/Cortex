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
    const { data: estoqueCount } = await supabase
      .from('cortex_estoque')
      .select('id', { count: 'exact' })
      .eq('dep', depositoCodigo)

    const { data: demandaCount } = await supabase
      .from('cortex_demanda')
      .select('id', { count: 'exact' })
      .eq('deposito', depositoCodigo)

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

    // 2. CONSOLIDAR ESTOQUE POR MATERIAL
    console.log('Consolidando estoque...')
    const { data: estoqueData, error: estoqueError } = await supabase
      .from('cortex_estoque')
      .select('material, estoque_disponivel, texto_breve_material')
      .eq('dep', depositoCodigo)
      .not('estoque_disponivel', 'is', null)

    if (estoqueError) {
      return NextResponse.json({ 
        error: `Erro ao buscar estoque: ${estoqueError.message}` 
      }, { status: 500 })
    }

    // Consolidar estoque por material (somar estoques do mesmo material)
    const estoqueConsolidado = new Map<number, EstoqueConsolidado>()
    
    estoqueData?.forEach(item => {
      if (item.material && item.estoque_disponivel) {
        const existing = estoqueConsolidado.get(item.material)
        if (existing) {
          existing.estoque_total += item.estoque_disponivel
        } else {
          estoqueConsolidado.set(item.material, {
            material: item.material,
            estoque_total: item.estoque_disponivel,
            descricao: item.texto_breve_material || ''
          })
        }
      }
    })

    console.log(`Estoque consolidado: ${estoqueConsolidado.size} materiais`)

    // 3. BUSCAR DEMANDA E VALIDAR
    console.log('Buscando demanda...')
    const { data: demandaData, error: demandaError } = await supabase
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
      .order('numero_nt')

    if (demandaError) {
      return NextResponse.json({ 
        error: `Erro ao buscar demanda: ${demandaError.message}` 
      }, { status: 500 })
    }

    if (!demandaData || demandaData.length === 0) {
      return NextResponse.json({ 
        error: 'Não há dados de demanda para processar' 
      }, { status: 400 })
    }

    console.log(`Demanda encontrada: ${demandaData.length} linhas`)

    // 4. PROCESSAR DEMANDA E IDENTIFICAR CORTES
    const cortesPorMaterial = new Map<number, CorteResultado>()
    const cortePorSeparador = new Map<string, SeparadorCorte>()
    
    let volumeTotal = 0
    let volumeOk = 0
    let volumeAtendido = 0
    let volumeCortado = 0

    // Primeiro, vamos consolidar a demanda por material para verificar disponibilidade
    const demandaPorMaterial = new Map<number, number>()
    
    demandaData.forEach(item => {
      if (item.material && item.quant_nt) {
        const existing = demandaPorMaterial.get(item.material) || 0
        demandaPorMaterial.set(item.material, existing + item.quant_nt)
      }
    })

    // Agora processar linha por linha
    const ntsProcessadas = new Map<number, { usuario: string, totalLinhas: number, linhasComUsuario: number }>()

    demandaData.forEach(item => {
      volumeTotal++

      // Verificar se tem estoque disponível
      const estoque = estoqueConsolidado.get(item.material!)
      const demandaTotal = demandaPorMaterial.get(item.material!)

      if (!estoque || !demandaTotal || estoque.estoque_total < demandaTotal) {
        // Não tem estoque suficiente - não entra no cálculo
        return
      }

      volumeOk++

      // Verificar se foi finalizado
      const foiFinalizado = item.item_finalizado === 'X'
      const foiCortado = item.dt_producao === '1900-01-01'

      if (foiFinalizado && !foiCortado) {
        volumeAtendido++
      } else if (foiCortado) {
        volumeCortado++

        // Identificar quem cortou
        let usuarioQueCorto = item.nome_usuario || item.usuario || ''

        // Se não tem usuário na linha, ver se conseguimos identificar pela NT
        if (!usuarioQueCorto && item.numero_nt) {
          let ntInfo = ntsProcessadas.get(item.numero_nt)
          
          if (!ntInfo) {
            // Primeira vez vendo esta NT, vamos analisar todas as linhas dela
            const linhasDaNT = demandaData.filter(d => d.numero_nt === item.numero_nt)
            const linhasComUsuario = linhasDaNT.filter(d => d.nome_usuario || d.usuario)
            
            if (linhasComUsuario.length > 0) {
              // Pegar o usuário mais frequente nas linhas com usuário
              const usuarioFreq = new Map<string, number>()
              linhasComUsuario.forEach(linha => {
                const user = linha.nome_usuario || linha.usuario || ''
                if (user) {
                  usuarioFreq.set(user, (usuarioFreq.get(user) || 0) + 1)
                }
              })
              
              let usuarioMaisFrequente = ''
              let maiorFreq = 0
              usuarioFreq.forEach((freq, user) => {
                if (freq > maiorFreq) {
                  maiorFreq = freq
                  usuarioMaisFrequente = user
                }
              })

              ntInfo = {
                usuario: usuarioMaisFrequente,
                totalLinhas: linhasDaNT.length,
                linhasComUsuario: linhasComUsuario.length
              }
              ntsProcessadas.set(item.numero_nt, ntInfo)
            }
          }

          if (ntInfo) {
            usuarioQueCorto = ntInfo.usuario
          }
        }

        // Registrar corte por material
        if (!cortesPorMaterial.has(item.material!)) {
          cortesPorMaterial.set(item.material!, {
            material: item.material!,
            descricao: item.desc_material || estoque?.descricao || '',
            total_cortado: 0,
            linhas_cortadas: 0,
            usuarios_cortaram: []
          })
        }

        const corteInfo = cortesPorMaterial.get(item.material!)!
        corteInfo.total_cortado += item.quant_nt!
        corteInfo.linhas_cortadas += 1
        
        if (usuarioQueCorto && !corteInfo.usuarios_cortaram.includes(usuarioQueCorto)) {
          corteInfo.usuarios_cortaram.push(usuarioQueCorto)
        }

        // Registrar corte por separador
        if (usuarioQueCorto) {
          if (!cortePorSeparador.has(usuarioQueCorto)) {
            cortePorSeparador.set(usuarioQueCorto, {
              usuario: usuarioQueCorto,
              nome_usuario: usuarioQueCorto,
              total_atendido: 0,
              total_cortado: 0,
              percentual_corte: 0
            })
          }

          const separadorInfo = cortePorSeparador.get(usuarioQueCorto)!
          separadorInfo.total_cortado += item.quant_nt!
        }
      }

      // Contar atendimentos por separador
      if (foiFinalizado && !foiCortado) {
        let usuarioAtendeu = item.nome_usuario || item.usuario || ''
        
        if (!usuarioAtendeu && item.numero_nt) {
          const ntInfo = ntsProcessadas.get(item.numero_nt)
          if (ntInfo) {
            usuarioAtendeu = ntInfo.usuario
          }
        }

        if (usuarioAtendeu) {
          if (!cortePorSeparador.has(usuarioAtendeu)) {
            cortePorSeparador.set(usuarioAtendeu, {
              usuario: usuarioAtendeu,
              nome_usuario: usuarioAtendeu,
              total_atendido: 0,
              total_cortado: 0,
              percentual_corte: 0
            })
          }

          const separadorInfo = cortePorSeparador.get(usuarioAtendeu)!
          separadorInfo.total_atendido += item.quant_nt!
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

    // Ordenar resultados
    const cortesMateriais = Array.from(cortesPorMaterial.values())
      .sort((a, b) => b.total_cortado - a.total_cortado)

    const cortesSeparadores = Array.from(cortePorSeparador.values())
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
      percentual_corte: percentualCorteSetor,
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
      corte_id: corteId?.id
    }

    // Salvar detalhes dos materiais e separadores se conseguiu salvar o corte principal
    if (corteId?.id) {
      // Salvar materiais cortados
      const materiaisParaSalvar = cortesMateriais.map(material => ({
        corte_id: corteId.id,
        material: material.material,
        descricao: material.descricao,
        total_cortado: material.total_cortado,
        linhas_cortadas: material.linhas_cortadas,
        usuarios_cortaram: material.usuarios_cortaram.join(', ')
      }))

      if (materiaisParaSalvar.length > 0) {
        await supabase
          .from('cortex_materiais_cortados')
          .insert(materiaisParaSalvar)
      }

      // Salvar separadores
      const separadoresParaSalvar = cortesSeparadores.map(sep => ({
        corte_id: corteId.id,
        usuario: sep.usuario,
        nome_usuario: sep.nome_usuario,
        total_atendido: sep.total_atendido,
        total_cortado: sep.total_cortado,
        percentual_corte: sep.percentual_corte
      }))

      if (separadoresParaSalvar.length > 0) {
        await supabase
          .from('cortex_separadores_corte')
          .insert(separadoresParaSalvar)
      }
    }

    console.log(`Corte calculado: ${volumeCortado} itens cortados de ${volumeOk} válidos (${percentualCorteSetor.toFixed(2)}%)`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro no algoritmo de corte:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}