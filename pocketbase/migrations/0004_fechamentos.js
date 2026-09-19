// Fase 2 — fechamento mensal: guarda a decisão do mês e o snapshot da DRE.
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    const col = new Collection({
      name: 'fechamentos',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        {
          name: 'owner',
          type: 'relation',
          required: true,
          collectionId: usersId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'mes', type: 'text', required: true, max: 7 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['aberto', 'fechado'],
          maxSelect: 1,
        },
        { name: 'decisao', type: 'text', max: 3000 },
        { name: 'dre', type: 'json', maxSize: 200000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_fech_owner_mes ON fechamentos (owner, mes)'],
    })
    app.save(col)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('fechamentos'))
    } catch (_) {}
  },
)
