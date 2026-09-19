// Fase 3 — multi-CNPJ: entidades, contas bancárias/cartões, contratos
// e vínculos nas coleções financeiras existentes.
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    const createRule = "@request.auth.id != '' && @request.body.owner = @request.auth.id"

    // 1. CNPJs
    const cnpjs = new Collection({
      name: 'cnpjs',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
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
        { name: 'razao_social', type: 'text', required: true, max: 200 },
        { name: 'cnpj', type: 'text', required: true, max: 20 },
        { name: 'apelido', type: 'text', max: 80 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_cnpjs_owner ON cnpjs (owner)'],
    })
    app.save(cnpjs)

    const cnpjsId = app.findCollectionByNameOrId('cnpjs').id

    // 2. Contas bancárias e cartões
    const contas = new Collection({
      name: 'contas_bancarias',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
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
        { name: 'apelido', type: 'text', required: true, max: 120 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['conta_corrente', 'poupanca', 'cartao'],
          maxSelect: 1,
        },
        { name: 'banco', type: 'text', max: 120 },
        { name: 'cnpj', type: 'relation', collectionId: cnpjsId, maxSelect: 1 },
        { name: 'limite', type: 'number' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contas_owner ON contas_bancarias (owner)'],
    })
    app.save(contas)

    const clientesId = app.findCollectionByNameOrId('clientes').id

    // 3. Contratos com indústrias
    const contratos = new Collection({
      name: 'contratos',
      type: 'base',
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: createRule,
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
        { name: 'cliente', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        { name: 'cnpj', type: 'relation', collectionId: cnpjsId, maxSelect: 1 },
        { name: 'descricao', type: 'text', max: 300 },
        { name: 'valor_mensal', type: 'number' },
        { name: 'data_inicio', type: 'date' },
        { name: 'data_fim', type: 'date' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contratos_owner ON contratos (owner)'],
    })
    app.save(contratos)

    // 4. Vínculos nas coleções existentes
    const lanc = app.findCollectionByNameOrId('lancamentos')
    lanc.fields.add(new RelationField({ name: 'cnpj', collectionId: cnpjsId, maxSelect: 1 }))
    lanc.fields.add(
      new RelationField({
        name: 'conta',
        collectionId: app.findCollectionByNameOrId('contas_bancarias').id,
        maxSelect: 1,
      }),
    )
    app.save(lanc)

    const rec = app.findCollectionByNameOrId('contas_receber')
    rec.fields.add(new RelationField({ name: 'cnpj', collectionId: cnpjsId, maxSelect: 1 }))
    app.save(rec)

    const pag = app.findCollectionByNameOrId('contas_pagar')
    pag.fields.add(new RelationField({ name: 'cnpj', collectionId: cnpjsId, maxSelect: 1 }))
    app.save(pag)

    const prom = app.findCollectionByNameOrId('promotores')
    prom.fields.add(new RelationField({ name: 'cnpj', collectionId: cnpjsId, maxSelect: 1 }))
    app.save(prom)
  },
  (app) => {
    for (const n of ['contratos', 'contas_bancarias', 'cnpjs']) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (_) {}
    }
  },
)
