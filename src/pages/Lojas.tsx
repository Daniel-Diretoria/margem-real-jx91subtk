import { useEffect, useMemo, useState } from 'react'
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
import { Card, CardContent } from '@/components/ui/card'
import { getLojas, createLoja, updateLoja, deleteLoja, Loja } from '@/services/lojas'
import { getPromotores, Promotor } from '@/services/promotores'
import { useAuth } from '@/hooks/use-auth'
import { Plus, Trash2, MapPin, Search } from 'lucide-react'

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function LojasPage() {
  const { user } = useAuth()
  const ownerId = user?.id
  const [lojas, setLojas] = useState<Loja[]>([])
  const [promotores, setPromotores] = useState<Promotor[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [redeFiltro, setRedeFiltro] = useState('todas')
  const [cidadeFiltro, setCidadeFiltro] = useState('todas')
  const [aloFiltro, setAloFiltro] = useState('todas')

  const loadData = async () => {
    try {
      const [ls, ps] = await Promise.all([getLojas(), getPromotores()])
      setLojas(ls as any)
      setPromotores(ps as any)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const redes = useMemo(
    () => Array.from(new Set(lojas.map((l) => l.rede).filter(Boolean))).sort(),
    [lojas],
  )
  const cidades = useMemo(
    () => Array.from(new Set(lojas.map((l) => l.cidade).filter(Boolean))).sort(),
    [lojas],
  )

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return lojas.filter((l) => {
      if (redeFiltro !== 'todas' && l.rede !== redeFiltro) return false
      if (cidadeFiltro !== 'todas' && l.cidade !== cidadeFiltro) return false
      if (aloFiltro === 'alocadas' && !l.promotor) return false
      if (aloFiltro === 'vagas' && l.promotor) return false
      if (aloFiltro === 'inativas' && l.status !== 'inativa') return false
      if (!q) return true
      return (
        l.nome.toLowerCase().includes(q) ||
        l.cidade.toLowerCase().includes(q) ||
        (l.expand?.promotor?.nome || '').toLowerCase().includes(q)
      )
    })
  }, [lojas, busca, redeFiltro, cidadeFiltro, aloFiltro])

  const totalMinutos = filtradas.reduce((s, l) => s + Number(l.minutos_semana || 0), 0)
  const alocadas = lojas.filter((l) => l.promotor).length

  const aloca = async (lojaId: string, promotorId: string) => {
    await updateLoja(lojaId, { promotor: promotorId || undefined })
    loadData()
  }

  const toggleStatus = async (l: Loja) => {
    await updateLoja(l.id, { status: l.status === 'ativa' ? 'inativa' : 'ativa' })
    loadData()
  }

  if (loading) return <div className="animate-pulse text-muted-foreground">Carregando…</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lojas</h1>
          <p className="text-sm text-muted-foreground">
            {lojas.length} lojas · {alocadas} com promotor · {lojas.length - alocadas} vagas ·{' '}
            {totalMinutos.toLocaleString('pt-BR')} min/semana na seleção
          </p>
        </div>
        <NovaLojaDialog
          ownerId={ownerId}
          onCreate={async (data) => {
            await createLoja(data)
            loadData()
          }}
        />
      </div>

      {/* filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar loja, cidade ou promotor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={redeFiltro} onValueChange={setRedeFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as redes</SelectItem>
            {redes.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cidadeFiltro} onValueChange={setCidadeFiltro}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as cidades</SelectItem>
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={aloFiltro} onValueChange={setAloFiltro}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="alocadas">Com promotor</SelectItem>
            <SelectItem value="vagas">Sem promotor</SelectItem>
            <SelectItem value="inativas">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* tabela */}
      <Card>
        <CardContent className="pt-6">
          {filtradas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma loja encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Loja</th>
                    <th className="py-2 pr-4 font-medium">Rede</th>
                    <th className="py-2 pr-4 font-medium">Cidade</th>
                    <th className="py-2 pr-4 font-medium text-right">Contratos</th>
                    <th className="py-2 pr-4 font-medium text-right">Min/sem</th>
                    <th className="py-2 pr-4 font-medium">Promotor</th>
                    <th className="py-2 pr-4 font-medium">Ativa</th>
                    <th className="py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((l) => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium max-w-[280px] truncate" title={l.nome}>
                        {l.nome}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline">{l.rede}</Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {l.cidade}/{l.estado}
                      </td>
                      <td className="py-2 pr-4 text-right">{l.contratos}</td>
                      <td className="py-2 pr-4 text-right">{l.minutos_semana}</td>
                      <td className="py-2 pr-4 min-w-[220px]">
                        <Select
                          value={l.promotor || 'vago'}
                          onValueChange={(v) => aloca(l.id, v === 'vago' ? '' : v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Sem promotor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vago">— Sem promotor —</SelectItem>
                            {promotores
                              .filter((p) => p.status !== 'inativo')
                              .sort((a, b) => a.nome.localeCompare(b.nome))
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.nome}
                                  {p.lojas === 'SUPERVISOR' ? ' (supervisor)' : ''}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <Switch
                          checked={l.status !== 'inativa'}
                          onCheckedChange={() => toggleStatus(l)}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm(`Excluir a loja ${l.nome}?`)) {
                              await deleteLoja(l.id)
                              loadData()
                            }
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
    </div>
  )
}

function NovaLojaDialog({
  ownerId,
  onCreate,
}: {
  ownerId?: string
  onCreate: (data: Record<string, unknown>) => void
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [rede, setRede] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('SC')
  const [endereco, setEndereco] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!nome || !rede) {
      setErro('Informe pelo menos nome e rede.')
      return
    }
    setSaving(true)
    try {
      await onCreate({
        nome,
        rede,
        cidade,
        estado,
        endereco,
        status: 'ativa',
        owner: ownerId,
      })
      setOpen(false)
      setNome('')
      setRede('')
      setCidade('')
      setEndereco('')
    } catch {
      setErro('Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" /> Nova loja
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova loja</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome completo (ex.: 130 - FORT ATACADISTA PALHOÇA)</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rede</Label>
                <Input value={rede} onChange={(e) => setRede(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input value={estado} onChange={(e) => setEstado(e.target.value)} maxLength={2} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} />
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
