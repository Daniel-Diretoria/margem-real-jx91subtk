// Gestão de pagamentos por promotor:
//  - promotores: + tipo_vinculo (CLT/MEI/PJ/terceirizado), documento (CPF/CNPJ),
//    lojas (texto livre), status (ativo/inativo)
//  - lancamentos: + promotor (relation) — linka o PIX pago ao promotor,
//    para ter custo real por promotor e por operação.
migrate(
  (app) => {
    const prom = app.findCollectionByNameOrId('promotores')
    if (!prom.fields.getByName('tipo_vinculo')) {
      prom.fields.add(
        new SelectField({
          name: 'tipo_vinculo',
          values: ['CLT', 'MEI', 'PJ', 'terceirizado'],
          maxSelect: 1,
        }),
      )
    }
    if (!prom.fields.getByName('documento')) {
      prom.fields.add(new TextField({ name: 'documento', max: 20 }))
    }
    if (!prom.fields.getByName('lojas')) {
      prom.fields.add(new TextField({ name: 'lojas', max: 500 }))
    }
    if (!prom.fields.getByName('status')) {
      prom.fields.add(
        new SelectField({
          name: 'status',
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        }),
      )
    }
    app.save(prom)

    const lanc = app.findCollectionByNameOrId('lancamentos')
    if (!lanc.fields.getByName('promotor')) {
      lanc.fields.add(
        new RelationField({
          name: 'promotor',
          collectionId: app.findCollectionByNameOrId('promotores').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(lanc)
  },
  (app) => {
    console.log('down: 0022 — noop (campos aditivos).')
  },
)
