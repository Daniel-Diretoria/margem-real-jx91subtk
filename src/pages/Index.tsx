import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { getLancamentos, Lancamento } from '@/services/lancamentos'
import { getContasReceber, ContaReceber } from '@/services/contasReceber'
import { getContasPagar, ContaPagar } from '@/services/contasPagar'
import { getPlanoContas, PlanoConta } from '@/services/planoContas'
import { getClientes, Cliente } from '@/services/clientes'
import { calcularDRE, calcularDREPorCliente } from '@/lib/dre'
import { useRealtime } from '@/hooks/use-realtime'

const fmtBRL = (v: number) =>
  Math.abs(v) >= 1000
    ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'k'
    : fmtBRLFull(v)
const fmtBRLFull = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CORES = ['#16a34a', '#dc2626', '#2563eb', '#d97706', '#7c3aed', '#0891b2', '#be185d']

export default function Index() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [receber, setReceber] = useState<ContaReceber[]>([])
  const [pagar, setPagar] = useState<ContaPagar[]>([])
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [l, r, p, pc, cl] = await Promise.all([
        getLancamentos({ sort: '-data' }),
        getContasReceber({ sort: 'vencimento' }),
        getContasPagar({ sort: 'vencimento' }),
        getPlanoContas(),
        getClientes(),
      ])
      setLancamentos(l as any)
      setReceber(r as any)
      setPagar(p as any)
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
  useRealtime('contas_receber', loadData)
  useRealtime('contas_pagar', loadData)

  const hoje = new Date().toISOString().slice(0, 10)
  const mesAtual = hoje.slice(0, 7)

  // últimos 6 meses para o gráfico
  const meses6 = useMemo(() => {
    const out: string[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return out
  }, [])

  const dreMes = useMemo(
    () =>
      calcularDRE(
        lancamentos.filter((l) => l.data.slice(0, 7) === mesAtual),
        categorias,
      ),
    [lancamentos, categorias, mesAtual],
  )

  const evolucao = useMemo(
    () =>
      meses6.map((mk) => {
        const d = calcularDRE(
          lancamentos.filter((l) => l.data.slice(0, 7) === mk),
          categorias,
        )
        return {
          mes: mk.slice(5) + '/' + mk.slice(2, 4),
          Receita: d.receitaBruta,
          Custos: d.custos + d.despesasOperacionais + d.juros,
          Lucro: d.lucroLiquido,
        }
      }),
    [lancamentos, categorias, meses6],
  )

  const porCliente = useMemo(
    () =>
      calcularDREPorCliente(
        lancamentos.filter((l) => l.data.slice(0, 7) === mesAtual),
        categorias,
        clientes,
      ),
    [lancamentos, categorias, clientes, mesAtual],
  )

  const pizzaCustos = useMemo(() => {
    const doMes = lancamentos.filter((l) => l.data.slice(0, 7) === mesAtual && l.tipo === 'saida')
    const linhaPorCategoria: Record<string, string> = {}
    for (const c of categorias) linhaPorCategoria[c.id] = c.linha_dre
    const grupos: Record<string, number> = {}
    for (const l of doMes) {
      const linha = l.categoria ? linhaPorCategoria[l.categoria] || 'outras' : 'outras'
      const nome =
        linha === 'deducoes'
          ? 'Impostos'
          : linha === 'custos'
            ? 'Custos'
            : linha === 'despesas_operacionais'
              ? 'Despesas'
              : linha === 'juros'
                ? 'Juros'
                : 'Outras'
      grupos[nome] = (grupos[nome] || 0) + Number(l.valor)
    }
    return Object.entries(grupos).map(([nome, valor]) => ({ nome, valor }))
  }, [lancamentos, categorias, mesAtual])

  const receberVencido = receber
    .filter((c) => c.status === 'previsto' && c.vencimento.slice(0, 10) < hoje)
    .reduce((s, c) => s + Number(c.valor), 0)
  const pagarSemana = pagar
    .filter((c) => {
      if (c.status !== 'previsto') return false
      const limite = new Date()
      limite.setDate(limite.getDate() + 7)
      return c.vencimento.slice(0, 10) <= limite.toISOString().slice(0, 10)
    })
    .reduce((s, c) => s + Number(c.valor), 0)

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão executiva do mês corrente</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Receita do mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{fmtBRLFull(dreMes.receitaBruta)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Lucro líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={
                'text-lg font-bold ' + (dreMes.lucroLiquido < 0 ? 'text-red-600' : 'text-green-600')
              }
            >
              {fmtBRLFull(dreMes.lucroLiquido)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Margem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{dreMes.margemPct.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">EBITDA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{fmtBRLFull(dreMes.ebitda)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {(receberVencido > 0 || pagarSemana > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {receberVencido > 0 && (
            <Card className="border-red-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">A receber vencido</div>
                  <div className="text-lg font-bold text-red-600">{fmtBRLFull(receberVencido)}</div>
                </div>
                <Badge variant="destructive">Cobrar</Badge>
              </CardContent>
            </Card>
          )}
          {pagarSemana > 0 && (
            <Card className="border-amber-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">A pagar em 7 dias</div>
                  <div className="text-lg font-bold text-amber-600">{fmtBRLFull(pagarSemana)}</div>
                </div>
                <Badge className="bg-amber-100 text-amber-800">Atenção</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução — últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={evolucao}>
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis fontSize={11} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v: any) => fmtBRLFull(Number(v))} />
                <Legend />
                <Bar dataKey="Receita" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Lucro" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Composição das saídas do mês</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {pizzaCustos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem saídas lançadas neste mês.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pizzaCustos}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius={50}
                    outerRadius={90}
                  >
                    {pizzaCustos.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => fmtBRLFull(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Margem por cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Margem por cliente — mês corrente</CardTitle>
        </CardHeader>
        <CardContent>
          {porCliente.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum lançamento vinculado a cliente neste mês.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium text-right">Receita</th>
                    <th className="py-2 pr-4 font-medium text-right">Lucro</th>
                    <th className="py-2 pr-4 font-medium text-right">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {porCliente.map(({ cliente, dre: d }) => (
                    <tr key={cliente.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{cliente.nome}</td>
                      <td className="py-2 pr-4 text-right">{fmtBRLFull(d.receitaBruta)}</td>
                      <td
                        className={
                          'py-2 pr-4 text-right font-semibold ' +
                          (d.lucroLiquido < 0 ? 'text-red-600' : '')
                        }
                      >
                        {fmtBRLFull(d.lucroLiquido)}
                      </td>
                      <td className="py-2 pr-4 text-right">{d.margemPct.toFixed(1)}%</td>
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
