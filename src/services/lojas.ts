import pb from '@/lib/pocketbase/client'

export interface Loja {
  id: string
  nome: string
  rede: string
  bandeira: string
  cidade: string
  estado: string
  endereco: string
  bairro: string
  cep: string
  contratos: number
  visitas_semana: number
  minutos_semana: number
  promotor: string
  status: 'ativa' | 'inativa'
  expand?: {
    promotor?: { id: string; nome: string; tipo_vinculo?: string; status?: string }
  }
}

export const getLojas = () =>
  pb.collection('lojas').getFullList({ sort: 'rede, nome', expand: 'promotor' })

export const createLoja = (data: Partial<Loja>) => pb.collection('lojas').create(data)
export const updateLoja = (id: string, data: Partial<Loja>) =>
  pb.collection('lojas').update(id, data)
export const deleteLoja = (id: string) => pb.collection('lojas').delete(id)
