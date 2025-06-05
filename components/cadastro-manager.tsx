// components/cadastro-manager.tsx
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Edit, Trash2, Plus, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CadastroItemData } from "@/lib/supabase"

interface CadastroManagerProps {
  onUploadSuccess?: () => void
}

export function CadastroManager({ onUploadSuccess }: CadastroManagerProps) {
  const [items, setItems] = useState<CadastroItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'descricao' | 'material'>('descricao')
  const [editingItem, setEditingItem] = useState<CadastroItemData | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const { toast } = useToast()

  const fetchItems = async (page: number = 1, search: string = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      if (search.trim()) {
        if (searchType === 'material') {
          params.append('material', search.trim())
        } else {
          params.append('search', search.trim())
        }
      }

      const response = await fetch(`/api/cadastro/items?${params}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao buscar itens')
      }

      setItems(result.data || [])
      setPagination(result.pagination)
    } catch (error) {
      console.error('Erro ao buscar itens:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao buscar itens',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchItems(1, searchTerm)
  }

  const handleEdit = (item: CadastroItemData) => {
    setEditingItem({ ...item })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      const response = await fetch('/api/cadastro/items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingItem)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao atualizar item')
      }

      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso"
      })

      setIsEditDialogOpen(false)
      setEditingItem(null)
      fetchItems(pagination.page, searchTerm)
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao atualizar item',
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este item?')) return

    try {
      const response = await fetch(`/api/cadastro/items?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover item')
      }

      toast({
        title: "Sucesso",
        description: "Item removido com sucesso"
      })

      fetchItems(pagination.page, searchTerm)
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao remover item',
        variant: "destructive"
      })
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    fetchItems(newPage, searchTerm)
  }

  useEffect(() => {
    fetchItems()
  }, [])

  return (
    <div className="space-y-6">
      {/* Busca */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Pesquisar Itens</CardTitle>
          <CardDescription>Busque por código do material ou descrição. Um material pode ter várias unidades de medida.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Termo de busca</Label>
              <Input
                id="search"
                placeholder={searchType === 'material' ? 'Digite o código do material' : 'Digite a descrição'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="w-48">
              <Label>Tipo de busca</Label>
              <Select value={searchType} onValueChange={(value: 'descricao' | 'material') => setSearchType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descricao">Por Descrição</SelectItem>
                  <SelectItem value="material">Por Material</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Itens Cadastrados</CardTitle>
              <CardDescription>
                {pagination.total} registros encontrados (material pode aparecer várias vezes com UMs diferentes)
              </CardDescription>
            </div>
            <Button onClick={() => fetchItems(pagination.page, searchTerm)} disabled={loading}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>UM</TableHead>
                      <TableHead>Qtd/Caixa</TableHead>
                      <TableHead>Contador</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.id}</TableCell>
                        <TableCell className="font-medium">{item.material}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.descricao}>
                          {item.descricao}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.um}</Badge>
                        </TableCell>
                        <TableCell>{item.qtd_por_caixa}</TableCell>
                        <TableCell>{item.contador}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {loading ? 'Carregando itens...' : 'Nenhum item encontrado. Faça upload de uma planilha ou ajuste sua busca.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Altere os dados do item {editingItem?.material} - {editingItem?.um}
            </DialogDescription>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-material">Material</Label>
                  <Input
                    id="edit-material"
                    value={editingItem.material}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-um">UM</Label>
                  <Input
                    id="edit-um"
                    value={editingItem.um}
                    onChange={(e) => setEditingItem({ ...editingItem, um: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Input
                  id="edit-descricao"
                  value={editingItem.descricao}
                  onChange={(e) => setEditingItem({ ...editingItem, descricao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-qtd-caixa">Qtd/Caixa</Label>
                  <Input
                    id="edit-qtd-caixa"
                    type="number"
                    value={editingItem.qtd_por_caixa}
                    onChange={(e) => setEditingItem({ ...editingItem, qtd_por_caixa: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-contador">Contador</Label>
                  <Input
                    id="edit-contador"
                    type="number"
                    value={editingItem.contador}
                    onChange={(e) => setEditingItem({ ...editingItem, contador: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}