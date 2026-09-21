// Cadastro dos cartões da DCG com limites (idempotente) — valores lidos dos
// prints enviados em 21/09/2026. São 5 cartões nos prints (Daniel disse 4).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const col = app.findCollectionByNameOrId('contas_bancarias')
    const cnpjs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
    let dcgId = ''
    for (const c of cnpjs) {
      if (c.getString('apelido') === 'DCG') dcgId = c.id
    }
    if (!dcgId) throw new Error('DCG não encontrada')

    const existentes = app.findRecordsByFilter(
      'contas_bancarias',
      'owner = "' + admin.id + '" && tipo = "cartao"',
      '',
      100,
      0,
    )
    for (const e of existentes) app.delete(e)

    const cartoes = [
      ['Itaú Infinite DCG (final 0945)', 75000.0],
      ['Itaú Empresas DCG (final 5613)', 5000.0],
      ['Santander Platinum DCG', 25800.0],
      ['Sicoob Minha Empresa DCG (Fernando, final 1472)', 2000.0],
      ['Sicoob Empresarial DCG (Daniel, final 1981)', 20000.0],
    ]

    for (const [apelido, limite] of cartoes) {
      const r = new Record(col)
      r.set('owner', admin.id)
      r.set('apelido', apelido)
      r.set('tipo', 'cartao')
      r.set(
        'banco',
        apelido.startsWith('Itaú')
          ? 'Itaú Unibanco (341)'
          : apelido.startsWith('Santander')
            ? 'Santander'
            : 'Sicoob (Crediluz)',
      )
      r.set('cnpj', dcgId)
      r.set('limite', limite)
      r.set('ativo', true)
      app.save(r)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter(
        'contas_bancarias',
        'owner = "' + admin.id + '" && tipo = "cartao"',
        '',
        100,
        0,
      )
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
