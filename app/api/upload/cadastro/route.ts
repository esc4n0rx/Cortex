import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })
    }

    // Converter arquivo para buffer
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      return NextResponse.json({ error: 'Arquivo deve conter pelo menos cabeçalho e uma linha de dados' }, { status: 400 })
    }

    const headers = (jsonData[0] as string[]).map(h => h?.toString().trim().toLowerCase() || '')
    const rows = jsonData.slice(1) as any[]

    console.log('Headers encontrados:', headers)

    // Mapear índices das colunas
    const getColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name.toLowerCase()))
        if (index !== -1) return index
      }
      return -1
    }

    const columnMapping = {
      material: getColumnIndex(['material', 'codigo', 'cod']),
      descricao: getColumnIndex(['descricao', 'descrição', 'desc', 'produto']),
      um: getColumnIndex(['um', 'unidade', 'medida']),
      qtd_por_caixa: getColumnIndex(['qtd por caixa', 'qtd_por_caixa', 'quantidade por caixa', 'qtd caixa']),
      contador: getColumnIndex(['contador', 'count', 'contagem'])
    }

    console.log('Mapeamento de colunas:', columnMapping)

    // Validar se todas as colunas obrigatórias foram encontradas
    const requiredColumns = ['material', 'descricao', 'um', 'qtd_por_caixa', 'contador']
    const missingColumns = requiredColumns.filter(col => columnMapping[col as keyof typeof columnMapping] === -1)

    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`,
        columnMapping 
      }, { status: 400 })
    }

    const errors: string[] = []
    const successRecords: any[] = []
    const BATCH_SIZE = 1000

    // Primeiro, limpar todos os registros existentes
    console.log('Limpando registros existentes...')
    const { error: deleteError } = await supabase
      .from('cortex_cadastro_itens')
      .delete()
      .neq('id', 0) // Deletar todos

    if (deleteError) {
      console.error('Erro ao limpar registros:', deleteError)
      return NextResponse.json({ 
        error: `Erro ao limpar dados existentes: ${deleteError.message}` 
      }, { status: 500 })
    }

    // Função auxiliar para converter número
    const convertNumber = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null
      
      if (typeof value === 'number') return value
      
      if (typeof value === 'string') {
        const cleanValue = value.replace(',', '.').trim()
        const parsed = parseFloat(cleanValue)
        return isNaN(parsed) ? null : parsed
      }
      
      return null
    }

    // Função auxiliar para converter inteiro
    const convertInteger = (value: any): number | null => {
      if (value === null || value === undefined || value === '') return null
      
      if (typeof value === 'number') return Math.floor(value)
      
      if (typeof value === 'string') {
        const parsed = parseInt(value.trim())
        return isNaN(parsed) ? null : parsed
      }
      
      return null
    }

    // Processar e agrupar dados para evitar duplicatas na mesma planilha
    const processedData = new Map<string, any>()

    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2 // +2 porque começamos da linha 2 (após cabeçalho)
      const row = rows[i]

      try {
        // Pular linhas vazias
        if (!row || row.every((cell: any) => !cell)) continue

        // Validar dados obrigatórios
        const materialValue = convertInteger(row[columnMapping.material])
        if (!materialValue) {
          errors.push(`Linha ${rowIndex}: Material é obrigatório e deve ser um número válido`)
          continue
        }

        const descricaoValue = row[columnMapping.descricao]?.toString().trim()
        if (!descricaoValue) {
          errors.push(`Linha ${rowIndex}: Descrição é obrigatória`)
          continue
        }

        const umValue = row[columnMapping.um]?.toString().trim().toUpperCase()
        if (!umValue) {
          errors.push(`Linha ${rowIndex}: Unidade de medida é obrigatória`)
          continue
        }

        const qtdPorCaixaValue = convertInteger(row[columnMapping.qtd_por_caixa])
        if (!qtdPorCaixaValue || qtdPorCaixaValue <= 0) {
          errors.push(`Linha ${rowIndex}: Quantidade por caixa deve ser um número maior que zero`)
          continue
        }

        const contadorValue = convertInteger(row[columnMapping.contador]) || 0

        // Criar chave única para material + UM
        const uniqueKey = `${materialValue}-${umValue}`

        // Se já existe, pegar o último (sobrescrever)
        const record = {
          material: materialValue,
          descricao: descricaoValue,
          um: umValue,
          qtd_por_caixa: qtdPorCaixaValue,
          contador: contadorValue,
          data_upload: new Date().toISOString(),
          status: 'ativo'
        }

        processedData.set(uniqueKey, record)
      } catch (error) {
        errors.push(`Linha ${rowIndex}: Erro ao processar dados - ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      }
    }

    // Converter Map para array
    const allRecords = Array.from(processedData.values())
    console.log(`Total de registros únicos (material + UM) para inserir: ${allRecords.length}`)

    // Processar dados em lotes
    for (let i = 0; i < allRecords.length; i += BATCH_SIZE) {
      const batch = allRecords.slice(i, i + BATCH_SIZE)
      
      console.log(`Tentando inserir lote ${Math.floor(i / BATCH_SIZE) + 1} com ${batch.length} registros`)
      
      const { data, error } = await supabase
        .from('cortex_cadastro_itens')
        .insert(batch)
        .select()

      if (error) {
        console.error('Erro do Supabase:', error)
        
        // Se for erro de duplicata mesmo com a limpeza, tentar upsert
        if (error.code === '23505') {
          console.log('Tentando upsert devido a duplicata...')
          
          // Fazer upsert um por um para identificar problemas
          for (const record of batch) {
            try {
              const { error: upsertError } = await supabase
                .from('cortex_cadastro_itens')
                .upsert(record, { 
                  onConflict: 'material,um',
                  ignoreDuplicates: false 
                })

              if (upsertError) {
                errors.push(`Erro ao inserir material ${record.material} UM ${record.um}: ${upsertError.message}`)
              } else {
                successRecords.push(record)
              }
            } catch (upsertErr) {
              errors.push(`Erro ao processar material ${record.material} UM ${record.um}: ${upsertErr}`)
            }
          }
        } else {
          errors.push(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
        }
      } else {
        console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido com sucesso`)
        successRecords.push(...batch)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upload concluído. ${successRecords.length} registros inseridos. Dados anteriores foram removidos.`,
      totalProcessed: rows.length,
      uniqueRecords: allRecords.length,
      successCount: successRecords.length,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      columnMapping: columnMapping
    })

  } catch (error) {
    console.error('Erro no upload de cadastro:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}