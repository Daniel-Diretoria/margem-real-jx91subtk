// Fechamento das pendências (parte 2):
//  1. Guias pagas em agosto (Simples/DARF, 6 itens = 16.806,44) são
//     liquidação de obrigações de JULHO (Simples paga mês+1) — a DRE de
//     agosto já provisiona o imposto da receita de agosto (7% Grupo /
//     17,33% DCG). Manter os dois = dupla contagem. Guias → fora do
//     resultado (baixa de provisão do mês anterior).
//  2. SISPAG 21/08 R$ 600 (JK Telefonia e Assessoria) → Telefonia e internet.
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const catMov = app.findFirstRecordByData(
      'plano_contas',
      'nome',
      'Movimentação de sócios e garantias',
    )
    const catTel = app.findFirstRecordByData('plano_contas', 'nome', 'Telefonia e internet')

    const lans = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '" && origem = "extrato" && tipo = "saida"',
      '',
      500,
      0,
    )
    let nGuias = 0
    let nTel = 0
    for (const l of lans) {
      const memo = (l.getString('descricao') || '').toUpperCase()
      const dia = l.getString('data').slice(0, 10)
      const ehGuia =
        (memo.includes('SIMPLES NACIONAL') || memo.includes('DARF')) &&
        dia >= '2026-08-01' &&
        dia <= '2026-08-31'
      if (ehGuia) {
        l.set('categoria', catMov.id)
        l.set('descricao', l.getString('descricao') + ' (ref. julho — baixa de provisão)')
        app.save(l)
        nGuias++
        continue
      }
      if (
        memo.includes('SISPAG') &&
        dia === '2026-08-21' &&
        Math.abs(l.getFloat('valor') - 600) < 0.01
      ) {
        l.set('categoria', catTel.id)
        app.save(l)
        nTel++
      }
    }
    console.log('Guias para fora do resultado: ' + nGuias + ' | JK Telefonia: ' + nTel)
  },
  (app) => {
    console.log('down: 0021 — noop.')
  },
)
