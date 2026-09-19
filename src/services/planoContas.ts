import pb from '@/lib/pocketbase/client'

export interface PlanoConta {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  categoria: string
  subcategoria: string
  linha_dre: string
}

export const getPlanoContas = () =>
  pb.collection('plano_contas').getFullList({ sort: 'categoria,nome' })
export const createPlanoConta = (data: Partial<PlanoConta>) =>
  pb.collection('plano_contas').create(data)
export const updatePlanoConta = (id: string, data: Partial<PlanoConta>) =>
  pb.collection('plano_contas').update(id, data)
export const deletePlanoConta = (id: string) => pb.collection('plano_contas').delete(id)
