import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getLancamentos,
  createLancamento,
  deleteLancamento,
  Lancamento,
} from '@/services/lancamentos'
import { getPlanoContas, PlanoConta } from '@/services/planoContas'
import { getClientes, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Trash2 } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Lancamentos() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [items, setItems] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7))
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // form
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState('saida')
  const [categoria, setCategoria] = useState('')
  const [cliente, setCliente] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const loadData = async () => {
    try {
      const [l, pc, cl] = await Promise.all([
        getLancamentos({ sort: '-data,-created', expand: 'categoria,cliente' }),
        getPlanoContas(),
        getClientes(),
      ])
      setItems(l as any)
      setCategorias(pc as any)
      setClientes(cl as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lancamentos', loadData)

  const filtrados = useMemo(
    () =>
      items.filter((l) => {
        if (filtroMes && l.data.slice(0, 7) !== filtroMes) return false
        if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false
        return true
      }),
    [items, filtroMes, filtroTipo],
  )

  const totais = useMemo(() => {
    const entradas = filtrados
      .filter((l) => l.tipo === 'entrada')
      .reduce((s, l) => s + Number(l.valor), 0)
    const saidas = filtrados
      .filter((l) => l.tipo === 'saida')
      .reduce((s, l) => s + Number(l.valor), 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }, [filtrados])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!descricao || !valor || !data) {
      setErro('Preencha data, descrição e valor.')
      return
    }
    setSaving(true)
    try {
      await createLancamento({
        data,
        descricao,
        valor: Number(valor),
        tipo: tipo as 'entrada' | 'saida',
        categoria: categoria || undefined,
        cliente: cliente || undefined,
        origem: 'manual',
        conciliado: false,
        owner: ownerId,
      })
      setOpen(false)
      setDescricao('')
      setValor('')
      setCategoria('')
      setCliente('')
    } catch (err: any) {
      setErro(
        err?.response?.data ? 'Erro ao salvar. Verifique os campos.' : 'Erro ao salvar lançamento.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteLancamento(id)
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lançamentos</h1>
          <p className="text-sm text-muted-foreground">Entradas e saídas do movimento financeiro</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo lançamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome} ({c.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente (opcional)</Label>
                <Select value={cliente} onValueChange={setCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Entradas (filtro)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">{fmtBRL(totais.entradas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Saídas (filtro)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{fmtBRL(totais.saidas)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Saldo (filtro)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{fmtBRL(totais.saldo)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Mês</Label>
          <Input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {filtrados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum lançamento no filtro atual.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 pr-4">{l.descricao}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {l.expand?.categoria?.nome || '—'}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {l.expand?.cliente?.nome || '—'}
                      </td>
                      <td
                        className={
                          'py-2 pr-4 text-right font-semibold whitespace-nowrap ' +
                          (l.tipo === 'entrada' ? 'text-green-600' : 'text-red-600')
                        }
                      >
                        {l.tipo === 'entrada' ? '+' : '−'} {fmtBRL(Number(l.valor))}
                      </td>
                      <td className="py-2 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(l.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
