import { Lancamento } from '@/services/lancamentos'
import { PlanoConta } from '@/services/planoContas'
import { Cliente } from '@/services/clientes'
import { Promotor } from '@/services/promotores'

export interface LinhaDRE {
  nome: string
  valor: number
  filhos?: LinhaDRE[]
}

export interface DRE {
  receitaBruta: number
  deducoes: number
  receitaLiquida: number
  custos: number
  lucroBruto: number
  despesasOperacionais: number
  ebitda: number
  juros: number
  resultadoFinanceiro: number
  outras: number
  lucroLiquido: number
  margemPct: number
  linhas: LinhaDRE[]
}

const fmt = (v: number) => (isFinite(v) ? v : 0)

export function calcularDRE(
  lancamentos: Lancamento[],
  categorias: PlanoConta[],
  clienteId?: string,
): DRE {
  // índice categoria → linha da DRE
  const linhaPorCategoria: Record<string, string> = {}
  for (const c of categorias) linhaPorCategoria[c.id] = c.linha_dre

  // agrupa por categoria (para as linhas detalhadas)
  const porCategoria: Record<string, { nome: string; valor: number }> = {}
  const totais: Record<string, number> = {
    receita_bruta: 0,
    deducoes: 0,
    custos: 0,
    despesas_operacionais: 0,
    juros: 0,
    outras: 0,
  }

  for (const l of lancamentos) {
    if (clienteId && l.cliente !== clienteId) continue
    const valor = Number(l.valor)
    if (!valor) continue

    const linha = l.categoria ? linhaPorCategoria[l.categoria] : 'outras'
    const chave = linha && linha in totais ? linha : 'outras'

    if (l.tipo === 'entrada') {
      totais.receita_bruta += valor
      const cat = categorias.find((c) => c.id === l.categoria)
      const nome = cat?.nome || 'Sem categoria'
      if (!porCategoria[l.categoria || 'sem'])
        porCategoria[l.categoria || 'sem'] = { nome, valor: 0 }
      porCategoria[l.categoria || 'sem'].valor += valor
    } else {
      totais[chave] += valor
      const cat = categorias.find((c) => c.id === l.categoria)
      const nome = cat?.nome || 'Sem categoria'
      if (!porCategoria[l.categoria || 'sem'])
        porCategoria[l.categoria || 'sem'] = { nome, valor: 0 }
      porCategoria[l.categoria || 'sem'].valor += valor
    }
  }

  const receitaBruta = fmt(totais.receita_bruta)
  const deducoes = fmt(totais.deducoes)
  const receitaLiquida = receitaBruta - deducoes
  const custos = fmt(totais.custos)
  const lucroBruto = receitaLiquida - custos
  const despesasOperacionais = fmt(totais.despesas_operacionais)
  const ebitda = lucroBruto - despesasOperacionais
  const juros = fmt(totais.juros)
  const outras = fmt(totais.outras)
  const lucroLiquido = ebitda - juros - outras
  const margemPct = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0

  // linhas detalhadas por categoria, agrupadas por bloco
  const bloco = (linha: string): LinhaDRE[] =>
    Object.values(porCategoria).filter((c) => {
      const cat = categorias.find((x) => x.nome === c.nome)
      if (!cat) return linha === 'outras'
      const l = linhaPorCategoria[cat.id]
      if (linha === 'receita_bruta') return l === 'receita_bruta' || cat.tipo === 'receita'
      return l === linha
    })

  return {
    receitaBruta,
    deducoes,
    receitaLiquida,
    custos,
    lucroBruto,
    despesasOperacionais,
    ebitda,
    juros,
    resultadoFinanceiro: -juros,
    outras,
    lucroLiquido,
    margemPct,
    linhas: [
      { nome: 'Receita bruta', valor: receitaBruta, filhos: bloco('receita_bruta') },
      { nome: '(−) Deduções da receita', valor: -deducoes, filhos: bloco('deducoes') },
      { nome: '= Receita líquida', valor: receitaLiquida },
      { nome: '(−) Custos', valor: -custos, filhos: bloco('custos') },
      { nome: '= Lucro bruto', valor: lucroBruto },
      {
        nome: '(−) Despesas operacionais',
        valor: -despesasOperacionais,
        filhos: bloco('despesas_operacionais'),
      },
      { nome: '= EBITDA', valor: ebitda },
      { nome: '(−) Juros', valor: -juros, filhos: bloco('juros') },
      { nome: '(−) Outras', valor: -outras, filhos: bloco('outras') },
      { nome: '= Lucro líquido', valor: lucroLiquido },
    ],
  }
}

export function calcularDREPorCliente(
  lancamentos: Lancamento[],
  categorias: PlanoConta[],
  clientes: Cliente[],
): { cliente: Cliente; dre: DRE }[] {
  return clientes
    .map((cliente) => ({
      cliente,
      dre: calcularDRE(lancamentos, categorias, cliente.id),
    }))
    .filter((x) => x.dre.receitaBruta > 0 || x.dre.custos > 0)
}
