import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UploadResult {
  success: boolean
  message: string
  totalProcessed: number
  successCount: number
  errorCount: number
  errors: string[]
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const uploadFile = async (file: File, type: 'estoque' | 'demanda'): Promise<UploadResult | null> => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Nenhum arquivo selecionado",
        variant: "destructive"
      })
      return null
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Tipo de arquivo não suportado. Use .xlsx, .xls ou .csv",
        variant: "destructive"
      })
      return null
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "Arquivo muito grande. Máximo permitido: 10MB",
        variant: "destructive"
      })
      return null
    }

    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 500)

      const response = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro no upload')
      }

      toast({
        title: "Upload concluído!",
        description: result.message,
      })

      return result
    } catch (error) {
      console.error('Erro no upload:', error)
      
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      })

      return null
    } finally {
      setIsUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  return {
    uploadFile,
    isUploading,
    progress
  }
}