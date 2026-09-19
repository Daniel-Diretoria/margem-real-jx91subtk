import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createLancamento } from '@/services/lancamentos'
import { getPlanoContas, PlanoConta } from '@/services/planoContas'
import { getClientes, Cliente } from '@/services/clientes'
import { Upload, FileText, X } from 'lucide-react'

interface LinhaExtrato {
  data: string
  descricao: string
  valor: number
  tipo: 'entrada' | 'saida'
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Parser simples de CSV/OFX: aceita CSV com colunas data;descricao;valor
// (ou data,descricao,valor) e OFX com tags DTPOSTED/TRNAMT/NAME/MEMO.
function parseArquivo(texto: string): LinhaExtrato[] {
  const linhas: LinhaExtrato[] = []
  const trimmed = texto.trim()

  if (trimmed.includes('<STMTTRN>')) {
    // OFX
    const blocos = trimmed.split('<STMTTRN>').slice(1)
    for (const b of blocos) {
      const dt = /<DTPOSTED>(\d{4})(\d{2})(\d{2})/.exec(b)
      const amt = /<TRNAMT>(-?[\d.,]+)/.exec(b)
      const nome = /<(?:NAME|MEMO)>([^<]+)/.exec(b)
      if (dt && amt) {
        const valor = parseFloat(amt[1].replace(',', '.'))
        linhas.push({
          data: `${dt[1]}-${dt[2]}-${dt[3]}`,
          descricao: (nome?.[1] || 'Movimento bancário').trim(),
          valor: Math.abs(valor),
          tipo: valor >= 0 ? 'entrada' : 'saida',
        })
      }
    }
    return linhas
  }

  // CSV: data;descricao;valor (aceita , ou ; como separador)
  for (const linha of trimmed.split(/\r?\n/)) {
    const parts = linha.split(/[;,\t]/).map((p) => p.trim())
    if (parts.length < 3) continue
    const [d, desc, val] = parts
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d) && !/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
    let data = d
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('/')
      data = `${yyyy}-${mm}-${dd}`
    }
    const valor = parseFloat(val.replace(/\./g, '').replace(',', '.').replace('R$', '').trim())
    if (isNaN(valor)) continue
    linhas.push({
      data,
      descricao: desc,
      valor: Math.abs(valor),
      tipo: valor >= 0 ? 'entrada' : 'saida',
    })
  }
  return linhas
}

export default function ImportarExtrato() {
  const [linhas, setLinhas] = useState<LinhaExtrato[]>([])
  const [categorias, setCategorias] = useState<PlanoConta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  // categoria/cliente por linha (index → id)
  const [catPorLinha, setCatPorLinha] = useState<Record<number, string>>({})
  const [cliPorLinha, setCliPorLinha] = useState<Record<number, string>>({})

  useEffect(() => {
    Promise.all([getPlanoContas(), getClientes()]).then(([pc, cl]) => {
      setCategorias(pc as any)
      setClientes(cl as any)
    })
  }, [])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNomeArquivo(file.name)
    setResultado('')
    const texto = await file.text()
    const parsed = parseArquivo(texto)
    setLinhas(parsed)
    setCatPorLinha({})
    setCliPorLinha({})
    if (parsed.length === 0) {
      setResultado(
        'Nenhuma linha reconhecida. Formatos aceitos: CSV (data;descrição;valor) ou OFX.',
      )
    }
  }

  const limpar = () => {
    setLinhas([])
    setNomeArquivo('')
    setResultado('')
    setCatPorLinha({})
    setCliPorLinha({})
  }

  const importarTudo = async () => {
    setImportando(true)
    let ok = 0
    for (let i = 0; i < linhas.length; i++) {
      try {
        await createLancamento({
          ...linhas[i],
          categoria: catPorLinha[i] || undefined,
          cliente: cliPorLinha[i] || undefined,
          origem: 'extrato',
          conciliado: true,
        })
        ok++
      } catch {
        // segue para a próxima linha
      }
    }
    setImportando(false)
    setResultado(`${ok} de ${linhas.length} lançamentos importados com sucesso.`)
    if (ok > 0) limpar()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar extrato</h1>
        <p className="text-sm text-muted-foreground">
          Suba o extrato bancário em OFX ou CSV e transforme em lançamentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Escolha o arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Clique para escolher o arquivo (.ofx ou .csv)
            </span>
            <input type="file" accept=".ofx,.csv,.txt" className="hidden" onChange={handleFile} />
          </label>
          {nomeArquivo && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" /> {nomeArquivo}
              <button onClick={limpar} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {linhas.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              2. Revise e classifique ({linhas.length} linhas)
            </CardTitle>
            <Button onClick={importarTudo} disabled={importando}>
              {importando ? 'Importando…' : `Importar ${linhas.length} lançamentos`}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4 font-medium">Data</th>
                    <th className="py-2 pr-4 font-medium">Descrição</th>
                    <th className="py-2 pr-4 font-medium text-right">Valor</th>
                    <th className="py-2 pr-4 font-medium">Categoria</th>
                    <th className="py-2 pr-4 font-medium">Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <span>{l.descricao}</span>
                          <Badge
                            variant={l.tipo === 'entrada' ? 'outline' : 'secondary'}
                            className={
                              l.tipo === 'entrada' ? 'text-green-600 border-green-600' : ''
                            }
                          >
                            {l.tipo}
                          </Badge>
                        </div>
                      </td>
                      <td
                        className={
                          'py-2 pr-4 text-right font-semibold whitespace-nowrap ' +
                          (l.tipo === 'entrada' ? 'text-green-600' : 'text-red-600')
                        }
                      >
                        {fmtBRL(l.valor)}
                      </td>
                      <td className="py-2 pr-4">
                        <Select
                          value={catPorLinha[i] || ''}
                          onValueChange={(v) => setCatPorLinha((prev) => ({ ...prev, [i]: v }))}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2 pr-4">
                        <Select
                          value={cliPorLinha[i] || ''}
                          onValueChange={(v) => setCliPorLinha((prev) => ({ ...prev, [i]: v }))}
                        >
                          <SelectTrigger className="w-48">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
    </div>
  )
}
