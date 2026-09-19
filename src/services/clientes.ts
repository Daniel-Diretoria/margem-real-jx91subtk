import pb from '@/lib/pocketbase/client'

export interface Cliente {
  id: string
  nome: string
  contato: string
  observacoes: string
  ativo: boolean
}

export const getClientes = () => pb.collection('clientes').getFullList({ sort: 'nome' })
export const createCliente = (data: Partial<Cliente>) => pb.collection('clientes').create(data)
export const updateCliente = (id: string, data: Partial<Cliente>) =>
  pb.collection('clientes').update(id, data)
export const deleteCliente = (id: string) => pb.collection('clientes').delete(id)
