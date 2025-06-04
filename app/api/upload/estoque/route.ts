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

    const headers = jsonData[0] as string[]
    const rows = jsonData.slice(1) as any[]

    // Mapear cabeçalhos esperados
    const expectedHeaders = [
      'Material',
      'Cen.',
      'Dep.',
      'T',
      'Lote',
      'E',
      'Nº estoque especial',
      'Texto breve de material',
      'Tp.',
      'Pos.depós.',
      'Estoque Disponível',
      'UMB',
      'Data EM'
    ]

    // Validar cabeçalhos
    const missingHeaders = expectedHeaders.filter(header => 
      !headers.some(h => h?.toString().toLowerCase().includes(header.toLowerCase()))
    )

    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Cabeçalhos ausentes: ${missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    const errors: string[] = []
    const successRecords: any[] = []
    const BATCH_SIZE = 100

    // Processar dados em lotes
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const batchData: any[] = []

      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2 // +2 porque começamos da linha 2 (após cabeçalho)
        const row = batch[j]

        try {
          // Validar dados obrigatórios
          if (!row[0]) {
            errors.push(`Linha ${rowIndex}: Material é obrigatório`)
            continue
          }

          const materialValue = typeof row[0] === 'number' ? row[0] : parseInt(row[0]?.toString() || '0')
          if (isNaN(materialValue)) {
            errors.push(`Linha ${rowIndex}: Material deve ser um número válido`)
            continue
          }

          // Converter data se presente
          let dataEm = null
          if (row[12]) {
            const dateValue = row[12]
            if (typeof dateValue === 'number') {
              // Excel serial date
              const excelDate = new Date((dateValue - 25569) * 86400 * 1000)
              dataEm = excelDate.toISOString().split('T')[0]
            } else if (typeof dateValue === 'string') {
              // Formato dd.mm.aaaa
              const dateParts = dateValue.split('.')
              if (dateParts.length === 3) {
                dataEm = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
              }
            }
          }

          const estoqueDisponivel = row[10] ? (typeof row[10] === 'number' ? row[10] : parseFloat(row[10]?.toString().replace(',', '.') || '0')) : null

          const record = {
            material: materialValue,
            cen: row[1]?.toString() || null,
            dep: row[2]?.toString() || null,
            t: row[3]?.toString() || null,
            lote: row[4]?.toString() || null,
            e: row[5]?.toString() || null,
            estoque_especial: row[6]?.toString() || null,
            texto_breve_material: row[7]?.toString() || null,
            tp: row[8]?.toString() || null,
            pos_deposito: row[9]?.toString() || null,
            estoque_disponivel: estoqueDisponivel,
            umb: row[11]?.toString() || null,
            data_em: dataEm,
            data_upload: new Date().toISOString(),
            status: 'pronto'
          }

          batchData.push(record)
        } catch (error) {
          errors.push(`Linha ${rowIndex}: Erro ao processar dados - ${error}`)
        }
      }

      // Inserir lote no banco
      if (batchData.length > 0) {
        const { data, error } = await supabase
          .from('cortex_estoque')
          .insert(batchData)

        if (error) {
          errors.push(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`)
        } else {
          successRecords.push(...batchData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upload concluído. ${successRecords.length} registros inseridos.`,
      totalProcessed: rows.length,
      successCount: successRecords.length,
      errorCount: errors.length,
      errors: errors.slice(0, 10) // Limitar a 10 erros para não sobrecarregar a resposta
    })

  } catch (error) {
    console.error('Erro no upload de estoque:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}