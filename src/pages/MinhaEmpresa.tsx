import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { getCnpjs, createCnpj, Cnpj } from '@/services/cnpjs'
import { getContasBancarias, createContaBancaria, ContaBancaria } from '@/services/contasBancarias'
import { getContratos, createContrato, Contrato } from '@/services/contratos'
import { getClientes, Cliente } from '@/services/clientes'
import { getPromotores, Promotor } from '@/services/promotores'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Trash2 } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function MinhaEmpresa() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [cnpjs, setCnpjs] = useState<Cnpj[]>([])
  const [contas, setContas] = useState<ContaBancaria[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [promotores, setPromotores] = useState<Promotor[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [cs, cts, ctr, cl, pr] = await Promise.all([
        getCnpjs(),
        getContasBancarias(),
        getContratos(),
        getClientes(),
        getPromotores(),
      ])
      setCnpjs(cs as any)
      setContas(cts as any)
      setContratos(ctr as any)
      setClientes(cl as any)
      setPromotores(pr as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('cnpjs', loadData)
  useRealtime('contas_bancarias', loadData)
  useRealtime('contratos', loadData)

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha empresa</h1>
        <p className="text-sm text-muted-foreground">CNPJs, contas bancárias/cartões e contratos</p>
      </div>

      <Tabs defaultValue="cnpjs">
        <TabsList>
          <TabsTrigger value="cnpjs">CNPJs</TabsTrigger>
          <TabsTrigger value="contas">Contas e cartões</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="cnpjs">
          <CnpjsTab cnpjs={cnpjs} reload={loadData} ownerId={ownerId} />
        </TabsContent>
        <TabsContent value="contas">
          <ContasTab contas={contas} cnpjs={cnpjs} reload={loadData} ownerId={ownerId} />
        </TabsContent>
        <TabsContent value="contratos">
          <ContratosTab
            contratos={contratos}
            clientes={clientes}
            cnpjs={cnpjs}
            promotores={promotores}
            reload={loadData}
            ownerId={ownerId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CnpjsTab({
  cnpjs,
  reload,
  ownerId,
}: {
  cnpjs: Cnpj[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [razao, setRazao] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [apelido, setApelido] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!razao || !cnpj) {
      setErro('Informe razão social e CNPJ.')
      return
    }
    setSaving(true)
    try {
      await createCnpj({ razao_social: razao, cnpj, apelido, ativo: true, owner: ownerId })
      setOpen(false)
      setRazao('')
      setCnpj('')
      setApelido('')
      reload()
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo CNPJ
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {cnpjs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum CNPJ cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Apelido</th>
                    <th className="py-2 pr-4 font-medium">Razão social</th>
                    <th className="py-2 pr-4 font-medium">CNPJ</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {cnpjs.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.apelido || '—'}</td>
                      <td className="py-2 pr-4">{c.razao_social}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.cnpj}</td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const { deleteCnpj } = await import('@/services/cnpjs')
                            await deleteCnpj(c.id)
                            reload()
                          }}
                        >
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo CNPJ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Razão social</Label>
              <Input value={razao} onChange={(e) => setRazao(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apelido</Label>
                <Input
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Ex.: Diretoria"
                />
              </div>
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContasTab({
  contas,
  cnpjs,
  reload,
  ownerId,
}: {
  contas: ContaBancaria[]
  cnpjs: Cnpj[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [apelido, setApelido] = useState('')
  const [tipo, setTipo] = useState('conta_corrente')
  const [banco, setBanco] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [limite, setLimite] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!apelido) {
      setErro('Informe o apelido.')
      return
    }
    setSaving(true)
    try {
      await createContaBancaria({
        apelido,
        tipo: tipo as any,
        banco,
        cnpj: cnpj || undefined,
        limite: Number(limite) || 0,
        ativo: true,
        owner: ownerId,
      })
      setOpen(false)
      setApelido('')
      setBanco('')
      setLimite('')
      setCnpj('')
      reload()
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova conta/cartão
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {contas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Apelido</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Banco</th>
                    <th className="py-2 pr-4 font-medium">CNPJ</th>
                    <th className="py-2 pr-4 font-medium text-right">Limite</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.apelido}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary">
                          {c.tipo === 'cartao'
                            ? 'Cartão'
                            : c.tipo === 'poupanca'
                              ? 'Poupança'
                              : 'Conta corrente'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.banco || '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {c.expand?.cnpj?.apelido || '—'}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {c.tipo === 'cartao' && c.limite ? fmtBRL(Number(c.limite)) : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const { deleteContaBancaria } =
                              await import('@/services/contasBancarias')
                            await deleteContaBancaria(c.id)
                            reload()
                          }}
                        >
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova conta ou cartão</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Apelido</Label>
                <Input
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Ex.: Inter DP"
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
                    <SelectItem value="conta_corrente">Conta corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Input
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                  placeholder="Ex.: Inter"
                />
              </div>
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <Select value={cnpj} onValueChange={setCnpj}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cnpjs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.apelido || c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {tipo === 'cartao' && (
              <div className="space-y-1.5">
                <Label>Limite (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={limite}
                  onChange={(e) => setLimite(e.target.value)}
                />
              </div>
            )}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContratosTab({
  contratos,
  clientes,
  cnpjs,
  promotores,
  reload,
  ownerId,
}: {
  contratos: Contrato[]
  clientes: Cliente[]
  cnpjs: Cnpj[]
  promotores: Promotor[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [cliente, setCliente] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!cliente) {
      setErro('Selecione o cliente (indústria).')
      return
    }
    setSaving(true)
    try {
      await createContrato({
        cliente,
        cnpj: cnpj || undefined,
        descricao,
        valor_mensal: Number(valor) || 0,
        data_inicio: dataInicio || undefined,
        ativo: true,
        owner: ownerId,
      })
      setOpen(false)
      setCliente('')
      setCnpj('')
      setDescricao('')
      setValor('')
      setDataInicio('')
      reload()
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo contrato
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {contratos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">CNPJ (nosso)</th>
                    <th className="py-2 pr-4 font-medium">Valor mensal</th>
                    <th className="py-2 pr-4 font-medium">Promotores</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((c) => {
                    const timeDoContrato = promotores.filter((p) => p.cliente === c.cliente)
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{c.expand?.cliente?.nome || '—'}</td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {c.expand?.cnpj?.apelido || '—'}
                        </td>
                        <td className="py-2 pr-4 whitespace-nowrap">
                          {fmtBRL(Number(c.valor_mensal))}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {timeDoContrato.length > 0
                            ? timeDoContrato.map((p) => p.nome).join(', ')
                            : '—'}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const { deleteContrato } = await import('@/services/contratos')
                              await deleteContrato(c.id)
                              reload()
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo contrato</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cliente (indústria)</Label>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nosso CNPJ</Label>
                <Select value={cnpj} onValueChange={setCnpj}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cnpjs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.apelido || c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Valor mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Escopo, rede, observação…"
                />
              </div>
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
