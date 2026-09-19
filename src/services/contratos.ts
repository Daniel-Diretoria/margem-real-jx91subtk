import pb from '@/lib/pocketbase/client'

export interface Contrato {
  id: string
  cliente: string
  cnpj: string
  descricao: string
  valor_mensal: number
  data_inicio: string
  data_fim: string
  ativo: boolean
  expand?: { cliente?: any; cnpj?: any }
}

export const getContratos = () =>
  pb.collection('contratos').getFullList({ sort: '-created', expand: 'cliente,cnpj' })
export const createContrato = (data: Partial<Contrato> & { owner?: string }) =>
  pb.collection('contratos').create(data)
export const updateContrato = (id: string, data: Partial<Contrato>) =>
  pb.collection('contratos').update(id, data)
export const deleteContrato = (id: string) => pb.collection('contratos').delete(id)
