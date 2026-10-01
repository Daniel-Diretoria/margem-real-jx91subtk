import pb from '@/lib/pocketbase/client'

export interface Promotor {
  id: string
  nome: string
  cargo: 'promotor' | 'lider'
  salario: number
  encargos: number
  beneficios: number
  cliente: string
  ativo: boolean
  owner?: string
  cnpj?: string
  tipo_vinculo?: 'CLT' | 'MEI' | 'PJ' | 'terceirizado'
  documento?: string
  lojas?: string
  status?: 'ativo' | 'inativo'
  chave_pix?: string
  banco?: string
}

export const getPromotores = () =>
  pb.collection('promotores').getFullList({ sort: 'nome', expand: 'cliente' })
export const createPromotor = (data: Partial<Promotor>) => pb.collection('promotores').create(data)
export const updatePromotor = (id: string, data: Partial<Promotor>) =>
  pb.collection('promotores').update(id, data)
export const deletePromotor = (id: string) => pb.collection('promotores').delete(id)
