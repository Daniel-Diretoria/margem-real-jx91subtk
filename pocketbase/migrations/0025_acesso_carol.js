// Acesso da Carol (operacional): papel "equipe" no usuário + regras de coleção
// que dão a ela Lojas e Promotores (CRUD completo) sem tocar no financeiro.
// O Daniel (owner dos registros) continua vendo tudo.
migrate(
  (app) => {
    // 1. campo papel no auth (idempotente)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('papel')) {
      users.fields.add(
        new SelectField({
          name: 'papel',
          values: ['dono', 'equipe'],
          maxSelect: 1,
        }),
      )
      app.save(users)
    }

    // 2. usuário da Carol
    let carol = null
    try {
      carol = app.findAuthRecordByEmail('_pb_users_auth_', 'carol@diretoriapromocoes.com.br')
    } catch (_) {}
    if (!carol) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      carol = new Record(usersCol)
      carol.setEmail('carol@diretoriapromocoes.com.br')
      carol.setPassword('Carol@2026')
      carol.setVerified(true)
      carol.set('name', 'Carol')
      carol.set('papel', 'equipe')
      app.save(carol)
    } else {
      if (carol.get('papel') !== 'equipe') {
        carol.set('papel', 'equipe')
        app.save(carol)
      }
    }

    // 3. regras: lojas e promotores acessíveis a qualquer usuário logado
    const eq = "@request.auth.id != ''"
    const lojas = app.findCollectionByNameOrId('lojas')
    lojas.listRule = eq
    lojas.viewRule = eq
    lojas.createRule = eq
    lojas.updateRule = eq
    lojas.deleteRule = eq
    app.save(lojas)

    const prom = app.findCollectionByNameOrId('promotores')
    prom.listRule = eq
    prom.viewRule = eq
    prom.createRule = eq
    prom.updateRule = eq
    prom.deleteRule = eq
    app.save(prom)

    // 4. garante owner = Daniel nos registros existentes sem dono
    const daniel = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const lojasVagas = app.findRecordsByFilter('lojas', 'owner = ""', '', 1000, 0)
    for (const r of lojasVagas) {
      r.set('owner', daniel.id)
      app.save(r)
    }
    const promVagos = app.findRecordsByFilter('promotores', 'owner = ""', '', 1000, 0)
    for (const r of promVagos) {
      r.set('owner', daniel.id)
      app.save(r)
    }
  },
  (app) => {
    // rollback: volta regras owner-only
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    const lojas = app.findCollectionByNameOrId('lojas')
    lojas.listRule = ownerRule
    lojas.viewRule = ownerRule
    lojas.createRule = ownerRule
    lojas.updateRule = ownerRule
    lojas.deleteRule = ownerRule
    app.save(lojas)

    const prom = app.findCollectionByNameOrId('promotores')
    prom.listRule = ownerRule
    prom.viewRule = ownerRule
    prom.createRule = ownerRule
    prom.updateRule = ownerRule
    prom.deleteRule = ownerRule
    app.save(prom)
  },
)
