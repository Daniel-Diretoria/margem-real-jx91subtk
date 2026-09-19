import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getLancamentos, updateLancamento, Lancamento } from '@/services/lancamentos'
import { getClientes, Cliente } from '@/services/clientes'
import { useRealtime } from '@/hooks/use-realtime'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function Rateio() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [filtroCliente, setFiltroCliente] = useState('todos')
  const [busca, setBusca] = useState('')
  const [salvandoId, setSalvandoId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      const [l, cl] = await Promise.all([
        getLancamentos({ sort: '-data', expand: 'categoria,cliente' }),
        getClientes(),
      ])
      setLancamentos(l as any)
      setClientes(cl as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lancamentos', loadData)

  const semCliente = useMemo(
    () => lancamentos.filter((l) => l.tipo === 'saida' && !l.cliente && l.data.slice(0, 7) === mes),
    [lancamentos, mes],
  )

  const doMes = useMemo(
    () => lancamentos.filter((l) => l.data.slice(0, 7) === mes),
    [lancamentos, mes],
  )

  const sugeridos = useMemo(() => {
    // sugestão: cliente mais frequente nos lançamentos com cliente definido
    const contagem: Record<string, number> = {}
    for (const l of lancamentos) {
      if (l.cliente) contagem[l.cliente] = (contagem[l.cliente] || 0) + 1
    }
    const ordenados = Object.entries(contagem).sort((a, b) => b[1] - a[1])
    return ordenados.map(([id]) => id)
  }, [lancamentos])

  const alocar = async (l: Lancamento, clienteId: string) => {
    setSalvandoId(l.id)
    try {
      await updateLancamento(l.id, { cliente: clienteId })
      await loadData()
    } finally {
      setSalvandoId(null)
    }
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  const lista = semCliente.filter((l) => {
    if (filtroCliente !== 'todos') return true
    if (!busca) return true
    return l.descricao.toLowerCase().includes(busca.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rateio por cliente</h1>
        <p className="text-sm text-muted-foreground">
          Aloque os custos sem cliente definido — o sistema sugere o mais frequente
        </p>
      </div>

      <div className="flex gap-3 flex-wrap items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Mês</Label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Buscar</Label>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por descrição…"
            className="w-56"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sem cliente definido ({lista.length}) —{' '}
            {fmtBRL(lista.reduce((s, l) => s + Number(l.valor), 0))}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tudo alocado neste mês. 👍</p>
          ) : (
            <div className="space-y-2">
              {lista.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 border rounded-md px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{l.descricao}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.data.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR')} ·{' '}
                      {fmtBRL(Number(l.valor))}
                      {l.expand?.categoria ? ` · ${l.expand.categoria.nome}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sugeridos[0] && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={salvandoId === l.id}
                        onClick={() => alocar(l, sugeridos[0])}
                      >
                        Sugestão: {clientes.find((c) => c.id === sugeridos[0])?.nome || '—'}
                      </Button>
                    )}
                    <Select onValueChange={(v) => alocar(l, v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Alocar para…" />
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Já alocados no mês</CardTitle>
        </CardHeader>
        <CardContent>
          {doMes.filter((l) => l.cliente).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento com cliente neste mês.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {doMes
                    .filter((l) => l.cliente)
                    .map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {new Date(l.data.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2 pr-4">{l.descricao}</td>
                        <td className="py-2 pr-4">
                          <Select
                            value={l.cliente}
                            onValueChange={(v) => alocar(l, v)}
                            disabled={salvandoId === l.id}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {clientes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold whitespace-nowrap">
                          {fmtBRL(Number(l.valor))}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={salvandoId === l.id}
                            onClick={() => alocar(l, '')}
                          >
                            remover
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
