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
  getContasPagar,
  createContaPagar,
  updateContaPagar,
  deleteContaPagar,
  ContaPagar,
} from '@/services/contasPagar'
import { getPlanoContas, PlanoConta } from '@/services/planoContas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Check, Trash2 } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function ContasPagar() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [items, setItems] = useState<ContaPagar[]>([])
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))
  const [categoria, setCategoria] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const loadData = async () => {
    try {
      const [p, pc] = await Promise.all([
        getContasPagar({ sort: 'vencimento', expand: 'categoria' }),
        getPlanoContas(),
      ])
      setItems(p as any)
      setCategorias(pc as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('contas_pagar', loadData)

  const hoje = new Date().toISOString().slice(0, 10)
  const limite = new Date()
  limite.setDate(limite.getDate() + 7)
  const limiteStr = limite.toISOString().slice(0, 10)

  const resumo = useMemo(() => {
    const previstos = items.filter((c) => c.status === 'previsto')
    const semana = previstos.filter((c) => c.vencimento.slice(0, 10) <= limiteStr)
    return {
      total: previstos.reduce((s, c) => s + Number(c.valor), 0),
      semana: semana.reduce((s, c) => s + Number(c.valor), 0),
      qtdSemana: semana.length,
    }
  }, [items, limiteStr])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!descricao || !valor || !vencimento) {
      setErro('Preencha descrição, valor e vencimento.')
      return
    }
    setSaving(true)
    try {
      await createContaPagar({
        descricao,
        valor: Number(valor),
        vencimento,
        categoria: categoria || undefined,
        status: 'previsto',
        owner: ownerId,
      })
      setOpen(false)
      setDescricao('')
      setValor('')
      setCategoria('')
    } catch (err: any) {
      setErro('Erro ao salvar. Verifique os campos.')
    } finally {
      setSaving(false)
    }
  }

  const marcarPago = async (c: ContaPagar) => {
    await updateContaPagar(c.id, { status: 'realizado', data_pagamento: hoje })
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contas a pagar</h1>
          <p className="text-sm text-muted-foreground">Fornecedores, impostos e encargos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Nova conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta a pagar</DialogTitle>
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
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias
                      .filter((c) => c.tipo === 'despesa')
                      .map((c) => (
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total a pagar</div>
            <div className="text-lg font-bold">{fmtBRL(resumo.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">
              Vence em 7 dias ({resumo.qtdSemana})
            </div>
            <div className="text-lg font-bold text-amber-600">{fmtBRL(resumo.semana)}</div>
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
                    <th className="py-2 pr-4 font-medium">Categoria</th>
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
                          {new Date(c.vencimento.slice(0, 10) + 'T00:00:00').toLocaleDateString(
                            'pt-BR',
                          )}
                        </td>
                        <td className="py-2 pr-4">{c.descricao}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {c.expand?.categoria?.nome || '—'}
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold whitespace-nowrap">
                          {fmtBRL(Number(c.valor))}
                        </td>
                        <td className="py-2 pr-4">
                          {c.status === 'realizado' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Pago
                            </Badge>
                          ) : c.vencimento.slice(0, 10) < hoje ? (
                            <Badge variant="destructive">Vencido</Badge>
                          ) : (
                            <Badge variant="secondary">Previsto</Badge>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-1">
                            {c.status === 'previsto' && (
                              <Button variant="ghost" size="sm" onClick={() => marcarPago(c)}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await deleteContaPagar(c.id)
                                loadData()
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
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
