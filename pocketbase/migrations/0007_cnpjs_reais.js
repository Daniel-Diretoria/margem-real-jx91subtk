// Cadastro dos CNPJs reais do Daniel (idempotente) — dados confirmados nas
// cartas do CNP (uploads) e no print do Itaú enviado em 21/09/2026.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const col = app.findCollectionByNameOrId('cnpjs')

    const existentes = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
    for (const e of existentes) {
      // refaz do zero caso tenha sobrado algo
      app.delete(e)
    }

    const c1 = new Record(col)
    c1.set('owner', admin.id)
    c1.set('razao_social', 'GRUPO DIRETORIA PROMOCOES LTDA')
    c1.set('cnpj', '58.492.689/0001-07')
    c1.set('apelido', 'Grupo Diretoria')
    c1.set('ativo', true)
    app.save(c1)

    const c2 = new Record(col)
    c2.set('owner', admin.id)
    c2.set('razao_social', 'DCG CONSULTORIA MERCHANDISING E PROMOCOES LTDA')
    c2.set('cnpj', '36.997.466/0001-50')
    c2.set('apelido', 'DCG')
    c2.set('ativo', true)
    app.save(c2)
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
