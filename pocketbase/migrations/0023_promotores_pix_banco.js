// Painel da Carol: promotores com dados de pagamento.
//  - chave_pix: CPF/e-mail/telefone para pagamento direto
//  - banco: nome do banco (opcional — muitos recebem só PIX)
migrate(
  (app) => {
    const prom = app.findCollectionByNameOrId('promotores')
    if (!prom.fields.getByName('chave_pix')) {
      prom.fields.add(new TextField({ name: 'chave_pix', max: 120 }))
    }
    if (!prom.fields.getByName('banco')) {
      prom.fields.add(new TextField({ name: 'banco', max: 60 }))
    }
    app.save(prom)
  },
  (app) => {
    console.log('down: 0023 — noop (campos aditivos).')
  },
)
