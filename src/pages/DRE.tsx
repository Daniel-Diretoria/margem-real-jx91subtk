import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getLancamentos, Lancamento } from '@/services/lancamentos'
import { getPlanoContas, PlanoConta } from '@/services/planoContas'
import { getClientes, Cliente } from '@/services/clientes'
import { calcularDRE, calcularDREPorCliente, DRE } from '@/lib/dre'
import { useAuth } from '@/hooks/use-auth'
import {
  createFechamento,
  updateFechamento,
  getFechamento,
  Fechamento,
} from '@/services/fechamentos'
import { Download } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const mesesNome = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export default function DREPage() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [fechamento, setFechamento] = useState<Fechamento | null>(null)
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7))
  const [decisao, setDecisao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    Promise.all([getLancamentos({ sort: 'data' }), getPlanoContas(), getClientes()])
      .then(([l, pc, cl]) => {
        setLancamentos(l as any)
        setCategorias(pc as any)
        setClientes(cl as any)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSalvo(false)
    setDecisao('')
    getFechamento(mes).then((f: Fechamento | null) => {
      if (f) {
        setFechamento(f)
        setDecisao(f.decisao || '')
      } else {
        setFechamento(null)
      }
    })
  }, [mes])

  const doMes = useMemo(
    () => lancamentos.filter((l) => l.data.slice(0, 7) === mes),
    [lancamentos, mes],
  )

  const dre = useMemo(() => calcularDRE(doMes, categorias), [doMes, categorias])
  const dreAnterior = useMemo(() => {
    const [y, m] = mes.split('-').map(Number)
    const prev = new Date(y, m - 2, 1)
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
    const doMesAnterior = lancamentos.filter((l) => l.data.slice(0, 7) === prevKey)
    return { key: prevKey, dre: calcularDRE(doMesAnterior, categorias) }
  }, [lancamentos, categorias, mes])

  const porCliente = useMemo(
    () => calcularDREPorCliente(doMes, categorias, clientes),
    [doMes, categorias, clientes],
  )

  const variacao = (atual: number, anterior: number) => {
    if (!anterior) return null
    return ((atual - anterior) / Math.abs(anterior)) * 100
  }

  const salvarDecisao = async (fechar: boolean) => {
    setSalvando(true)
    try {
      const payload = {
        mes,
        status: fechar ? ('fechado' as const) : ('aberto' as const),
        decisao,
        dre,
        owner: ownerId,
      }
      if (fechamento) {
        await updateFechamento(fechamento.id, payload)
      } else {
        const f = await createFechamento(payload)
        setFechamento(f as any)
      }
      setSalvo(true)
    } finally {
      setSalvando(false)
    }
  }

  const exportarCSV = () => {
    const linhas: string[] = []
    linhas.push(`DRE Gerencial;${mes}`)
    linhas.push('')
    linhas.push('Linha;Valor')
    for (const l of dre.linhas) {
      linhas.push(`"${l.nome}";${l.valor.toFixed(2)}`)
      for (const f of l.filhos || []) {
        linhas.push(`"  ${f.nome}";${f.valor.toFixed(2)}`)
      }
    }
    linhas.push('')
    linhas.push(`Margem;${dre.margemPct.toFixed(1)}%`)
    const csv = linhas.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dre-${mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  const [y, m] = mes.split('-').map(Number)
  const mesNome = `${mesesNome[m - 1]} ${y}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">DRE Gerencial</h1>
          <p className="text-sm text-muted-foreground">Demonstrativo de resultado do mês</p>
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Mês</Label>
            <Input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="consolidada">
        <TabsList>
          <TabsTrigger value="consolidada">Consolidada</TabsTrigger>
          <TabsTrigger value="clientes">Por cliente</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="consolidada" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead className="text-right">{mesNome}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dre.linhas.map((l) => (
                    <TableRow key={l.nome}>
                      <TableCell
                        className={
                          l.nome.startsWith('=')
                            ? 'font-bold'
                            : l.nome.startsWith('(−)')
                              ? 'text-muted-foreground'
                              : 'font-medium'
                        }
                      >
                        {l.nome}
                      </TableCell>
                      <TableCell
                        className={
                          'text-right ' +
                          (l.nome.startsWith('=') ? 'font-bold' : '') +
                          (l.valor < 0 ? ' text-red-600' : '')
                        }
                      >
                        {fmtBRL(l.valor)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-bold">Margem líquida</TableCell>
                    <TableCell className="text-right font-bold">
                      {dre.margemPct.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Decisão do fechamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Decisão do mês {fechamento?.status === 'fechado' ? '· FECHADO' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="O que você decidiu com esses números? Ajustes, cortes, negociações, investimentos…"
                value={decisao}
                onChange={(e) => setDecisao(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={() => salvarDecisao(false)} disabled={salvando}>
                  {salvando ? 'Salvando…' : salvo ? 'Salvo ✓' : 'Salvar rascunho'}
                </Button>
                <Button variant="outline" onClick={() => salvarDecisao(true)} disabled={salvando}>
                  Fechar mês
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardContent className="pt-6">
              {porCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum lançamento vinculado a cliente neste mês.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">Despesas</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porCliente.map(({ cliente, dre: d }) => (
                      <TableRow key={cliente.id}>
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell className="text-right">{fmtBRL(d.receitaBruta)}</TableCell>
                        <TableCell className="text-right">{fmtBRL(d.custos)}</TableCell>
                        <TableCell className="text-right">
                          {fmtBRL(d.despesasOperacionais)}
                        </TableCell>
                        <TableCell
                          className={
                            'text-right font-semibold ' + (d.lucroLiquido < 0 ? 'text-red-600' : '')
                          }
                        >
                          {fmtBRL(d.lucroLiquido)}
                        </TableCell>
                        <TableCell className="text-right">{d.margemPct.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparativo">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead className="text-right">{mesNome}</TableHead>
                    <TableHead className="text-right">Mês anterior</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(['receitaBruta', 'custos', 'ebitda', 'lucroLiquido'] as const).map((k) => {
                    const nomes: Record<string, string> = {
                      receitaBruta: 'Receita bruta',
                      custos: 'Custos',
                      ebitda: 'EBITDA',
                      lucroLiquido: 'Lucro líquido',
                    }
                    const v = variacao(dre[k], dreAnterior.dre[k])
                    return (
                      <TableRow key={k}>
                        <TableCell className="font-medium">{nomes[k]}</TableCell>
                        <TableCell className="text-right">{fmtBRL(dre[k])}</TableCell>
                        <TableCell className="text-right">{fmtBRL(dreAnterior.dre[k])}</TableCell>
                        <TableCell
                          className={
                            'text-right ' +
                            (v === null ? '' : v >= 0 ? 'text-green-600' : 'text-red-600')
                          }
                        >
                          {v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
