// Correções da planilha real: imposto 17,33% (não 17%), datas de competência
// agosto (não setembro) e campo dias_atendimento em clientes para o rateio.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')

    // 1. campo dias_atendimento em clientes
    const clientesCol = app.findCollectionByNameOrId('clientes')
    if (!clientesCol.fields.getByName('dias_atendimento')) {
      clientesCol.fields.add(new NumberField({ name: 'dias_atendimento' }))
      app.save(clientesCol)
    }

    const lancamentos = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '"',
      '',
      500,
      0,
    )

    // índice: cliente → bruto (entrada de faturamento)
    const brutoPorCliente = {}
    for (const l of lancamentos) {
      if (
        l.getString('tipo') === 'entrada' &&
        l.getString('descricao').startsWith('Faturamento agosto - ')
      ) {
        const cli = l.getString('cliente')
        brutoPorCliente[cli] = Number(l.getNumber('valor'))
      }
    }

    for (const l of lancamentos) {
      const desc = l.getString('descricao')
      let mudou = false

      // 2. competência agosto: 2026-09-XX → 2026-08-XX (mesmo dia)
      const data = l.getString('data')
      if (data.startsWith('2026-09')) {
        l.set('data', '2026-08' + data.slice(7))
        mudou = true
      }

      // 3. imposto 17,33% sobre o bruto do cliente
      if (desc.startsWith('Impostos 17% - ')) {
        const cli = l.getString('cliente')
        const bruto = brutoPorCliente[cli] || 0
        const novo = Math.round(bruto * 0.1733 * 100) / 100
        l.set('valor', novo)
        l.set('descricao', 'Impostos 17,33% - ' + desc.slice('Impostos 17% - '.length))
        mudou = true
      }

      if (mudou) app.save(l)
    }
  },
  (app) => {
    // down: irreversível (recálculo) — noop
    console.log('down: correção 17,33%/competência é irreversível.')
  },
)
