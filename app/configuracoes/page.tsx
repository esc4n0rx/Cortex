"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, Upload, Users, Database, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function Configuracoes() {
  const [uploadingEstoque, setUploadingEstoque] = useState(false)
  const [uploadingSeparacao, setUploadingSeparacao] = useState(false)
  const [separacao, setSeparacao] = useState(false) // Declare the setSeparacao variable
  const { toast } = useToast()

  const handleUploadEstoque = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingEstoque(true)

    // Simular upload
    setTimeout(() => {
      setUploadingEstoque(false)
      toast({
        title: "Upload concluído!",
        description: "Arquivo de estoque processado com sucesso.",
      })
    }, 2000)
  }

  const handleUploadSeparacao = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSeparacao(true)

    // Simular upload
    setTimeout(() => {
      setUploadingSeparacao(false)
      toast({
        title: "Upload concluído!",
        description: "Arquivo de separação processado com sucesso.",
      })
    }, 2000)
  }

  const handleLimpeza = (tipo: string) => {
    toast({
      title: "Limpeza executada",
      description: `${tipo} foram removidos com sucesso.`,
    })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>
        </div>

        <Tabs defaultValue="uploads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="cadastros">Cadastros</TabsTrigger>
            <TabsTrigger value="limpezas">Limpezas</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload de Estoque
                  </CardTitle>
                  <CardDescription>Faça upload da planilha de estoque atual</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="estoque-file">Arquivo de Estoque (.xlsx, .csv)</Label>
                    <Input
                      id="estoque-file"
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleUploadEstoque}
                      disabled={uploadingEstoque}
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Último upload: 15/01/2024 08:30</span>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Certifique-se de que o arquivo contém as colunas: Código, Descrição, Quantidade, Setor
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload de Separação
                  </CardTitle>
                  <CardDescription>Faça upload dos dados de separação</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="separacao-file">Arquivo de Separação (.xlsx, .csv)</Label>
                    <Input
                      id="separacao-file"
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleUploadSeparacao}
                      disabled={uploadingSeparacao}
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Último upload: 15/01/2024 08:45</span>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Arquivo deve conter: Operador, Código, Quantidade, Data, Setor</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cadastros" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Operadores
                  </CardTitle>
                  <CardDescription>Gerenciar operadores do sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-sm text-muted-foreground">operadores cadastrados</p>
                    <Button className="w-full">Gerenciar Operadores</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Setores
                  </CardTitle>
                  <CardDescription>Configurar setores disponíveis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold">2</div>
                    <p className="text-sm text-muted-foreground">setores ativos</p>
                    <Button className="w-full" variant="outline">
                      Gerenciar Setores
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Materiais
                  </CardTitle>
                  <CardDescription>Cadastro de materiais</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-2xl font-bold">1,247</div>
                    <p className="text-sm text-muted-foreground">materiais cadastrados</p>
                    <Button className="w-full" variant="outline">
                      Gerenciar Materiais
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="limpezas" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Limpeza de Dados Antigos
                  </CardTitle>
                  <CardDescription>Remover dados com mais de 30 dias</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Esta ação não pode ser desfeita. Dados removidos não poderão ser recuperados.
                    </AlertDescription>
                  </Alert>
                  <Button variant="destructive" className="w-full" onClick={() => handleLimpeza("Dados antigos")}>
                    Limpar Dados Antigos
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Reset de Dados de Teste
                  </CardTitle>
                  <CardDescription>Remover todos os dados de teste</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Remove apenas dados marcados como teste. Dados de produção serão preservados.
                    </AlertDescription>
                  </Alert>
                  <Button variant="outline" className="w-full" onClick={() => handleLimpeza("Dados de teste")}>
                    Reset Dados de Teste
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sistema" className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Informações do Sistema</CardTitle>
                <CardDescription>Detalhes sobre a versão e configurações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Versão do Sistema</Label>
                    <div className="text-lg font-semibold">CorteX v1.0.0</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Última Atualização</Label>
                    <div className="text-lg font-semibold">15/01/2024</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Banco de Dados</Label>
                    <div className="text-lg font-semibold">PostgreSQL 15</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-semibold">Online</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
