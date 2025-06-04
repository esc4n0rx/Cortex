"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, CalendarIcon, CheckCircle, AlertTriangle, Scissors } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { RelatorioModal } from "@/components/relatorio-modal"

export default function NovoCorte() {
  const [date, setDate] = useState<Date>()
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()
  const [corteGerado, setCorteGerado] = useState<any>(null)
  const [modalCorteOpen, setModalCorteOpen] = useState(false)

  const handleGenerateCorte = async () => {
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Selecione uma data para gerar o corte.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simular validação e geração
    setTimeout(() => {
      setIsGenerating(false)

      // Dados do corte gerado
      const novoCorte = {
        id: Date.now(),
        data: date.toISOString(),
        setor: "Perecíveis",
        totalCortado: Math.floor(Math.random() * 200) + 150,
        percentualCorte: (Math.random() * 3 + 1.5).toFixed(1),
        status: "normal",
      }

      setCorteGerado(novoCorte)
      setModalCorteOpen(true)

      toast({
        title: "Corte gerado com sucesso!",
        description: `Corte para ${format(date, "dd/MM/yyyy", { locale: ptBR })} foi processado.`,
      })
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Scissors className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Novo Corte</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Seleção de Data
              </CardTitle>
              <CardDescription>Escolha a data para gerar o corte diário</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>

              <Button onClick={handleGenerateCorte} disabled={!date || isGenerating} className="w-full" size="lg">
                {isGenerating ? "Gerando Corte..." : "Gerar Corte"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>Verificação de dados necessários</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Upload de Estoque</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Atualizado
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Upload de Separação</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  Atualizado
                </Badge>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Certifique-se de que os uploads de estoque e separação estão atualizados antes de gerar o corte.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Setores Disponíveis</CardTitle>
              <CardDescription>O corte será gerado automaticamente para todos os setores ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2">Mercearia</h3>
                  <p className="text-sm text-muted-foreground mb-3">Produtos secos, enlatados e não perecíveis</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Ativo</Badge>
                    <span className="text-xs text-muted-foreground">12 operadores</span>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2">Perecíveis</h3>
                  <p className="text-sm text-muted-foreground mb-3">Frutas, verduras, laticínios e carnes</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Ativo</Badge>
                    <span className="text-xs text-muted-foreground">8 operadores</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <RelatorioModal open={modalCorteOpen} onOpenChange={setModalCorteOpen} data={corteGerado} />
    </div>
  )
}
