// Fase 1 — fundação: plano de contas, clientes, promotores, lançamentos,
// contas a receber e contas a pagar. Tudo isolado por usuário (owner).
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const ownerRule = "@request.auth.id != '' && owner = @request.auth.id"
    const createRule = "@request.auth.id != ''"

    const plano = new Collection({
      name: 'plano_contas',
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
        { name: 'nome', type: 'text', required: true, max: 120 },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['receita', 'despesa'],
          maxSelect: 1,
        },
        { name: 'categoria', type: 'text', max: 120 },
        { name: 'subcategoria', type: 'text', max: 120 },
        {
          name: 'linha_dre',
          type: 'select',
          required: true,
          values: [
            'receita_bruta',
            'deducoes',
            'custos',
            'despesas_operacionais',
            'juros',
            'outras',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_plano_owner ON plano_contas (owner)'],
    })
    app.save(plano)

    const clientes = new Collection({
      name: 'clientes',
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
        { name: 'nome', type: 'text', required: true, max: 160 },
        { name: 'contato', type: 'text', max: 160 },
        { name: 'observacoes', type: 'text', max: 500 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_clientes_owner ON clientes (owner)'],
    })
    app.save(clientes)

    const clientesId = app.findCollectionByNameOrId('clientes').id

    const promotores = new Collection({
      name: 'promotores',
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
        { name: 'nome', type: 'text', required: true, max: 160 },
        {
          name: 'cargo',
          type: 'select',
          required: true,
          values: ['promotor', 'lider'],
          maxSelect: 1,
        },
        { name: 'salario', type: 'number' },
        { name: 'encargos', type: 'number' },
        { name: 'beneficios', type: 'number' },
        { name: 'cliente', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_promotores_owner ON promotores (owner)'],
    })
    app.save(promotores)

    const planoId = app.findCollectionByNameOrId('plano_contas').id

    const lancamentos = new Collection({
      name: 'lancamentos',
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
        { name: 'data', type: 'date', required: true },
        { name: 'descricao', type: 'text', required: true, max: 300 },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['entrada', 'saida'],
          maxSelect: 1,
        },
        { name: 'categoria', type: 'relation', collectionId: planoId, maxSelect: 1 },
        { name: 'cliente', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        {
          name: 'origem',
          type: 'select',
          required: true,
          values: ['manual', 'extrato'],
          maxSelect: 1,
        },
        { name: 'conciliado', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_lanc_owner_data ON lancamentos (owner, data)'],
    })
    app.save(lancamentos)

    const receber = new Collection({
      name: 'contas_receber',
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
        { name: 'descricao', type: 'text', required: true, max: 300 },
        { name: 'cliente', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        { name: 'valor', type: 'number', required: true },
        { name: 'vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['previsto', 'realizado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'data_recebimento', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_receber_owner_venc ON contas_receber (owner, vencimento)'],
    })
    app.save(receber)

    const pagar = new Collection({
      name: 'contas_pagar',
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
        { name: 'descricao', type: 'text', required: true, max: 300 },
        { name: 'valor', type: 'number', required: true },
        { name: 'vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['previsto', 'realizado', 'cancelado'],
          maxSelect: 1,
        },
        { name: 'categoria', type: 'relation', collectionId: planoId, maxSelect: 1 },
        { name: 'data_pagamento', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pagar_owner_venc ON contas_pagar (owner, vencimento)'],
    })
    app.save(pagar)
  },
  (app) => {
    const names = [
      'contas_pagar',
      'contas_receber',
      'lancamentos',
      'promotores',
      'clientes',
      'plano_contas',
    ]
    for (const n of names) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (_) {}
    }
  },
)
