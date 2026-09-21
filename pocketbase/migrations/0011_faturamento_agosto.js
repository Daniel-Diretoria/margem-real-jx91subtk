// Faturamento de AGOSTO/2026 por indústria — da planilha do Daniel
// (VALOR bruto; dedução de 17% registrada como conta "Impostos sobre serviço"
// para a DRE mostrar bruto → deduções → líquido). Cada lançamento vinculado
// ao CNPJ faturante (CONTA da planilha). Data = DATA PG da planilha.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const colLanc = app.findCollectionByNameOrId('lancamentos')
    const clientes = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)
    const cnpjs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
    const plano = app.findRecordsByFilter('plano_contas', 'owner = "' + admin.id + '"', '', 200, 0)

    let dcgId = ''
    let grupoId = ''
    for (const c of cnpjs) {
      if (c.getString('apelido') === 'DCG') dcgId = c.id
      if (c.getString('apelido') === 'Grupo Diretoria') grupoId = c.id
    }

    let catFaturamento = ''
    let catImpostos = ''
    for (const p of plano) {
      if (p.getString('nome') === 'Faturamento de serviços') catFaturamento = p.id
      if (p.getString('nome') === 'Impostos sobre serviço') catImpostos = p.id
    }

    // limpa lançamentos existentes (base estava zerada)
    const existentes = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '"',
      '',
      500,
      0,
    )
    for (const e of existentes) app.delete(e)

    // [empresa, valorBruto, dataPG, cnpjId]
    const fat = [
      ['LILIBEL', 12896.0, '2026-09-09', grupoId],
      ['MENDEZ', 3825.0, '2026-09-10', dcgId],
      ['COCO LEVE', 5575.0, '2026-09-10', dcgId],
      ['FRUTAP', 48150.0, '2026-09-09', dcgId],
      ['ADESUL', 12981.2, '2026-09-10', dcgId],
      ['BENAFRUTTI', 3300.0, '2026-09-04', grupoId],
      ['PARMISSIMO', 18253.0, '2026-09-30', grupoId],
      ['ITALAC', 83472.54, '2026-09-24', dcgId],
      ['CASAREDO', 1100.0, '2026-09-10', dcgId],
      ['PAO E ARTE', 14202.4, '2026-09-09', dcgId],
      ['PIZZA OLIVA', 2880.0, '2026-09-09', dcgId],
      ['SERTAOZINHO (TERRA DE MINAS)', 18900.0, '2026-09-10', grupoId],
      ['DOCCA', 3150.0, '2026-09-04', grupoId],
      ['POLPA AMAZONIA', 1765.87, '2026-09-10', grupoId],
      ['SUNCOLOR', 512.0, '2026-09-04', grupoId],
      ['JDR', 6134.0, '2026-09-14', grupoId],
      ['CHULETAO', 19800.0, '2026-09-04', dcgId],
      ['OLIVEIRA (OLIVEIRA E NOVAES)', 14112.0, '2026-09-09', dcgId],
      ['FRUTAP ATACADAO', 4000.0, '2026-09-09', dcgId],
      ['LE ANTONI', 304.0, '2026-09-04', grupoId],
      ['MARIGOLD', 3780.0, '2026-09-04', grupoId],
      ['BRQ CASA KUNZLER', 13845.0, '2026-09-14', dcgId],
      ['MASSA DITALIA', 17829.0, '2026-09-18', grupoId],
      ['SUCO JAL', 7168.0, '2026-09-09', grupoId],
      ['BOLACHA GOBLEE', 750.0, '2026-09-04', grupoId],
      ['CIA CANOINHAS', 14191.67, '2026-09-07', grupoId],
      ['MILLEBIER', 1176.0, '2026-09-07', grupoId],
    ]

    const clienteId = {}
    for (const c of clientes) clienteId[c.getString('nome')] = c.id

    for (const [nome, valor, data, cnpjId] of fat) {
      // receita bruta
      const r = new Record(colLanc)
      r.set('owner', admin.id)
      r.set('data', data)
      r.set('descricao', 'Faturamento agosto - ' + nome)
      r.set('valor', valor)
      r.set('tipo', 'entrada')
      r.set('categoria', catFaturamento)
      r.set('cliente', clienteId[nome] || '')
      r.set('cnpj', cnpjId)
      r.set('origem', 'extrato')
      r.set('conciliado', true)
      app.save(r)

      // dedução de 17% (impostos sobre serviço)
      const imp = Math.round(valor * 0.17 * 100) / 100
      const d = new Record(colLanc)
      d.set('owner', admin.id)
      d.set('data', data)
      d.set('descricao', 'Impostos 17% - ' + nome)
      d.set('valor', imp)
      d.set('tipo', 'saida')
      d.set('categoria', catImpostos)
      d.set('cliente', clienteId[nome] || '')
      d.set('cnpj', cnpjId)
      d.set('origem', 'extrato')
      d.set('conciliado', true)
      app.save(d)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter('lancamentos', 'owner = "' + admin.id + '"', '', 500, 0)
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
