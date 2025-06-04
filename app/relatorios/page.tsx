"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BarChart3, Eye, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { RelatorioModal } from "@/components/relatorio-modal"

const mockData = [
  {
    id: 1,
    data: "2024-01-15",
    setor: "Perecíveis",
    totalCortado: 247,
    percentualCorte: 3.2,
    status: "normal",
  },
  {
    id: 2,
    data: "2024-01-14",
    setor: "Mercearia",
    totalCortado: 189,
    percentualCorte: 2.8,
    status: "bom",
  },
  {
    id: 3,
    data: "2024-01-14",
    setor: "Perecíveis",
    totalCortado: 312,
    percentualCorte: 4.1,
    status: "normal",
  },
  {
    id: 4,
    data: "2024-01-13",
    setor: "Mercearia",
    totalCortado: 156,
    percentualCorte: 2.3,
    status: "bom",
  },
  {
    id: 5,
    data: "2024-01-13",
    setor: "Perecíveis",
    totalCortado: 423,
    percentualCorte: 5.8,
    status: "alto",
  },
]

export default function Relatorios() {
  const [filtroSetor, setFiltroSetor] = useState("todos")
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)

  const dadosFiltrados = mockData.filter((item) => filtroSetor === "todos" || item.setor.toLowerCase() === filtroSetor)

  const handleViewDetails = (report: any) => {
    setSelectedReport(report)
    setModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "bom":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "normal":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "alto":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "bom":
        return <TrendingDown className="h-3 w-3" />
      case "alto":
        return <TrendingUp className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Relatórios</h1>
          </div>
        </div>

        <div className="mb-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre os relatórios por setor</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Selecionar setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  <SelectItem value="mercearia">Mercearia</SelectItem>
                  <SelectItem value="perecíveis">Perecíveis</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Histórico de Cortes</CardTitle>
            <CardDescription>Clique em um relatório para ver detalhes completos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dadosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-card/50 rounded-xl border hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold">{new Date(item.data).getDate()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.data).toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.setor}</h3>
                        <Badge variant="outline" className={getStatusColor(item.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.percentualCorte}%
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.totalCortado} itens cortados</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(item)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <RelatorioModal open={modalOpen} onOpenChange={setModalOpen} data={selectedReport} />
      </div>
    </div>
  )
}
