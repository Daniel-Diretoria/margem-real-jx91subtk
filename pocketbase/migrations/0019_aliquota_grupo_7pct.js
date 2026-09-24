// Alíquota correta por CNPJ (informação do Daniel):
//  - DCG paga 17,33% | Grupo Diretoria paga 7%
// Os lançamentos de imposto provisionados ("Impostos 17,33% - X") foram
// importados com 17,33% para TODOS. Recalcula os do GRUPO a 7%, usando o
// faturamento bruto do mesmo cliente no mês, e renomeia a descrição.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const GRUPO = '5e19bxy2bhm23yx'

    const imps = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '" && cnpj = "' + GRUPO + '" && descricao ~ "Impostos 17,33%"',
      '',
      200,
      0,
    )
    let n = 0
    const log = []
    for (const imp of imps) {
      const clienteId = imp.getString('cliente')
      if (!clienteId) continue
      const receitas = app.findRecordsByFilter(
        'lancamentos',
        'owner = "' + admin.id + '" && cliente = "' + clienteId + '" && tipo = "entrada"',
        '',
        10,
        0,
      )
      if (receitas.length === 0) continue
      const bruto = receitas[0].getFloat('valor')
      const novo = Math.round(bruto * 0.07 * 100) / 100
      const clienteNome = imp.getString('descricao').split(' - ').slice(1).join(' - ')
      log.push(clienteNome + ': ' + imp.getFloat('valor') + ' -> ' + novo)
      imp.set('valor', novo)
      imp.set('descricao', 'Impostos 7% - ' + clienteNome)
      app.save(imp)
      n++
    }
    console.log('Provisões do Grupo recalculadas a 7%: ' + n)
    console.log(log.join(' | '))
  },
  (app) => {
    console.log('down: 0019 — noop (recálculo de valores).')
  },
)
