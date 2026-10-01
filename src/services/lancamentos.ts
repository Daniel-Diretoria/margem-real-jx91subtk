import pb from '@/lib/pocketbase/client'

export interface Lancamento {
  id: string
  data: string
  descricao: string
  valor: number
  tipo: 'entrada' | 'saida'
  categoria: string
  cliente: string
  origem: 'manual' | 'extrato'
  conciliado: boolean
  owner?: string
  cnpj?: string
  conta?: string
  promotor?: string
  expand?: { categoria?: any; cliente?: any }
}

export const getLancamentos = (options?: any) => pb.collection('lancamentos').getFullList(options)
export const createLancamento = (data: Partial<Lancamento>) =>
  pb.collection('lancamentos').create(data)
export const updateLancamento = (id: string, data: Partial<Lancamento>) =>
  pb.collection('lancamentos').update(id, data)
export const deleteLancamento = (id: string) => pb.collection('lancamentos').delete(id)
