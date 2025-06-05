"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Users, Package, BarChart3, Download } from "lucide-react"

interface CorteResultadoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
}

export function CorteResultadoModal({ open, onOpenChange, data }: CorteResultadoModalProps) {
  if (!data) return null

  const getStatusColor = (percentual: number, meta: number) => {
    if (percentual <= meta) return "bg-green-500/20 text-green-400 border-green-500/30"
    if (percentual <= meta * 1.5) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    return "bg-red-500/20 text-red-400 border-red-500/30"
  }

  const getStatusIcon = (percentual: number, meta: number) => {
    if (percentual <= meta) return <TrendingDown className="h-4 w-4" />
    return <TrendingUp className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Resultado do Corte - {data.setor} ({new Date(data.data).toLocaleDateString("pt-BR")})
          </DialogTitle>
        </DialogHeader>

        {/* Resumo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Volume Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.resumo.volume_total}</div>
              <p className="text-xs text-muted-foreground">Linhas processadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Volume OK</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.resumo.volume_ok}</div>
              <p className="text-xs text-muted-foreground">Com estoque disponível</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Atendido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{data.resumo.volume_atendido}</div>
              <p className="text-xs text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Cortado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.resumo.volume_cortado}</div>
              <Badge 
                variant="outline" 
                className={`mt-1 ${getStatusColor(data.resumo.percentual_corte, data.resumo.meta_percentual)}`}
              >
                <div className="flex items-center gap-1">
                  {getStatusIcon(data.resumo.percentual_corte, data.resumo.meta_percentual)}
                  {data.resumo.percentual_corte}%
                </div>
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Status da Meta */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {data.resumo.status_meta === 'OK' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {data.resumo.status_meta === 'OK' ? 'Meta Atingida!' : 'Meta Excedida'}
                  </h3>
                  <p className="text-muted-foreground">
                    Percentual de corte: {data.resumo.percentual_corte}% (Meta: ≤{data.resumo.meta_percentual}%)
                  </p>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar Relatório
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes em Tabs */}
        <Tabs defaultValue="separadores" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="separadores" className="gap-2">
              <Users className="h-4 w-4" />
              Separadores
            </TabsTrigger>
            <TabsTrigger value="materiais" className="gap-2">
              <Package className="h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="graficos" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráficos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="separadores" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Separadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left font-semibold">Separador</th>
                        <th className="p-2 text-center font-semibold">Atendido</th>
                        <th className="p-2 text-center font-semibold">Cortado</th>
                        <th className="p-2 text-center font-semibold">Total</th>
                        <th className="p-2 text-center font-semibold">% Corte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.separadores.map((separador: any, index: number) => (
                        <tr key={index} className="border-b border-border/30">
                          <td className="p-2 font-medium">{separador.nome_usuario}</td>
                          <td className="p-2 text-center">{separador.total_atendido}</td>
                          <td className="p-2 text-center">{separador.total_cortado}</td>
                          <td className="p-2 text-center">{separador.total_atendido + separador.total_cortado}</td>
                          <td className="p-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs px-2 py-1 ${getStatusColor(separador.percentual_corte, data.resumo.meta_percentual)}`}
                            >
                              {separador.percentual_corte.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="materiais" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top 20 Materiais Cortados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="p-2 text-left font-semibold">Material</th>
                        <th className="p-2 text-left font-semibold">Descrição</th>
                        <th className="p-2 text-center font-semibold">Qtd Cortada</th>
                        <th className="p-2 text-center font-semibold">Linhas</th>
                        <th className="p-2 text-left font-semibold">Usuários</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materiais_cortados.map((material: any, index: number) => (
                        <tr key={index} className="border-b border-border/30">
                          <td className="p-2 font-medium font-mono">{material.material}</td>
                          <td className="p-2 text-xs max-w-xs truncate" title={material.descricao}>
                            {material.descricao}
                          </td>
                          <td className="p-2 text-center font-semibold">{material.total_cortado}</td>
                          <td className="p-2 text-center">{material.linhas_cortadas}</td>
                          <td className="p-2 text-xs">
                            {material.usuarios_cortaram.slice(0, 3).join(', ')}
                            {material.usuarios_cortaram.length > 3 && '...'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graficos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Gráfico de Separadores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-sm">% de Corte por Separador</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ChartContainer
                    config={{
                      percentual: {
                        label: "% Corte",
                        color: "#ef4444",
                      },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data.separadores.slice(0, 10)} 
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="nome_usuario" 
                          tick={{ fontSize: 10 }} 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="percentual_corte" fill="#ef4444" radius={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Materiais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-sm">Top 10 Materiais Cortados</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ChartContainer
                    config={{
                      total: {
                        label: "Quantidade",
                        color: "#3b82f6",
                      },
                    }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data.materiais_cortados.slice(0, 10)} 
                        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="material" 
                          tick={{ fontSize: 10 }} 
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 10 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="total_cortado" fill="#3b82f6" radius={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}