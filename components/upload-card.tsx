"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, AlertTriangle, FileSpreadsheet, X, Info } from "lucide-react"
import { useUpload } from "@/hooks/use-upload"

interface UploadCardProps {
  title: string
  description: string
  type: 'estoque' | 'demanda'
  acceptedFormats: string[]
  expectedColumns: string[]
  lastUpload?: string
}

export function UploadCard({ 
  title, 
  description, 
  type, 
  acceptedFormats, 
  expectedColumns,
  lastUpload 
}: UploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [showMapping, setShowMapping] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadFile, isUploading, progress } = useUpload()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const result = await uploadFile(selectedFile, type)
    if (result) {
      setUploadResult(result)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Arquivo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats.join(',')}
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id={`${type}-file`}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Selecionar Arquivo
            </Button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="outline" className="text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Progresso do Upload */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Processando arquivo...</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Botão de Upload */}
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFile || isUploading} 
          className="w-full"
          size="lg"
        >
          {isUploading ? "Processando..." : "Fazer Upload"}
        </Button>

        {/* Último Upload */}
        {lastUpload && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Último upload: {lastUpload}</span>
          </div>
        )}

        {/* Resultado do Upload */}
        {uploadResult && (
          <div className="space-y-3">
            {uploadResult.success ? (
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <div className="space-y-1">
                    <div>{uploadResult.message}</div>
                    <div className="text-xs">
                      Total processado: {uploadResult.totalProcessed} | 
                      Sucesso: {uploadResult.successCount} | 
                      Erros: {uploadResult.errorCount}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {uploadResult.error || 'Erro no processamento'}
                </AlertDescription>
              </Alert>
            )}

            {/* Mostrar mapeamento de colunas para debug */}
            {uploadResult.columnMapping && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapping(!showMapping)}
                >
                  <Info className="h-4 w-4 mr-2" />
                  {showMapping ? 'Ocultar' : 'Mostrar'} Mapeamento de Colunas
                </Button>

                {showMapping && (
                  <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-xs font-medium mb-2">Colunas encontradas:</div>
                    {Object.entries(uploadResult.columnMapping).map(([field, index]: [string, any]) => (
                      <div key={field} className="text-xs">
                        <span className="font-medium">{field}:</span> {index >= 0 ? `Coluna ${index}` : 'Não encontrada'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mostrar erros se houver */}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrors(!showErrors)}
                >
                  {showErrors ? 'Ocultar' : 'Mostrar'} Erros ({uploadResult.errors.length})
                </Button>

                {showErrors && (
                  <div className="max-h-32 overflow-y-auto space-y-1 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <div key={index} className="text-xs text-red-700 dark:text-red-300">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Informações sobre formato esperado */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>
                <strong>Formatos aceitos:</strong> {acceptedFormats.join(', ')}
              </div>
              <div>
                <strong>Colunas esperadas (principais):</strong>
              </div>
              <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                {type === 'demanda' ? (
                  <div>Material, Numero_NT, Status, Usuario, Setor, Data, etc.</div>
                ) : (
                  expectedColumns.slice(0, 5).map((col, index) => (
                    <div key={index}>• {col}</div>
                  ))
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}