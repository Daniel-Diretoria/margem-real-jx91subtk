// Fix 0017: o guard de data comparava o datetime completo do PocketBase
// ("2026-08-28 00:00:00.000Z") com "2026-08-28" e sempre falhava — o PIX do
// condomínio (D.V.T. 28/08) ficou em Fornecedores. Aqui vai para Aluguel.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const aluguel = app.findFirstRecordByData('plano_contas', 'nome', 'Aluguel e utilities')
    const lans = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '" && origem = "extrato"',
      '',
      500,
      0,
    )
    let n = 0
    for (const l of lans) {
      const memo = (l.getString('descricao') || '').toUpperCase()
      const dia = l.getString('data').slice(0, 10)
      if (memo.includes('D.V.T. - PARTICIPACOES') && dia === '2026-08-28') {
        l.set('categoria', aluguel.id)
        app.save(l)
        n++
      }
    }
    console.log('D.V.T. condomínio → Aluguel e utilities: ' + n)
  },
  (app) => {
    console.log('down: 0018 — noop.')
  },
)
