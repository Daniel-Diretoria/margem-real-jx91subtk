// Clientes reais (indústrias) da planilha de agosto + CNPJ de faturamento.
// Idempotente: apaga e recria (base estava limpa).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const col = app.findCollectionByNameOrId('clientes')
    const cnpjs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
    let dcgId = ''
    let grupoId = ''
    for (const c of cnpjs) {
      if (c.getString('apelido') === 'DCG') dcgId = c.id
      if (c.getString('apelido') === 'Grupo Diretoria') grupoId = c.id
    }

    const existentes = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)
    for (const e of existentes) app.delete(e)

    // [nome, cnpjFaturante] — CONTA da planilha de agosto
    const industrias = [
      ['LILIBEL', grupoId],
      ['MENDEZ', dcgId],
      ['COCO LEVE', dcgId],
      ['FRUTAP', dcgId],
      ['ADESUL', dcgId],
      ['BENAFRUTTI', grupoId],
      ['PARMISSIMO', grupoId],
      ['ITALAC', dcgId],
      ['CASAREDO', dcgId],
      ['PAO E ARTE', dcgId],
      ['PIZZA OLIVA', dcgId],
      ['SERTAOZINHO (TERRA DE MINAS)', grupoId],
      ['DOCCA', grupoId],
      ['POLPA AMAZONIA', grupoId],
      ['SUNCOLOR', grupoId],
      ['JDR', grupoId],
      ['CHULETAO', dcgId],
      ['OLIVEIRA (OLIVEIRA E NOVAES)', dcgId],
      ['FRUTAP ATACADAO', dcgId],
      ['LE ANTONI', grupoId],
      ['MARIGOLD', grupoId],
      ['BRQ CASA KUNZLER', dcgId],
      ['MASSA DITALIA', grupoId],
      ['SUCO JAL', grupoId],
      ['BOLACHA GOBLEE', grupoId],
      ['CIA CANOINHAS', grupoId],
      ['MILLEBIER', grupoId],
      ['DONORTE', dcgId],
      ['ZS REPRESENTACOES', dcgId],
      ['CONEXAO LIVELLO', dcgId],
    ]

    for (const [nome, cnpjId] of industrias) {
      const r = new Record(col)
      r.set('owner', admin.id)
      r.set('nome', nome)
      r.set('ativo', true)
      app.save(r)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
