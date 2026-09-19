import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getContasReceber, ContaReceber, updateContaReceber } from '@/services/contasReceber'
import { getContasPagar, ContaPagar, updateContaPagar } from '@/services/contasPagar'
import { createLancamento } from '@/services/lancamentos'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Check } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function PrevistoRealizado() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [receber, setReceber] = useState<ContaReceber[]>([])
  const [pagar, setPagar] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))

  const loadData = async () => {
    try {
      const [r, p] = await Promise.all([
        getContasReceber({ sort: 'vencimento', expand: 'cliente' }),
        getContasPagar({ sort: 'vencimento', expand: 'categoria' }),
      ])
      setReceber(r as any)
      setPagar(p as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('contas_receber', loadData)
  useRealtime('contas_pagar', loadData)

  const hoje = new Date().toISOString().slice(0, 10)

  const criarLancamento = async (
    descricao: string,
    valor: number,
    tipo: 'entrada' | 'saida',
    data: string,
  ) => {
    await createLancamento({
      data,
      descricao,
      valor,
      tipo,
      origem: 'manual',
      conciliado: true,
      owner: ownerId,
    })
  }

  const conciliarReceber = async (c: ContaReceber) => {
    await criarLancamento(c.descricao, Number(c.valor), 'entrada', hoje)
    await updateContaReceber(c.id, { status: 'realizado', data_recebimento: hoje })
    loadData()
  }

  const conciliarPagar = async (c: ContaPagar) => {
    await criarLancamento(c.descricao, Number(c.valor), 'saida', hoje)
    await updateContaPagar(c.id, { status: 'realizado', data_pagamento: hoje })
    loadData()
  }

  const doMes = (venc: string) => venc.slice(0, 7) === mes

  const receberMes = receber.filter(
    (c) => doMes(c.vencimento.slice(0, 10)) && c.status !== 'cancelado',
  )
  const pagarMes = pagar.filter((c) => doMes(c.vencimento.slice(0, 10)) && c.status !== 'cancelado')

  const resumo = useMemo(() => {
    const recPrev = receberMes
      .filter((c) => c.status === 'previsto')
      .reduce((s, c) => s + Number(c.valor), 0)
    const recReal = receberMes
      .filter((c) => c.status === 'realizado')
      .reduce((s, c) => s + Number(c.valor), 0)
    const pagPrev = pagarMes
      .filter((c) => c.status === 'previsto')
      .reduce((s, c) => s + Number(c.valor), 0)
    const pagReal = pagarMes
      .filter((c) => c.status === 'realizado')
      .reduce((s, c) => s + Number(c.valor), 0)
    return { recPrev, recReal, pagPrev, pagReal }
  }, [receberMes, pagarMes])

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Previsto x Realizado</h1>
          <p className="text-sm text-muted-foreground">
            Conciliação: o que estava previsto contra o que de fato aconteceu
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mês</Label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Receber previsto</div>
            <div className="text-lg font-bold">{fmtBRL(resumo.recPrev)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Receber realizado</div>
            <div className="text-lg font-bold text-green-600">{fmtBRL(resumo.recReal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Pagar previsto</div>
            <div className="text-lg font-bold">{fmtBRL(resumo.pagPrev)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Pagar realizado</div>
            <div className="text-lg font-bold text-red-600">{fmtBRL(resumo.pagReal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Receber */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold mb-3">A receber</h2>
          {receberMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta neste mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Vencimento</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {receberMes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(c.vencimento.slice(0, 10) + 'T00:00:00').toLocaleDateString(
                          'pt-BR',
                        )}
                      </td>
                      <td className="py-2 pr-4">{c.descricao}</td>
                      <td className="py-2 pr-4 text-right font-semibold">
                        {fmtBRL(Number(c.valor))}
                      </td>
                      <td className="py-2 pr-4">
                        {c.status === 'realizado' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Realizado
                          </Badge>
                        ) : c.vencimento.slice(0, 10) < hoje ? (
                          <Badge variant="destructive">Vencido</Badge>
                        ) : (
                          <Badge variant="secondary">Previsto</Badge>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {c.status === 'previsto' && (
                          <Button variant="ghost" size="sm" onClick={() => conciliarReceber(c)}>
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

      {/* Pagar */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-base font-semibold mb-3">A pagar</h2>
          {pagarMes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta neste mês.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Vencimento</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pagarMes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(c.vencimento.slice(0, 10) + 'T00:00:00').toLocaleDateString(
                          'pt-BR',
                        )}
                      </td>
                      <td className="py-2 pr-4">{c.descricao}</td>
                      <td className="py-2 pr-4 text-right font-semibold">
                        {fmtBRL(Number(c.valor))}
                      </td>
                      <td className="py-2 pr-4">
                        {c.status === 'realizado' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Realizado
                          </Badge>
                        ) : c.vencimento.slice(0, 10) < hoje ? (
                          <Badge variant="destructive">Vencido</Badge>
                        ) : (
                          <Badge variant="secondary">Previsto</Badge>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {c.status === 'previsto' && (
                          <Button variant="ghost" size="sm" onClick={() => conciliarPagar(c)}>
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
