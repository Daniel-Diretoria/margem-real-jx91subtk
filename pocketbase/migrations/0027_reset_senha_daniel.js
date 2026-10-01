// Redefinição da senha do usuário Daniel para "Daniel@2026"
// Preserva id, nome, papel, email e demais campos intactos.
migrate(
  (app) => {
    const daniel = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    daniel.setPassword('Daniel@2026')
    app.save(daniel)
  },
  (app) => {
    // Reversão opcional (não altera id/dados)
    try {
      const daniel = app.findAuthRecordByEmail(
        '_pb_users_auth_',
        'daniel@diretoriapromocoes.com.br',
      )
      daniel.setPassword('Margem@2026')
      app.save(daniel)
    } catch (_) {}
  },
)
