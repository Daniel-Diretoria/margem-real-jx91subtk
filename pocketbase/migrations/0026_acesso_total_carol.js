// Carol é SÓCIA (e esposa do Daniel): acesso TOTAL ao sistema — financeiro
// incluído. Sistema single-tenant: tudo fica na conta do Daniel (hook
// owner_team.js força owner = Daniel em todo create).
migrate(
  (app) => {
    // 1. papel da Carol vira dono (menu completo no frontend)
    const carol = app.findAuthRecordByEmail('_pb_users_auth_', 'carol@diretoriapromocoes.com.br')
    carol.set('papel', 'dono')
    app.save(carol)

    // 2. regras de TODAS as coleções abertas a qualquer usuário logado
    //    (usuários do sistema: só Daniel e Carol)
    const eq = "@request.auth.id != ''"
    const nomes = [
      'plano_contas',
      'clientes',
      'promotores',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
      'fechamentos',
      'cnpjs',
      'contas_bancarias',
      'contratos',
      'lojas',
    ]
    for (const n of nomes) {
      const col = app.findCollectionByNameOrId(n)
      col.listRule = eq
      col.viewRule = eq
      col.createRule = eq
      col.updateRule = eq
      col.deleteRule = eq
      app.save(col)
    }
  },
  (app) => {
    // rollback: volta tudo para owner-only
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    const nomes = [
      'plano_contas',
      'clientes',
      'promotores',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
      'fechamentos',
      'cnpjs',
      'contas_bancarias',
      'contratos',
      'lojas',
    ]
    for (const n of nomes) {
      const col = app.findCollectionByNameOrId(n)
      col.listRule = ownerRule
      col.viewRule = ownerRule
      col.createRule = ownerRule
      col.updateRule = ownerRule
      col.deleteRule = ownerRule
      app.save(col)
    }
  },
)
