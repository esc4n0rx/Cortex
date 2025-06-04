"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Settings, Users, Database, Trash2, CheckCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { UploadCard } from "@/components/upload-card"

export default function Configuracoes() {
 const { toast } = useToast()

 const handleLimpeza = (tipo: string) => {
   toast({
     title: "Limpeza executada",
     description: `${tipo} foram removidos com sucesso.`,
   })
 }

 const estoqueColumns = [
   'Material (número)',
   'Cen. (texto)',
   'Dep. (texto)',
   'T (texto)',
   'Lote (texto)',
   'E (texto)',
   'Nº estoque especial (texto)',
   'Texto breve de material (texto)',
   'Tp. (texto)',
   'Pos.depós. (texto)',
   'Estoque Disponível (número)',
   'UMB (texto)',
   'Data EM (dd.mm.aaaa)'
 ]

 const demandaColumns = [
   'N_DEPOSITO', 'NUMERO_NT', 'STATUS', 'TP_TRANSPORTE', 'PRIO_TRANSPORTE',
   'USUARIO', 'DT_CRIACAO', 'HR_CRIACAO', 'TP_MOVIMENTO', 'TP_DEPOSITO',
   'POSICAO', 'DT_PLANEJADA', 'REF_TRANSPORTE', 'ITEM_NT', 'ITEM_FINALIZADO',
   'MATERIAL', 'CENTRO', 'QUANT_NT', 'UNIDADE', 'NUMERO_OT', 'QUANT_OT',
   'DEPOSITO', 'DESC_MATERIAL', 'SETOR', 'PALETE', 'PALETE_ORIGEM',
   'ENDERECO', 'OT', 'PEDIDO', 'REMESSA', 'NOME_USUARIO', 'DT_PRODUCAO',
   'HR_REGISTRO', 'DATA'
 ]

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
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <UploadCard
               title="Upload de Estoque"
               description="Faça upload da planilha de estoque atual"
               type="estoque"
               acceptedFormats={['.xlsx', '.xls', '.csv']}
               expectedColumns={estoqueColumns}
               lastUpload="15/01/2024 08:30"
             />

             <UploadCard
               title="Upload de Demanda"
               description="Faça upload dos dados de demanda/separação"
               type="demanda"
               acceptedFormats={['.xlsx', '.xls', '.csv']}
               expectedColumns={demandaColumns}
               lastUpload="15/01/2024 08:45"
             />
           </div>

           {/* Informações importantes */}
           <Card className="rounded-2xl">
             <CardHeader>
               <CardTitle>Informações Importantes</CardTitle>
               <CardDescription>Instruções para upload de arquivos</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <Alert>
                 <AlertTriangle className="h-4 w-4" />
                 <AlertDescription>
                   <div className="space-y-2">
                     <div><strong>Formatos de Data:</strong></div>
                     <div>• Estoque: Data EM no formato dd.mm.aaaa (ex: 15.01.2024)</div>
                     <div>• Demanda: Datas no formato dd/mm/aaaa (ex: 15/01/2024)</div>
                     <div>• Horas no formato HH:mm:ss (ex: 08:30:00)</div>
                   </div>
                 </AlertDescription>
               </Alert>

               <Alert>
                 <CheckCircle className="h-4 w-4" />
                 <AlertDescription>
                   <div className="space-y-2">
                     <div><strong>Processamento:</strong></div>
                     <div>• Arquivos são processados em lotes de 100 registros</div>
                     <div>• Erros são reportados por linha para fácil correção</div>
                     <div>• Registros válidos são salvos mesmo com erros em outras linhas</div>
                     <div>• Tamanho máximo: 10MB por arquivo</div>
                   </div>
                 </AlertDescription>
               </Alert>
             </CardContent>
           </Card>
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
                   <label className="text-sm font-medium text-muted-foreground">Versão do Sistema</label>
                   <div className="text-lg font-semibold">CorteX v1.0.0</div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                   <div className="text-lg font-semibold">15/01/2024</div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-muted-foreground">Banco de Dados</label>
                   <div className="text-lg font-semibold">Supabase PostgreSQL</div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-sm font-medium text-muted-foreground">Status</label>
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