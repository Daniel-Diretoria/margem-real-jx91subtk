// Ajustes do Daniel (23/09): SULMINAS, ESSASIM, SULFRIOS e DEUTTNER são da
// JDR; SAGRA é a BOLACHA GOBLEE (renomear). Recalcula pct_rateio com os
// minutos consolidados (total 39.360 min/sem).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const clientes = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)

    // minutos semanais consolidados (inclui as 4 marcas da JDR e a SAGRA)
    const minutos = {
      ITALAC: 4260,
      FRUTAP: 4110,
      'MASSA DITALIA': 3030,
      'OLIVEIRA (OLIVEIRA E NOVAES)': 3030,
      'POLPA AMAZONIA': 2010,
      'COCO LEVE': 2010,
      'SERTAOZINHO (TERRA DE MINAS)': 2010,
      DOCCA: 1890,
      'BRQ CASA KUNZLER': 1800,
      PARMISSIMO: 1770,
      'PAO E ARTE': 1680,
      ADESUL: 1680,
      LILIBEL: 1440,
      'CIA CANOINHAS': 1380,
      CHULETAO: 1350,
      MARIGOLD: 1350,
      MENDEZ: 1350,
      'SUCO JAL': 840,
      'PIZZA OLIVA': 750,
      BENAFRUTTI: 330,
      JDR: 990,
      SAGRA: 180,
      CASAREDO: 60,
      'LE ANTONI': 60,
      MILLEBIER: 0,
      SUNCOLOR: 0,
      'FRUTAP ATACADAO': 0,
      DONORTE: 0,
      'ZS REPRESENTACOES': 0,
      'CONEXAO LIVELLO': 0,
    }
    const total = 39360

    for (const c of clientes) {
      const nome = c.getString('nome')
      // 1. renomeia BOLACHA GOBLEE → SAGRA
      if (nome === 'BOLACHA GOBLEE') {
        c.set('nome', 'SAGRA')
        app.save(c)
      }
      const min = minutos[nome === 'SAGRA' ? 'SAGRA' : nome]
      if (min === undefined) continue
      c.set('dias_atendimento', min)
      c.set('pct_rateio', Math.round((min / total) * 10000) / 100)
      app.save(c)
    }
  },
  (app) => {
    console.log('down: recálculo — noop.')
  },
)
