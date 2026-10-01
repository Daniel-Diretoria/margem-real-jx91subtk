import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import {
  getPlanoContas,
  createPlanoConta,
  deletePlanoConta,
  PlanoConta,
} from '@/services/planoContas'
import { getClientes, createCliente, deleteCliente, Cliente } from '@/services/clientes'
import {
  getPromotores,
  createPromotor,
  updatePromotor,
  deletePromotor,
  Promotor,
} from '@/services/promotores'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Trash2 } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const LINHAS_DRE = [
  { value: 'receita_bruta', label: 'Receita bruta' },
  { value: 'deducoes', label: 'Deduções da receita' },
  { value: 'custos', label: 'Custos' },
  { value: 'despesas_operacionais', label: 'Despesas operacionais' },
  { value: 'juros', label: 'Juros' },
  { value: 'outras', label: 'Outras' },
]

export default function Cadastros() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [promotores, setPromotores] = useState<Promotor[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      if (user?.papel === 'equipe') {
        // Carol: sem acesso a plano de contas/clientes (regra owner-only)
        const pr = await getPromotores()
        setPromotores(pr as any)
      } else {
        const [pc, cl, pr] = await Promise.all([getPlanoContas(), getClientes(), getPromotores()])
        setCategorias(pc as any)
        setClientes(cl as any)
        setPromotores(pr as any)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('plano_contas', loadData)
  useRealtime('clientes', loadData)
  useRealtime('promotores', loadData)

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastros</h1>
        <p className="text-sm text-muted-foreground">Plano de contas, clientes e promotores</p>
      </div>

      <Tabs defaultValue={user?.papel === 'equipe' ? 'promotores' : 'plano'}>
        <TabsList>
          {user?.papel !== 'equipe' && <TabsTrigger value="plano">Plano de contas</TabsTrigger>}
          {user?.papel !== 'equipe' && <TabsTrigger value="clientes">Clientes</TabsTrigger>}
          <TabsTrigger value="promotores">Promotores</TabsTrigger>
        </TabsList>

        {user?.papel !== 'equipe' && (
          <TabsContent value="plano">
            <PlanoTab categorias={categorias} reload={loadData} ownerId={ownerId} />
          </TabsContent>
        )}
        {user?.papel !== 'equipe' && (
          <TabsContent value="clientes">
            <ClientesTab clientes={clientes} reload={loadData} ownerId={ownerId} />
          </TabsContent>
        )}
        <TabsContent value="promotores">
          <PromotoresTab
            promotores={promotores}
            clientes={clientes}
            reload={loadData}
            ownerId={ownerId}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PlanoTab({
  categorias,
  reload,
  ownerId,
}: {
  categorias: PlanoConta[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('despesa')
  const [categoria, setCategoria] = useState('')
  const [subcategoria, setSubcategoria] = useState('')
  const [linha, setLinha] = useState('custos')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome) {
      setErro('Informe o nome.')
      return
    }
    setSaving(true)
    try {
      await createPlanoConta({
        nome,
        tipo: tipo as any,
        categoria,
        subcategoria,
        linha_dre: linha,
        owner: ownerId,
      })
      setOpen(false)
      setNome('')
      setCategoria('')
      setSubcategoria('')
      reload()
    } catch {
      setErro('Erro ao salvar. Verifique os campos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nova conta
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {categorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Tipo</th>
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 pr-4 font-medium">Subcategoria</th>
                    <th className="py-2 pr-4 font-medium">Linha da DRE</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.nome}</td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={c.tipo === 'receita' ? 'outline' : 'secondary'}
                          className={c.tipo === 'receita' ? 'text-green-600 border-green-600' : ''}
                        >
                          {c.tipo}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.categoria || '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.subcategoria || '—'}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {LINHAS_DRE.find((l) => l.value === c.linha_dre)?.label || c.linha_dre}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deletePlanoConta(c.id)
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
            <DialogTitle>Nova conta do plano</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Linha da DRE</Label>
                <Select value={linha} onValueChange={setLinha}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINHAS_DRE.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ex.: Pessoal"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subcategoria</Label>
                <Input
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  placeholder="Ex.: Salários"
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

function ClientesTab({
  clientes,
  reload,
  ownerId,
}: {
  clientes: Cliente[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [contato, setContato] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome) {
      setErro('Informe o nome.')
      return
    }
    setSaving(true)
    try {
      await createCliente({ nome, contato, ativo: true, owner: ownerId })
      setOpen(false)
      setNome('')
      setContato('')
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
          <Plus className="h-4 w-4 mr-2" /> Novo cliente
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {clientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Contato</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{c.nome}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{c.contato || '—'}</td>
                      <td className="py-2 pr-4">
                        {c.ativo ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deleteCliente(c.id)
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
            <DialogTitle>Novo cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="Nome, telefone ou e-mail"
              />
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

function PromotoresTab({
  promotores,
  clientes,
  reload,
  ownerId,
}: {
  promotores: Promotor[]
  clientes: Cliente[]
  reload: () => void
  ownerId?: string
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [cargo, setCargo] = useState('promotor')
  const [salario, setSalario] = useState('')
  const [encargos, setEncargos] = useState('')
  const [beneficios, setBeneficios] = useState('')
  const [cliente, setCliente] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome) {
      setErro('Informe o nome.')
      return
    }
    setSaving(true)
    try {
      await createPromotor({
        nome,
        cargo: cargo as any,
        salario: Number(salario) || 0,
        encargos: Number(encargos) || 0,
        beneficios: Number(beneficios) || 0,
        cliente: cliente || undefined,
        ativo: true,
        owner: ownerId,
      })
      setOpen(false)
      setNome('')
      setSalario('')
      setEncargos('')
      setBeneficios('')
      setCliente('')
      reload()
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAtivo = async (p: Promotor) => {
    await updatePromotor(p.id, { ativo: !p.ativo })
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo promotor
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {promotores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum promotor cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Nome</th>
                    <th className="py-2 pr-4 font-medium">Cargo</th>
                    <th className="py-2 pr-4 font-medium">Custo mensal</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                    <th className="py-2 pr-4 font-medium">Ativo</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {promotores.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{p.nome}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary">{p.cargo}</Badge>
                      </td>
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {fmtBRL(Number(p.salario) + Number(p.encargos) + Number(p.beneficios))}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {(p as any).expand?.cliente?.nome || '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <Switch checked={p.ativo} onCheckedChange={() => toggleAtivo(p)} />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await deletePromotor(p.id)
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
            <DialogTitle>Novo promotor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Cargo</Label>
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotor">Promotor</SelectItem>
                    <SelectItem value="lider">Líder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Salário</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={salario}
                  onChange={(e) => setSalario(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Encargos</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={encargos}
                  onChange={(e) => setEncargos(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Benefícios</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={beneficios}
                  onChange={(e) => setBeneficios(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cliente alocado</Label>
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
  )
}
