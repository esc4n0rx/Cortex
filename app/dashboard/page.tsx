import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, Settings, Scissors } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scissors className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">CorteX</h1>
          </div>
          <p className="text-muted-foreground text-lg">Sistema de Gerenciamento de Cortes - Centro de Distribuição</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/novo-corte">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Novo Corte</CardTitle>
                <CardDescription className="text-base">Gerar novo corte diário por setor</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  Criar Corte
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/relatorios">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Relatórios</CardTitle>
                <CardDescription className="text-base">Visualizar relatórios e estatísticas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" size="lg">
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/configuracoes">
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50 rounded-2xl">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Configurações</CardTitle>
                <CardDescription className="text-base">Uploads, cadastros e limpezas</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" size="lg">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cortes Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">+12% em relação a ontem</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">% Corte Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">Meta: {"<"} 5%</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Setores Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Mercearia e Perecíveis</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Operadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Ativos hoje</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
