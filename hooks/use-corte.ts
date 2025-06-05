// hooks/use-corte.ts
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface CorteParams {
  setor: 'Mercearia' | 'Perecíveis'
  data: string
}

interface CorteResponse {
  success: boolean
  setor: string
  data: string
  resumo: {
    volume_total: number
    volume_ok: number
    volume_atendido: number
    volume_cortado: number
    percentual_corte: number
    meta_percentual: number
    status_meta: 'OK' | 'ACIMA'
  }
  materiais_cortados: Array<{
    material: number
    descricao: string
    total_cortado: number
    linhas_cortadas: number
    usuarios_cortaram: string[]
  }>
  separadores: Array<{
    usuario: string
    nome_usuario: string
    total_atendido: number
    total_cortado: number
    percentual_corte: number
  }>
  corte_id?: number
}

export function useCorte() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const gerarCorte = async (params: CorteParams): Promise<CorteResponse | null> => {
    if (!params.setor || !params.data) {
      toast({
        title: "Erro",
        description: "Setor e data são obrigatórios",
        variant: "destructive"
      })
      return null
    }

    setIsGenerating(true)
    setProgress(0)

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 800)

      const response = await fetch('/api/corte/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao gerar corte')
      }

      toast({
        title: "Corte gerado com sucesso!",
        description: `${result.resumo.volume_cortado} itens cortados (${result.resumo.percentual_corte}%)`,
      })

      return result
    } catch (error) {
      console.error('Erro ao gerar corte:', error)
      
      toast({
        title: "Erro ao gerar corte",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      })

      return null
    } finally {
      setIsGenerating(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const buscarHistorico = async (filtros?: {
    setor?: string
    data_inicial?: string
    data_final?: string
    page?: number
  }) => {
    try {
      const params = new URLSearchParams()
      
      if (filtros?.setor) params.append('setor', filtros.setor)
      if (filtros?.data_inicial) params.append('data_inicial', filtros.data_inicial)
      if (filtros?.data_final) params.append('data_final', filtros.data_final)
      if (filtros?.page) params.append('page', filtros.page.toString())

      const response = await fetch(`/api/corte/historico?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar histórico')
      }

      return result
    } catch (error) {
      console.error('Erro ao buscar histórico:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao buscar histórico',
        variant: "destructive"
      })
      return null
    }
  }

  const buscarDetalhes = async (corteId: number) => {
    try {
      const response = await fetch(`/api/corte/${corteId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar detalhes')
      }

      return result
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao buscar detalhes',
        variant: "destructive"
      })
      return null
    }
  }

  return {
    gerarCorte,
    buscarHistorico,
    buscarDetalhes,
    isGenerating,
    progress
  }
}