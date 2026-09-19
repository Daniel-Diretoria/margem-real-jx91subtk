// Reforço de segurança no create: o dono do registro tem que ser o próprio
// usuário autenticado (além do frontend passar a enviar owner).
migrate(
  (app) => {
    const rule = "@request.auth.id != '' && @request.body.owner = @request.auth.id"
    const names = [
      'plano_contas',
      'clientes',
      'promotores',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
    ]
    for (const n of names) {
      const col = app.findCollectionByNameOrId(n)
      col.createRule = rule
      app.save(col)
    }
  },
  (app) => {
    const rule = "@request.auth.id != ''"
    const names = [
      'plano_contas',
      'clientes',
      'promotores',
      'lancamentos',
      'contas_receber',
      'contas_pagar',
    ]
    for (const n of names) {
      const col = app.findCollectionByNameOrId(n)
      col.createRule = rule
      app.save(col)
    }
  },
)
