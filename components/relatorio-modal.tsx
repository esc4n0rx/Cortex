"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RelatorioModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
}

const mockUsuarios = [
  { nome: "EDUA FSILVA", atend: 162, corte: 5, total: 168, percentual: 3.6 },
  { nome: "GUIL PEREIRA", atend: 156, corte: 5, total: 201, percentual: 2.5 },
  { nome: "ALEX JUNIOR", atend: 201, corte: 5, total: 206, percentual: 2.4 },
  { nome: "ALIS NASCIM", atend: 164, corte: 3, total: 167, percentual: 1.8 },
  { nome: "IAGO SOUZA", atend: 177, corte: 2, total: 179, percentual: 1.1 },
]

const mockItens = [
  { codigo: "165642", descricao: "SUCO UVA EMACA FFB HNT 500ML", qtdeCorte: 5, diasCorte: 1 },
  { codigo: "165641", descricao: "SUCO UVA LARANJA EMACA FFB HNT 500ML", qtdeCorte: 5, diasCorte: 1 },
  { codigo: "165922", descricao: "LINGUICA TOSCANA RESFRIADA kg", qtdeCorte: 4, diasCorte: 1 },
  { codigo: "165356", descricao: "OVO TIPO GRANDE RESFRIADO DZ KG", qtdeCorte: 2, diasCorte: 1 },
  { codigo: "152365", descricao: "HAMB VEG DEF CONG FUTURO BURGER 230g", qtdeCorte: 1, diasCorte: 1 },
]

const chartDataCorte = [
  { nome: "EDUA", percentual: 3.6 },
  { nome: "GUIL", percentual: 2.5 },
  { nome: "ALEX", percentual: 2.4 },
  { nome: "ALIS", percentual: 1.8 },
  { nome: "IAGO", percentual: 1.1 },
]

const chartDataCorteHistorico = [
  { dia: "10", percentual: 2.1 },
  { dia: "11", percentual: 2.8 },
  { dia: "12", percentual: 2.3 },
  { dia: "13", percentual: 4.2 },
  { dia: "14", percentual: 3.6 },
  { dia: "15", percentual: 4.8 },
]

export function RelatorioModal({ open, onOpenChange, data }: RelatorioModalProps) {
  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">
            Relatório Detalhado - {data.setor} ({new Date(data.data).toLocaleDateString("pt-BR")})
          </DialogTitle>
        </DialogHeader>

        {/* Layout 2x2 compacto */}
        <div className="grid grid-cols-2 gap-4 h-[70vh]">
          {/* Superior Esquerdo - Ranking Usuários */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="bg-teal-500/10 py-2 border-b border-teal-500/20">
              <CardTitle className="text-teal-400 text-center text-sm font-bold">
                {data.setor.toUpperCase()} - RANKING USUÁRIOS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-teal-500/20 sticky top-0">
                  <tr>
                    <th className="p-1 text-left font-semibold">SEPARADOR</th>
                    <th className="p-1 text-center font-semibold">ATEND</th>
                    <th className="p-1 text-center font-semibold">CORTE</th>
                    <th className="p-1 text-center font-semibold">TOTAL</th>
                    <th className="p-1 text-center font-semibold">%CORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsuarios.map((usuario, index) => (
                    <tr key={index} className="border-b border-border/30">
                      <td className="p-1 font-medium text-xs">{usuario.nome}</td>
                      <td className="p-1 text-center">{usuario.atend}</td>
                      <td className="p-1 text-center">{usuario.corte}</td>
                      <td className="p-1 text-center">{usuario.total}</td>
                      <td className="p-1 text-center">
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 ${
                            usuario.percentual > 3
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : usuario.percentual > 2
                                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                : "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}
                        >
                          {usuario.percentual}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Superior Direito - Gráfico de Corte */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="py-2">
              <CardTitle className="text-center text-sm font-bold">% de Corte por Operador</CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-full">
              <ChartContainer
                config={{
                  percentual: {
                    label: "% Corte",
                    color: "#3b82f6",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataCorte} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="percentual" fill="#3b82f6" radius={2} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Inferior Esquerdo - Ranking Itens */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="bg-teal-500/10 py-2 border-b border-teal-500/20">
              <CardTitle className="text-teal-400 text-center text-sm font-bold">
                {data.setor.toUpperCase()} - RANKING ITENS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-full overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-teal-500/20 sticky top-0">
                  <tr>
                    <th className="p-1 text-left font-semibold">MAT</th>
                    <th className="p-1 text-left font-semibold">DESC_MATERIAL</th>
                    <th className="p-1 text-center font-semibold">Qtde CORTE</th>
                    <th className="p-1 text-center font-semibold">Dias CORTE</th>
                  </tr>
                </thead>
                <tbody>
                  {mockItens.map((item, index) => (
                    <tr key={index} className="border-b border-border/30">
                      <td className="p-1 font-medium">{item.codigo}</td>
                      <td className="p-1 text-xs">{item.descricao}</td>
                      <td className="p-1 text-center">{item.qtdeCorte}</td>
                      <td className="p-1 text-center">{item.diasCorte}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Inferior Direito - Gráfico de Volume */}
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="py-2">
              <CardTitle className="text-center text-sm font-bold">% de Corte por Dia</CardTitle>
            </CardHeader>
            <CardContent className="p-2 h-full">
              <ChartContainer
                config={{
                  percentual: {
                    label: "% Corte",
                    color: "#10b981",
                  },
                }}
                className="h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataCorteHistorico} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 6]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="percentual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
