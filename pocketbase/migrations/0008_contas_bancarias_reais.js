// Cadastro das contas bancárias reais (idempotente) — Itaú x2, Santander e
// Sicoob, todas na DCG conforme confirmação do Daniel em 21/09/2026.
// Pronampe = crédito em ambas → tipo conta_corrente (o empréstimo entra como
// lançamento/conta a pagar quando os extratos forem subidos).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const col = app.findCollectionByNameOrId('contas_bancarias')
    const cnpjs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)

    let dcgId = ''
    let grupoId = ''
    for (const c of cnpjs) {
      if (c.getString('apelido') === 'DCG') dcgId = c.id
      if (c.getString('apelido') === 'Grupo Diretoria') grupoId = c.id
    }
    if (!dcgId || !grupoId) throw new Error('CNPJs reais não encontrados')

    // limpa qualquer cadastro anterior de contas
    const existentes = app.findRecordsByFilter(
      'contas_bancarias',
      'owner = "' + admin.id + '"',
      '',
      100,
      0,
    )
    for (const e of existentes) app.delete(e)

    const contas = [
      ['Itaú Grupo Diretoria', 'conta_corrente', 'Itaú Unibanco (341)', grupoId],
      ['Itaú DCG', 'conta_corrente', 'Itaú Unibanco (341)', dcgId],
      ['Santander DCG', 'conta_corrente', 'Santander', dcgId],
      ['Sicoob DCG', 'conta_corrente', 'Sicoob (Crediluz)', dcgId],
    ]

    for (const [apelido, tipo, banco, cnpjId] of contas) {
      const r = new Record(col)
      r.set('owner', admin.id)
      r.set('apelido', apelido)
      r.set('tipo', tipo)
      r.set('banco', banco)
      r.set('cnpj', cnpjId)
      r.set('ativo', true)
      app.save(r)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter(
        'contas_bancarias',
        'owner = "' + admin.id + '"',
        '',
        100,
        0,
      )
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
