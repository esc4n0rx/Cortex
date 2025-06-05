// app/api/upload/demanda/route.ts
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

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    if (jsonData.length < 2) {
      return NextResponse.json({ error: 'Arquivo deve conter pelo menos cabeçalho e uma linha de dados' }, { status: 400 })
    }

    const headers = (jsonData[0] as string[]).map(h => h?.toString().trim().toUpperCase() || '')
    const rows = jsonData.slice(1) as any[]

    console.log('Headers encontrados:', headers)

    // Mapear índices das colunas baseado nos cabeçalhos
    const getColumnIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name.toUpperCase()))
        if (index !== -1) return index
      }
      return -1
    }

    const columnMapping = {
      n_deposito: getColumnIndex(['N_DEPOSITO', 'DEPOSITO']),
      numero_nt: getColumnIndex(['NUMERO_NT', 'NT']),
      status: getColumnIndex(['STATUS']),
      tp_transporte: getColumnIndex(['TP_TRANSPORTE']),
      prio_transporte: getColumnIndex(['PRIO_TRANSPORTE']),
      usuario: getColumnIndex(['USUARIO']),
      dt_criacao: getColumnIndex(['DT_CRIACAO', 'DATA_CRIACAO']),
      hr_criacao: getColumnIndex(['HR_CRIACAO', 'HORA_CRIACAO']),
      tp_movimento: getColumnIndex(['TP_MOVIMENTO']),
      tp_deposito: getColumnIndex(['TP_DEPOSITO']),
      posicao: getColumnIndex(['POSICAO']),
      dt_planejada: getColumnIndex(['DT_PLANEJADA']),
      ref_transporte: getColumnIndex(['REF_TRANSPORTE']),
      item_nt: getColumnIndex(['ITEM_NT']),
      item_finalizado: getColumnIndex(['ITEM_FINALIZADO']),
      material: getColumnIndex(['MATERIAL']),
      centro: getColumnIndex(['CENTRO']),
      quant_nt: getColumnIndex(['QUANT_NT']),
      unidade: getColumnIndex(['UNIDADE']),
      numero_ot: getColumnIndex(['NUMERO_OT', 'OT']),
      quant_ot: getColumnIndex(['QUANT_OT']),
      deposito: getColumnIndex(['DEPOSITO']),
      desc_material: getColumnIndex(['DESC_MATERIAL']),
      setor: getColumnIndex(['SETOR']),
      palete: getColumnIndex(['PALETE']),
      palete_origem: getColumnIndex(['PALETE_ORIGEM']),
      endereco: getColumnIndex(['ENDERECO']),
      ot: getColumnIndex(['OT']),
      pedido: getColumnIndex(['PEDIDO']),
      remessa: getColumnIndex(['REMESSA']),
      nome_usuario: getColumnIndex(['NOME_USUARIO']),
      dt_producao: getColumnIndex(['DT_PRODUCAO']),
      hr_registro: getColumnIndex(['HR_REGISTRO']),
      data_processamento: getColumnIndex(['DATA'])
    }

    console.log('Mapeamento de colunas:', columnMapping)

    // LIMPAR TODOS OS REGISTROS EXISTENTES ANTES DE INSERIR NOVOS
    console.log('Limpando dados de demanda existentes...')
    const { error: deleteError } = await supabase
      .from('cortex_demanda')
      .delete()
      .neq('id', 0) // Deletar todos os registros

    if (deleteError) {
      console.error('Erro ao limpar dados de demanda:', deleteError)
      return NextResponse.json({ 
        error: `Erro ao limpar dados existentes: ${deleteError.message}` 
      }, { status: 500 })
    }

    console.log('Dados de demanda existentes removidos com sucesso')

    const errors: string[] = []
    const successRecords: any[] = []
    const BATCH_SIZE = 100

    // Função auxiliar para converter data
    const convertDate = (dateValue: any, rowIndex: number, fieldName: string): string | null => {
      if (!dateValue) return null

      try {
        // Se for número (Excel serial date)
        if (typeof dateValue === 'number') {
          if (dateValue === 0) return '1900-01-01'
          const excelDate = new Date((dateValue - 25569) * 86400 * 1000)
          if (isNaN(excelDate.getTime())) return null
          return excelDate.toISOString().split('T')[0]
        }
        
        if (typeof dateValue === 'string') {
          const dateStr = dateValue.trim()
          
          // Formato dd/mm/aaaa ou dd/mm/aa
          if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            const dateParts = dateStr.split('/')
            if (dateParts.length === 3) {
              let year = parseInt(dateParts[2])
              if (year < 100) year += 2000 // Converter anos de 2 dígitos
              const month = parseInt(dateParts[1])
              const day = parseInt(dateParts[0])
              
              if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
          }
          
          // Formato dd.mm.aaaa
          if (dateStr.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
            const dateParts = dateStr.split('.')
            if (dateParts.length === 3) {
              const year = parseInt(dateParts[2])
              const month = parseInt(dateParts[1])
              const day = parseInt(dateParts[0])
              
              if (year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              }
            }
          }
          
          // Se não conseguir converter, tentar como data ISO
          const isoDate = new Date(dateStr)
          if (!isNaN(isoDate.getTime())) {
            return isoDate.toISOString().split('T')[0]
          }
        }
      } catch (error) {
        console.log(`Erro ao converter data ${fieldName} na linha ${rowIndex}:`, dateValue, error)
      }
      
      return null
    }

    // Função auxiliar para converter hora
    const convertTime = (timeValue: any): string | null => {
      if (!timeValue) return null
      
      try {
        if (typeof timeValue === 'string') {
          const timeStr = timeValue.trim()
          // Verificar se já está no formato HH:MM:SS
          if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
            return timeStr
          }
          // Formato HH:MM
          if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            return timeStr + ':00'
          }
        }
        
        // Se for número (Excel time)
        if (typeof timeValue === 'number') {
          const totalSeconds = Math.round(timeValue * 24 * 60 * 60)
          const hours = Math.floor(totalSeconds / 3600)
          const minutes = Math.floor((totalSeconds % 3600) / 60)
          const seconds = totalSeconds % 60
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        }
      } catch (error) {
        console.log('Erro ao converter hora:', timeValue, error)
      }
      
      return timeValue?.toString() || null
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

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const batchData: any[] = []

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2
        const row = batch[j]

        try {
          // Pular linhas vazias
          if (!row || row.every((cell: any) => !cell)) continue

          const record = {
            n_deposito: columnMapping.n_deposito >= 0 ? row[columnMapping.n_deposito]?.toString() || null : null,
            numero_nt: columnMapping.numero_nt >= 0 ? convertInteger(row[columnMapping.numero_nt]) : null,
            status: columnMapping.status >= 0 ? row[columnMapping.status]?.toString() || null : null,
            tp_transporte: columnMapping.tp_transporte >= 0 ? row[columnMapping.tp_transporte]?.toString() || null : null,
            prio_transporte: columnMapping.prio_transporte >= 0 ? convertInteger(row[columnMapping.prio_transporte]) : null,
            usuario: columnMapping.usuario >= 0 ? row[columnMapping.usuario]?.toString() || null : null,
            dt_criacao: columnMapping.dt_criacao >= 0 ? convertDate(row[columnMapping.dt_criacao], rowIndex, 'DT_CRIACAO') : null,
            hr_criacao: columnMapping.hr_criacao >= 0 ? convertTime(row[columnMapping.hr_criacao]) : null,
            tp_movimento: columnMapping.tp_movimento >= 0 ? convertInteger(row[columnMapping.tp_movimento]) : null,
            tp_deposito: columnMapping.tp_deposito >= 0 ? row[columnMapping.tp_deposito]?.toString() || null : null,
            posicao: columnMapping.posicao >= 0 ? row[columnMapping.posicao]?.toString() || null : null,
            dt_planejada: columnMapping.dt_planejada >= 0 ? convertDate(row[columnMapping.dt_planejada], rowIndex, 'DT_PLANEJADA') : null,
            ref_transporte: columnMapping.ref_transporte >= 0 ? row[columnMapping.ref_transporte]?.toString() || null : null,
            item_nt: columnMapping.item_nt >= 0 ? convertInteger(row[columnMapping.item_nt]) : null,
            item_finalizado: columnMapping.item_finalizado >= 0 ? row[columnMapping.item_finalizado]?.toString() || null : null,
            material: columnMapping.material >= 0 ? convertInteger(row[columnMapping.material]) : null,
            centro: columnMapping.centro >= 0 ? row[columnMapping.centro]?.toString() || null : null,
            quant_nt: columnMapping.quant_nt >= 0 ? convertNumber(row[columnMapping.quant_nt]) : null,
            unidade: columnMapping.unidade >= 0 ? row[columnMapping.unidade]?.toString() || null : null,
            numero_ot: columnMapping.numero_ot >= 0 ? convertInteger(row[columnMapping.numero_ot]) : null,
            quant_ot: columnMapping.quant_ot >= 0 ? convertNumber(row[columnMapping.quant_ot]) : null,
            deposito: columnMapping.deposito >= 0 ? row[columnMapping.deposito]?.toString() || null : null,
            desc_material: columnMapping.desc_material >= 0 ? row[columnMapping.desc_material]?.toString() || null : null,
            setor: columnMapping.setor >= 0 ? row[columnMapping.setor]?.toString() || null : null,
            palete: columnMapping.palete >= 0 ? convertInteger(row[columnMapping.palete]) : null,
            palete_origem: columnMapping.palete_origem >= 0 ? convertInteger(row[columnMapping.palete_origem]) : null,
            endereco: columnMapping.endereco >= 0 ? row[columnMapping.endereco]?.toString() || null : null,
            ot: columnMapping.ot >= 0 ? convertInteger(row[columnMapping.ot]) : null,
            pedido: columnMapping.pedido >= 0 ? row[columnMapping.pedido]?.toString() || null : null,
            remessa: columnMapping.remessa >= 0 ? convertInteger(row[columnMapping.remessa]) : null,
            nome_usuario: columnMapping.nome_usuario >= 0 ? row[columnMapping.nome_usuario]?.toString() || null : null,
            dt_producao: columnMapping.dt_producao >= 0 ? convertDate(row[columnMapping.dt_producao], rowIndex, 'DT_PRODUCAO') || '1900-01-01' : '1900-01-01',
            hr_registro: columnMapping.hr_registro >= 0 ? convertTime(row[columnMapping.hr_registro]) : null,
            data_processamento: columnMapping.data_processamento >= 0 ? convertDate(row[columnMapping.data_processamento], rowIndex, 'DATA') : null,
            data_upload: new Date().toISOString(),
            status_processamento: 'pronto'
          }

          batchData.push(record)
        } catch (error) {
          errors.push(`Linha ${rowIndex}: Erro ao processar dados - ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
      }

      if (batchData.length > 0) {
        console.log(`Tentando inserir lote ${Math.floor(i / BATCH_SIZE) + 1} com ${batchData.length} registros`)
        
        const { data, error } = await supabase
          .from('cortex_demanda')
          .insert(batchData)

        if (error) {
          console.error('Erro do Supabase:', error)
          errors.push(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
        } else {
          console.log(`Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido com sucesso`)
          successRecords.push(...batchData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upload concluído. ${successRecords.length} registros inseridos. Dados anteriores foram removidos.`,
      totalProcessed: rows.length,
      successCount: successRecords.length,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      columnMapping: columnMapping
    })

  } catch (error) {
    console.error('Erro no upload de demanda:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}