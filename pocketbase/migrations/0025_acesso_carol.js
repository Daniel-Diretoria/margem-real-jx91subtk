// Acesso da Carol (operacional): papel "equipe" no usuário + regras de coleção
// que dão a ela Lojas e Promotores (CRUD completo) sem tocar no financeiro.
// O Daniel (owner dos registros) continua vendo tudo.
migrate(
  (app) => {
    // 1. campo papel no auth (idempotente)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('papel')) {
      users.fields.add(
        new Field({
          name: 'papel',
          type: 'select',
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
      carol = new Record(app.findCollectionByNameOrId('_pb_users_auth_'))
      carol.set('email', 'carol@diretoriapromocoes.com.br')
      carol.set('password', 'Carol@2026')
      carol.set('name', 'Carol')
      carol.set('papel', 'equipe')
      carol.set('verified', true)
      app.save(carol)
    } else {
      if (carol.get('papel') !== 'equipe') {
        carol.set('papel', 'equipe')
        app.save(carol)
      }
    }

    // 3. regras: lojas e promotores visíveis/manipuláveis por qualquer usuário logado
    const eq = "@request.auth.id != ''"
    const regras = {
      lojas: { list: eq, view: eq, create: eq, update: eq, delete: eq },
      promotores: { list: eq, view: eq, create: eq, update: eq, delete: eq },
    }
    for (const [nome, regra] of Object.entries(regras)) {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = regra.list
      col.viewRule = regra.view
      col.createRule = regra.create
      col.updateRule = regra.update
      col.deleteRule = regra.delete
      app.save(col)
    }

    // 4. garante que os registros existentes ficam com owner = Daniel
    const daniel = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    for (const nome of ['lojas', 'promotores']) {
      const col = app.findCollectionByNameOrId(nome)
      const registros = app.findRecordsByFilter(col.name, 'owner = "" || owner = null', '', 0, 0)
      for (const r of registros) {
        r.set('owner', daniel.id)
        app.save(r)
      }
    }
  },
  (app) => {
    // rollback: volta regras owner-only e remove acesso
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    for (const nome of ['lojas', 'promotores']) {
      const col = app.findCollectionByNameOrId(nome)
      col.listRule = ownerRule
      col.viewRule = ownerRule
      col.createRule = ownerRule
      col.updateRule = ownerRule
      col.deleteRule = ownerRule
      app.save(col)
    }
  },
)
