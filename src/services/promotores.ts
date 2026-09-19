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
}

export const getPromotores = () =>
  pb.collection('promotores').getFullList({ sort: 'nome', expand: 'cliente' })
export const createPromotor = (data: Partial<Promotor>) => pb.collection('promotores').create(data)
export const updatePromotor = (id: string, data: Partial<Promotor>) =>
  pb.collection('promotores').update(id, data)
export const deletePromotor = (id: string) => pb.collection('promotores').delete(id)
