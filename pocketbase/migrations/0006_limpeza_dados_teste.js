// Limpeza dos dados fictícios de teste (idempotente): remove lançamentos,
// contas a receber/pagar, clientes, promotores e o CNPJ de teste.
// Mantém: usuário, plano de contas e fechamentos (nenhum criado até agora).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const filter = 'owner = "' + admin.id + '"'

    // filhos primeiro (relações), depois pais
    for (const col of [
      'lancamentos',
      'contas_receber',
      'contas_pagar',
      'contratos',
      'contas_bancarias',
    ]) {
      const recs = app.findRecordsByFilter(col, filter, '', 500, 0)
      for (const r of recs) app.delete(r)
    }

    // clientes e promotores de teste (Casa Kunzler foi criada no teste)
    const clientes = app.findRecordsByFilter('clientes', filter, '', 500, 0)
    for (const r of clientes) app.delete(r)

    const promotores = app.findRecordsByFilter('promotores', filter, '', 500, 0)
    for (const r of promotores) app.delete(r)

    // CNPJ de teste "Diretoria"
    const cnpjs = app.findRecordsByFilter('cnpjs', filter, '', 500, 0)
    for (const r of cnpjs) app.delete(r)

    console.log('Limpeza concluída: dados fictícios removidos.')
  },
  (app) => {
    // down: não há como restaurar registros apagados — noop proposital
    console.log('down: limpeza é irreversível (dados de teste).')
  },
)
