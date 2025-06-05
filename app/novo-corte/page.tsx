// app/novo-corte/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CalendarIcon, CheckCircle, AlertTriangle, Scissors, BarChart3, Users, Package } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useCorte } from "@/hooks/use-corte"
import { CorteResultadoModal } from "@/components/corte-resultado-modal"

export default function NovoCorte() {
 const [date, setDate] = useState<Date>()
 const [setor, setSetor] = useState<'Mercearia' | 'Perecíveis'>('Mercearia')
 const [resultadoCorte, setResultadoCorte] = useState<any>(null)
 const [modalOpen, setModalOpen] = useState(false)
 
 const { gerarCorte, isGenerating, progress } = useCorte()

 const handleGenerateCorte = async () => {
   if (!date) return

   const resultado = await gerarCorte({
     setor,
     data: date.toISOString().split('T')[0]
   })

   if (resultado) {
     setResultadoCorte(resultado)
     setModalOpen(true)
   }
 }

 const getStatusColor = (percentual: number, meta: number) => {
   if (percentual <= meta) return "bg-green-500/20 text-green-400 border-green-500/30"
   if (percentual <= meta * 1.5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
   return "bg-red-500/20 text-red-400 border-red-500/30"
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
           <Scissors className="h-6 w-6 text-primary" />
           <h1 className="text-3xl font-bold">Novo Corte</h1>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="rounded-2xl">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <CalendarIcon className="h-5 w-5" />
               Configuração do Corte
             </CardTitle>
             <CardDescription>Escolha a data e setor para gerar o corte</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* Seleção de Setor */}
             <div className="space-y-2">
               <label className="text-sm font-medium">Setor</label>
               <Select value={setor} onValueChange={(value: 'Mercearia' | 'Perecíveis') => setSetor(value)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Mercearia">Mercearia (DP01)</SelectItem>
                   <SelectItem value="Perecíveis">Perecíveis (DP40)</SelectItem>
                 </SelectContent>
               </Select>
             </div>

             {/* Seleção de Data */}
             <div className="space-y-2">
               <label className="text-sm font-medium">Data do Corte</label>
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
             </div>

             {/* Progresso do processamento */}
             {isGenerating && (
               <div className="space-y-2">
                 <div className="flex items-center justify-between">
                   <span className="text-sm font-medium">Processando corte...</span>
                   <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                 </div>
                 <Progress value={progress} className="h-2" />
                 <div className="text-xs text-muted-foreground space-y-1">
                   <div>• Consolidando estoque por material</div>
                   <div>• Analisando demanda e identificando cortes</div>
                   <div>• Calculando percentuais por separador</div>
                   <div>• Gerando relatório final</div>
                 </div>
               </div>
             )}

             {/* Botão de gerar */}
             <Button 
               onClick={handleGenerateCorte} 
               disabled={!date || isGenerating} 
               className="w-full"
               size="lg"
             >
               {isGenerating ? "Gerando Corte..." : "Gerar Corte"}
             </Button>
           </CardContent>
         </Card>

         <Card className="rounded-2xl">
           <CardHeader>
             <CardTitle>Configurações do Setor</CardTitle>
             <CardDescription>Informações sobre o setor selecionado</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
               <h3 className="font-semibold text-lg mb-2">{setor}</h3>
               <p className="text-sm text-muted-foreground mb-3">
                 {setor === 'Mercearia' 
                   ? 'Produtos secos, enlatados e não perecíveis (Depósito DP01)' 
                   : 'Frutas, verduras, laticínios e carnes (Depósito DP40)'
                 }
               </p>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-xs text-muted-foreground">Meta de Corte</div>
                   <Badge variant="outline" className="text-sm">
                     ≤ {setor === 'Mercearia' ? '3%' : '2%'}
                   </Badge>
                 </div>
                 <div>
                   <div className="text-xs text-muted-foreground">Código Depósito</div>
                   <Badge variant="outline" className="text-sm">
                     {setor === 'Mercearia' ? 'DP01' : 'DP40'}
                   </Badge>
                 </div>
               </div>
             </div>

             {/* Informações do algoritmo */}
             <Alert>
               <BarChart3 className="h-4 w-4" />
               <AlertDescription>
                 <div className="space-y-2">
                   <div><strong>Como funciona o cálculo:</strong></div>
                   <div className="text-xs space-y-1">
                     <div>• Consolida estoque disponível por material</div>
                     <div>• Valida demanda vs estoque disponível</div>
                     <div>• Identifica itens cortados (dt_producao = 1900-01-01)</div>
                     <div>• Calcula % de corte por separador</div>
                     <div>• Rankeia materiais e separadores</div>
                   </div>
                 </div>
               </AlertDescription>
             </Alert>
           </CardContent>
         </Card>
       </div>

       {/* Status do Sistema */}
       <div className="mt-8">
         <Card className="rounded-2xl">
           <CardHeader>
             <CardTitle>Status do Sistema</CardTitle>
             <CardDescription>Verificação de dados necessários para o corte</CardDescription>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="h-4 w-4 text-green-500" />
                   <span className="text-sm">Dados de Estoque</span>
                 </div>
                 <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                   Disponível
                 </Badge>
               </div>

               <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="h-4 w-4 text-green-500" />
                   <span className="text-sm">Dados de Demanda</span>
                 </div>
                 <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                   Disponível
                 </Badge>
               </div>

               <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                 <div className="flex items-center gap-2">
                   <CheckCircle className="h-4 w-4 text-green-500" />
                   <span className="text-sm">Algoritmo</span>
                 </div>
                 <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                   Operacional
                 </Badge>
               </div>
             </div>

             <Alert className="mt-4">
               <AlertTriangle className="h-4 w-4" />
               <AlertDescription>
                 Certifique-se de que os uploads de estoque e demanda estão atualizados antes de gerar o corte. 
                 O sistema validará automaticamente a disponibilidade dos dados necessários.
               </AlertDescription>
             </Alert>
           </CardContent>
         </Card>
       </div>

       {/* Estatísticas rápidas */}
       <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="rounded-2xl">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <Package className="h-4 w-4" />
               Últimos Cortes
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">247</div>
             <p className="text-xs text-muted-foreground">Itens cortados hoje</p>
           </CardContent>
         </Card>

         <Card className="rounded-2xl">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <BarChart3 className="h-4 w-4" />
               % Médio Mercearia
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">2.8%</div>
             <p className="text-xs text-green-600">Dentro da meta (≤3%)</p>
           </CardContent>
         </Card>

         <Card className="rounded-2xl">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <BarChart3 className="h-4 w-4" />
               % Médio Perecíveis
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">1.9%</div>
             <p className="text-xs text-green-600">Dentro da meta (≤2%)</p>
           </CardContent>
         </Card>

         <Card className="rounded-2xl">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
               <Users className="h-4 w-4" />
               Separadores
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">15</div>
             <p className="text-xs text-muted-foreground">Ativos no sistema</p>
           </CardContent>
         </Card>
       </div>

       <CorteResultadoModal 
         open={modalOpen} 
         onOpenChange={setModalOpen} 
         data={resultadoCorte} 
       />
     </div>
   </div>
 )
}