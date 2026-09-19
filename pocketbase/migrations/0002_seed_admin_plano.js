// Seed idempotente: usuário admin (Daniel) + plano de contas inicial com
// níveis (categoria → subcategoria → linha da DRE).
migrate(
  (app) => {
    // --- usuário admin ---
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const admin = new Record(users)
      admin.setEmail('daniel@diretoriapromocoes.com.br')
      admin.setPassword('Margem@2026')
      admin.setVerified(true)
      admin.set('name', 'Daniel Oliveira')
      app.save(admin)
    }

    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')

    // --- plano de contas inicial ---
    const plano = app.findCollectionByNameOrId('plano_contas')
    const seed = [
      // Receitas
      ['Faturamento de serviços', 'receita', 'Receita operacional', 'Faturamento', 'receita_bruta'],
      ['Reembolsos', 'receita', 'Receita operacional', 'Reembolsos', 'receita_bruta'],
      // Deduções
      ['Simples Nacional', 'despesa', 'Impostos', 'Simples Nacional', 'deducoes'],
      ['Impostos sobre serviço', 'despesa', 'Impostos', 'Outros impostos', 'deducoes'],
      // Custos
      ['Salários - campo', 'despesa', 'Pessoal', 'Salários', 'custos'],
      ['Encargos trabalhistas', 'despesa', 'Pessoal', 'Encargos', 'custos'],
      ['Benefícios', 'despesa', 'Pessoal', 'Benefícios', 'custos'],
      ['Deslocamento / combustível', 'despesa', 'Operação', 'Deslocamento', 'custos'],
      ['Uniforme e material de campo', 'despesa', 'Operação', 'Material', 'custos'],
      // Despesas operacionais
      ['Salário administrativo', 'despesa', 'Pessoal', 'Salários', 'despesas_operacionais'],
      ['Aluguel e utilities', 'despesa', 'Administrativo', 'Ocupação', 'despesas_operacionais'],
      ['Software e sistemas', 'despesa', 'Administrativo', 'Tecnologia', 'despesas_operacionais'],
      ['Telefonia e internet', 'despesa', 'Administrativo', 'Tecnologia', 'despesas_operacionais'],
      // Juros
      ['Juros de empréstimo', 'despesa', 'Financeiro', 'Juros', 'juros'],
      ['Tarifas bancárias', 'despesa', 'Financeiro', 'Tarifas', 'juros'],
    ]

    const existentes = app.findRecordsByFilter(
      'plano_contas',
      'owner = "' + admin.id + '"',
      '',
      500,
      0,
    )
    const nomesExistentes = {}
    for (const r of existentes) {
      nomesExistentes[r.getString('nome')] = true
    }

    for (const s of seed) {
      if (nomesExistentes[s[0]]) continue
      const rec = new Record(plano)
      rec.set('owner', admin.id)
      rec.set('nome', s[0])
      rec.set('tipo', s[1])
      rec.set('categoria', s[2])
      rec.set('subcategoria', s[3])
      rec.set('linha_dre', s[4])
      app.save(rec)
    }
  },
  (app) => {
    // down: remove apenas o plano de contas semeado (mantém o usuário)
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
      const recs = app.findRecordsByFilter('plano_contas', 'owner = "' + admin.id + '"', '', 500, 0)
      for (const r of recs) app.delete(r)
    } catch (_) {}
  },
)
