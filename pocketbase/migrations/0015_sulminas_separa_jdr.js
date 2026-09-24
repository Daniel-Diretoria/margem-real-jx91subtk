// Correção (23/09): SULMINAS NÃO é da JDR — é cliente próprio, atendimento
// iniciado em SETEMBRO (por isso sem faturamento nem atendimento em agosto).
// JDR fica com ESSASIM, SULFRIOS e DEUTTNER apenas.
// JDR: 990 - 270 = 720 min/sem (1,83%) | SULMINAS: 270 min/sem (0,69%).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const clientes = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)

    const cnpjs = app.findRecordsByFilter('cnpjs', 'owner = "' + admin.id + '"', '', 100, 0)
    let dcgId = ''
    for (const c of cnpjs) {
      if (c.getString('apelido') === 'DCG') dcgId = c.id
    }

    let sulminas = null
    for (const c of clientes) {
      const nome = c.getString('nome')
      if (nome === 'SULMINAS') sulminas = c
      if (nome === 'JDR') {
        c.set('dias_atendimento', 720)
        c.set('pct_rateio', 1.83)
        app.save(c)
      }
    }

    if (!sulminas) {
      sulminas = new Record(clientesCol)
      sulminas.set('owner', admin.id)
      sulminas.set('nome', 'SULMINAS')
      sulminas.set('ativo', true)
    }
    sulminas.set('dias_atendimento', 270)
    sulminas.set('pct_rateio', 0.69)
    app.save(sulminas)
  },
  (app) => {
    console.log('down: correção de rateio — noop.')
  },
)
