import pb from '@/lib/pocketbase/client'

export interface ContaReceber {
  id: string
  descricao: string
  cliente: string
  valor: number
  vencimento: string
  status: 'previsto' | 'realizado' | 'cancelado'
  data_recebimento: string
  expand?: { cliente?: any }
}

export const getContasReceber = (options?: any) =>
  pb.collection('contas_receber').getFullList(options)
export const createContaReceber = (data: Partial<ContaReceber>) =>
  pb.collection('contas_receber').create(data)
export const updateContaReceber = (id: string, data: Partial<ContaReceber>) =>
  pb.collection('contas_receber').update(id, data)
export const deleteContaReceber = (id: string) => pb.collection('contas_receber').delete(id)
