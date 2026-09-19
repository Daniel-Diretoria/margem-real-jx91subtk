import pb from '@/lib/pocketbase/client'

export interface Fechamento {
  id: string
  mes: string
  status: 'aberto' | 'fechado'
  decisao: string
  dre: any
}

export const getFechamento = (mes: string) =>
  pb
    .collection('fechamentos')
    .getFirstListItem(pb.filter('mes = {:m}', { m: mes }))
    .catch(() => null)

export const getFechamentos = () => pb.collection('fechamentos').getFullList({ sort: '-mes' })

export const createFechamento = (data: Partial<Fechamento> & { owner?: string }) =>
  pb.collection('fechamentos').create(data)

export const updateFechamento = (id: string, data: Partial<Fechamento>) =>
  pb.collection('fechamentos').update(id, data)
