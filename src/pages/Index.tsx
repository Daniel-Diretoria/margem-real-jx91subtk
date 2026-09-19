import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLancamentos, Lancamento } from '@/services/lancamentos'
import { getContasReceber, ContaReceber } from '@/services/contasReceber'
import { getContasPagar, ContaPagar } from '@/services/contasPagar'
import { useRealtime } from '@/hooks/use-realtime'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const monthKey = (d: string) => (d ? d.slice(0, 7) : '')

export default function Index() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [receber, setReceber] = useState<ContaReceber[]>([])
  const [pagar, setPagar] = useState<ContaPagar[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [l, r, p] = await Promise.all([
        getLancamentos({ sort: '-data' }),
        getContasReceber({ sort: 'vencimento' }),
        getContasPagar({ sort: 'vencimento' }),
      ])
      setLancamentos(l as any)
      setReceber(r as any)
      setPagar(p as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('lancamentos', loadData)
  useRealtime('contas_receber', loadData)
  useRealtime('contas_pagar', loadData)

  const hoje = new Date().toISOString().slice(0, 10)
  const mesAtual = hoje.slice(0, 7)

  const resumo = useMemo(() => {
    const doMes = lancamentos.filter((l) => monthKey(l.data) === mesAtual)
    const entradas = doMes
      .filter((l) => l.tipo === 'entrada')
      .reduce((s, l) => s + Number(l.valor), 0)
    const saidas = doMes.filter((l) => l.tipo === 'saida').reduce((s, l) => s + Number(l.valor), 0)
    const receberVencido = receber
      .filter((c) => c.status === 'previsto' && c.vencimento < hoje)
      .reduce((s, c) => s + Number(c.valor), 0)
    const pagarSemana = pagar
      .filter((c) => {
        if (c.status !== 'previsto') return false
        const limite = new Date()
        limite.setDate(limite.getDate() + 7)
        return c.vencimento <= limite.toISOString().slice(0, 10)
      })
      .reduce((s, c) => s + Number(c.valor), 0)
    return { entradas, saidas, saldo: entradas - saidas, receberVencido, pagarSemana }
  }, [lancamentos, receber, pagar, mesAtual, hoje])

  const cards = [
    { title: 'Entradas do mês', value: fmtBRL(resumo.entradas) },
    { title: 'Saídas do mês', value: fmtBRL(resumo.saidas) },
    { title: 'Saldo do mês', value: fmtBRL(resumo.saldo) },
    { title: 'A receber vencido', value: fmtBRL(resumo.receberVencido) },
    { title: 'A pagar em 7 dias', value: fmtBRL(resumo.pagarSemana) },
  ]

  if (loading) {
    return <div className="animate-pulse text-muted-foreground">Carregando…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted-foreground">Resumo financeiro do mês corrente</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {lancamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento ainda. Comece em Lançamentos ou importe um extrato.
            </p>
          ) : (
            <div className="space-y-2">
              {lancamentos.slice(0, 8).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                >
                  <div>
                    <div className="font-medium">{l.descricao}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      {l.expand?.categoria ? ` · ${l.expand.categoria.nome}` : ''}
                    </div>
                  </div>
                  <div
                    className={
                      l.tipo === 'entrada'
                        ? 'text-green-600 font-semibold'
                        : 'text-red-600 font-semibold'
                    }
                  >
                    {l.tipo === 'entrada' ? '+' : '−'} {fmtBRL(Number(l.valor))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
