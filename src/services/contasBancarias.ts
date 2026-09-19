import pb from '@/lib/pocketbase/client'

export interface ContaBancaria {
  id: string
  apelido: string
  tipo: 'conta_corrente' | 'poupanca' | 'cartao'
  banco: string
  cnpj: string
  limite: number
  ativo: boolean
  expand?: { cnpj?: any }
}

export const getContasBancarias = () =>
  pb.collection('contas_bancarias').getFullList({ sort: 'apelido', expand: 'cnpj' })
export const createContaBancaria = (data: Partial<ContaBancaria> & { owner?: string }) =>
  pb.collection('contas_bancarias').create(data)
export const updateContaBancaria = (id: string, data: Partial<ContaBancaria>) =>
  pb.collection('contas_bancarias').update(id, data)
export const deleteContaBancaria = (id: string) => pb.collection('contas_bancarias').delete(id)
