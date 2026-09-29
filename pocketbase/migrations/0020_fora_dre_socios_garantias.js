// Pendências fechadas pelo Daniel (rótulos na 3ª revisão da auditoria + voz):
//  - SISPAG = lote de pagamentos. Conteúdo identificado:
//    • TRANSF DCG (25.000 + 3.707,24) e TRANSF CAROL (16.000) e
//      DANIEL 1.900 + DCG 2.600 → rotativo de sócios / transferência própria
//    • AMIL 2.782,66 + Principia 265,62 + Itapoá 55,65 → contas FAMILIARES
//      pagas pelo PJ (batem com a aba Financeiro Familiar da planilha)
//    • JK Telefonia 600 → fornecedor real (fica)
//  - CTA GAR 20.000 → conta garantia (entrou 19/08 +20k, saiu 24/08 −20k)
//  - NU PAGAMENTOS 2.463,69 → cartão Nubank do Daniel (aba Familiar, exato)
// Tratamento: nova linha_dre 'excluido' + categoria "Movimentação de sócios
// e garantias" — sai da DRE (não é receita nem custo operacional).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')

    // 1. adiciona 'excluido' às opções de linha_dre
    const plano = app.findCollectionByNameOrId('plano_contas')
    const linhaField = plano.fields.getByName('linha_dre')
    if (!linhaField.values.includes('excluido')) {
      linhaField.values.push('excluido')
      app.save(plano)
    }

    // 2. categoria de movimentação não operacional
    let catMov = ''
    const cats = app.findRecordsByFilter('plano_contas', 'owner = "' + admin.id + '"', '', 500, 0)
    for (const c of cats) {
      if (c.getString('nome') === 'Movimentação de sócios e garantias') catMov = c.id
    }
    if (!catMov) {
      const r = new Record(plano)
      r.set('owner', admin.id)
      r.set('nome', 'Movimentação de sócios e garantias')
      r.set('tipo', 'despesa')
      r.set('categoria', 'Não operacional')
      r.set('subcategoria', 'Sócios/Garantias')
      r.set('linha_dre', 'excluido')
      app.save(r)
      catMov = app.findFirstRecordByData(
        'plano_contas',
        'nome',
        'Movimentação de sócios e garantias',
      ).id
    }

    // 3. reclassifica (memo + data + valor para não pegar errado)
    const ALVOS = [
      ['SISPAG FORNECEDORES', '2026-08-28', 3707.24],
      ['SISPAG FORNECEDORES', '2026-08-19', 25000],
      ['SISPAG FORNECEDORES', '2026-08-12', 16000],
      ['SISPAG FORNECEDORES', '2026-08-10', 4500],
      ['SISPAG FORNECEDORES', '2026-08-10', 3048.28],
      ['SISPAG FORNECEDORES', '2026-08-19', 55.65],
      ['CTA GAR', '2026-08-24', 20000],
      ['NU PAGAMENTOS', '2026-08-31', 2463.69],
    ]
    const lans = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '" && origem = "extrato" && tipo = "saida"',
      '',
      500,
      0,
    )
    let n = 0
    for (const l of lans) {
      const memo = (l.getString('descricao') || '').toUpperCase()
      const dia = l.getString('data').slice(0, 10)
      const valor = l.getFloat('valor')
      for (const [trecho, alvoData, alvoValor] of ALVOS) {
        if (memo.includes(trecho) && dia === alvoData && Math.abs(valor - alvoValor) < 0.01) {
          l.set('categoria', catMov)
          app.save(l)
          n++
          break
        }
      }
    }
    console.log('Lançamentos movidos para fora da DRE: ' + n)
  },
  (app) => {
    console.log('down: 0020 — noop.')
  },
)
