// Single-tenant: tudo que QUALQUER usuário criar em lojas/promotores fica
// com owner = Daniel. Sem isso, o que a Carol cadastrar ficaria invisível
// para ele (as regras de leitura são por owner).
//
// PEGADINHA JSVM: declarações de topo não são visíveis dentro de callbacks
// de hook — a busca do Daniel fica DENTRO do callback, a cada evento.
onRecordCreate(
  (e) => {
    try {
      const daniel = $app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'daniel@diretoriapromocoes.com.br',
      )
      e.record.set('owner', daniel.id)
    } catch (err) {
      console.log('owner_team_hook: daniel nao encontrado', err)
    }
    e.next()
  },
  'lojas',
  'promotores',
)
