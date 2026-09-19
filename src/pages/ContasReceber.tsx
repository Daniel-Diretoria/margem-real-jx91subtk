import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Card, CardContent } from '@/components/ui/card'
import {
  getContasReceber,
  createContaReceber,
  updateContaReceber,
  ContaReceber,
} from '@/services/contasReceber'
import { getClientes, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'
import { Plus, Check } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ContasReceber() {
  const [items, setItems] = useState<ContaReceber[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [descricao, setDescricao] = useState('')
  const [cliente, setCliente] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const loadData = async () => {
    try {
      const [r, cl] = await Promise.all([
        getContasReceber({ sort: 'vencimento', expand: 'cliente' }),
        getClientes(),
      ])
      setItems(r as any)
      setClientes(cl as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('contas_receber', loadData)

  const hoje = new Date().toISOString().slice(0, 10)

  const resumo = useMemo(() => {
    const previstos = items.filter((c) => c.status === 'previsto')
    const vencidos = previstos.filter((c) => c.vencimento < hoje)
    const aVencer = previstos.filter((c) => c.vencimento >= hoje)
    return {
      total: previstos.reduce((s, c) => s + Number(c.valor), 0),
      vencido: vencidos.reduce((s, c) => s + Number(c.valor), 0),
      qtdVencido: vencidos.length,
      aVencer: aVencer.reduce((s, c) => s + Number(c.valor), 0),
    }
  }, [items, hoje])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!descricao || !valor || !vencimento) {
      setErro('Preencha descrição, valor e vencimento.')
      return
    }
    setSaving(true)
    try {
      await createContaReceber({
        descricao,
        cliente: cliente || undefined,
        valor: Number(valor),
        vencimento,
        status: 'previsto',
      })
      setOpen(false)
      setDescricao('')
      setValor('')
      setCliente('')
    } catch (err: any) {
      setErro('Erro ao salvar. Verifique os campos.')
    } finally {
      setSaving(false)
    }
  }

  const marcarRecebido = async (c: ContaReceber) => {
    await updateContaReceber(c.id, { status: 'realizado', data_recebimento: hoje })
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contas a receber</h1>
          <p className="text-sm text-muted-foreground">Boletos e parcelas das indústrias</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nova conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta a receber</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label>Vencimento</Label>
                  <Input
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Cliente</Label>
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
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total a receber</div>
            <div className="text-lg font-bold">{fmtBRL(resumo.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Vencido ({resumo.qtdVencido})</div>
            <div className="text-lg font-bold text-red-600">{fmtBRL(resumo.vencido)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">A vencer</div>
            <div className="text-lg font-bold text-green-600">{fmtBRL(resumo.aVencer)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {items.filter((c) => c.status !== 'cancelado').length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Vencimento</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {items
                    .filter((c) => c.status !== 'cancelado')
                    .map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 pr-4">{c.descricao}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {c.expand?.cliente?.nome || '—'}
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold whitespace-nowrap">
                          {fmtBRL(Number(c.valor))}
                        </td>
                        <td className="py-2 pr-4">
                          {c.status === 'realizado' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Recebido
                            </Badge>
                          ) : c.vencimento < hoje ? (
                            <Badge variant="destructive">Vencido</Badge>
                          ) : (
                            <Badge variant="secondary">Previsto</Badge>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {c.status === 'previsto' && (
                            <Button variant="ghost" size="sm" onClick={() => marcarRecebido(c)}>
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
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
