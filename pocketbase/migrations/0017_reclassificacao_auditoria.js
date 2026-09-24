// Reclassificação dos custos de agosto conforme auditoria do Daniel (coluna
// "Observação" da planilha revisada). Total NÃO muda — só a composição:
//  - CEF Matriz (FGTS) → Encargos trabalhistas
//  - Promotores terceirizados (LA Promotoria, Jocilei, Maicon, Emerson,
//    Breno, GO Correspondente/G4) → Salários - campo
//  - Contadora (Danielle Alves) → sai de Salários, vai para Fornecedores
//  - DESC DP / JR MORA (desconto de duplicata) → Tarifas bancárias
//  - Debito Emprestimo (Pronampe) → Juros de empréstimo
//  - SEFAZ/DARE (Multa Rolding + DETRAN) → Multas e penalidades (nova)
//  - D.V.T. PIX 28/08 (condomínio) → Aluguel e utilities
//  - Bug: Silvia Alcantara saía em Tarifas ("ALCANTARA" contém "TAR")
//    → Salários - campo
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')

    // --- garante que todas as categorias de destino existam ---
    const DEFAULTS = [
      ['Encargos trabalhistas', 'Pessoal', 'Encargos', 'custos'],
      ['Salários - campo', 'Pessoal', 'Salários', 'custos'],
      ['Fornecedores/administrativo', 'Administrativo', 'Fornecedores', 'despesas_operacionais'],
      ['Tarifas bancárias', 'Financeiro', 'Tarifas', 'juros'],
      ['Juros de empréstimo', 'Financeiro', 'Juros', 'juros'],
      ['Aluguel e utilities', 'Administrativo', 'Ocupação', 'despesas_operacionais'],
      ['Multas e penalidades', 'Administrativo', 'Multas', 'despesas_operacionais'],
    ]
    const cat = {}
    const refresh = () => {
      for (const k in cat) delete cat[k]
      const plano = app.findRecordsByFilter(
        'plano_contas',
        'owner = "' + admin.id + '"',
        '',
        500,
        0,
      )
      for (const p of plano) cat[p.getString('nome')] = p.id
    }
    refresh()
    for (const [nome, categoria, subcategoria, linha] of DEFAULTS) {
      if (cat[nome]) continue
      const r = new Record(app.findCollectionByNameOrId('plano_contas'))
      r.set('owner', admin.id)
      r.set('nome', nome)
      r.set('tipo', 'despesa')
      r.set('categoria', categoria)
      r.set('subcategoria', subcategoria)
      r.set('linha_dre', linha)
      app.save(r)
      refresh()
    }

    const ALVO = {
      encargos: cat['Encargos trabalhistas'],
      campo: cat['Salários - campo'],
      forn: cat['Fornecedores/administrativo'],
      tarifas: cat['Tarifas bancárias'],
      juros: cat['Juros de empréstimo'],
      aluguel: cat['Aluguel e utilities'],
      multas: cat['Multas e penalidades'],
    }

    // [trecho do memo, destino] — ordem importa (primeiro match vence)
    const REGRAS = [
      ['CEF MATRIZ', 'encargos'],
      ['LA PROMOTORIA', 'campo'],
      ['JOCILEI DOS SANTOS', 'campo'],
      ['MAICON THIAGO LIMA', 'campo'],
      ['EMERSON RODRIGUES FERNANDES', 'campo'],
      ['BRENO APARECIDO', 'campo'],
      ['GO CORRESPONDENTE', 'campo'],
      ['DANIELLE CRISTINA ALVES', 'forn'],
      ['DESC DP BAIXA', 'tarifas'],
      ['JR MORA DESC', 'tarifas'],
      ['Debito Emprestimo', 'juros'],
      ['SEFAZ-SC/DARE', 'multas'],
      ['D.V.T. - PARTICIPACOES', 'aluguel'],
      ['SILVIA CRISTINA DIAS ALCANTARA', 'campo'],
    ]

    const lans = app.findRecordsByFilter(
      'lancamentos',
      'owner = "' + admin.id + '" && origem = "extrato"',
      '',
      500,
      0,
    )
    let n = 0
    const falhas = []
    for (const l of lans) {
      const memo = (l.getString('descricao') || '').toUpperCase()
      let destino = ''
      for (const [trecho, dest] of REGRAS) {
        if (memo.includes(trecho.toUpperCase())) {
          destino = dest
          break
        }
      }
      // D.V.T. PIX do dia 28 = condomínio; o boleto DVT 10/08 fica em fornecedores
      if (destino === 'aluguel' && l.getString('data') !== '2026-08-28') destino = ''
      const alvoId = destino ? ALVO[destino] : ''
      if (!destino || !alvoId) continue
      if (l.getString('categoria') === alvoId) continue
      try {
        l.set('categoria', alvoId)
        app.save(l)
        n++
      } catch (e) {
        falhas.push(
          l.id +
            ' [' +
            l.getString('data') +
            '] alvo=' +
            destino +
            ':' +
            alvoId +
            ' erro=' +
            (e && e.message ? e.message : String(e)),
        )
      }
    }
    if (falhas.length > 0) {
      throw new Error('0017 falhas (' + falhas.length + '): ' + falhas.join(' | '))
    }
    console.log('Lançamentos reclassificados: ' + n)
  },
  (app) => {
    console.log('down: reclassificação 0017 — noop (categorias anteriores mantidas).')
  },
)
