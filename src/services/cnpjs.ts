import pb from '@/lib/pocketbase/client'

export interface Cnpj {
  id: string
  razao_social: string
  cnpj: string
  apelido: string
  ativo: boolean
}

export const getCnpjs = () => pb.collection('cnpjs').getFullList({ sort: 'apelido' })
export const createCnpj = (data: Partial<Cnpj> & { owner?: string }) =>
  pb.collection('cnpjs').create(data)
export const updateCnpj = (id: string, data: Partial<Cnpj>) =>
  pb.collection('cnpjs').update(id, data)
export const deleteCnpj = (id: string) => pb.collection('cnpjs').delete(id)
