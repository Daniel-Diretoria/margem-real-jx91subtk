import pb from '@/lib/pocketbase/client'

export interface ContaPagar {
  id: string
  descricao: string
  valor: number
  vencimento: string
  status: 'previsto' | 'realizado' | 'cancelado'
  categoria: string
  data_pagamento: string
  owner?: string
  cnpj?: string
  expand?: { categoria?: any }
}

export const getContasPagar = (options?: any) => pb.collection('contas_pagar').getFullList(options)
export const createContaPagar = (data: Partial<ContaPagar>) =>
  pb.collection('contas_pagar').create(data)
export const updateContaPagar = (id: string, data: Partial<ContaPagar>) =>
  pb.collection('contas_pagar').update(id, data)
export const deleteContaPagar = (id: string) => pb.collection('contas_pagar').delete(id)
