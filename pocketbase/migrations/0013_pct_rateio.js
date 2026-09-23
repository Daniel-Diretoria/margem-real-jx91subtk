// Rateio por atendimento: grava em cada cliente o % de rateio calculado a
// partir do relatório de lojas/contratos (minutos de atendimento semanais —
// o melhor proxy de consumo do time; visitas semanais × minutos).
// Origem: relatorio_loja_contrato_horas_dias.xls (1120 linhas, 1119 lojas).
migrate(
  (app) => {
    const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'daniel@diretoriapromocoes.com.br')
    const clientesCol = app.findCollectionByNameOrId('clientes')
    if (!clientesCol.fields.getByName('pct_rateio')) {
      clientesCol.fields.add(new NumberField({ name: 'pct_rateio' }))
      app.save(clientesCol)
    }

    const clientes = app.findRecordsByFilter('clientes', 'owner = "' + admin.id + '"', '', 200, 0)

    // minutos semanais por indústria (consolidado do relatório)
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
      CASAREDO: 60,
      'LE ANTONI': 60,
      MILLEBIER: 0,
      // atendidas mas sem faturamento em agosto (rateio = 0 até decidir)
      SUNCOLOR: 0,
      JDR: 0,
      'FRUTAP ATACADAO': 0,
      'BOLACHA GOBLEE': 0,
      DONORTE: 0,
      'ZS REPRESENTACOES': 0,
      'CONEXAO LIVELLO': 0,
    }

    const total = Object.values(minutos).reduce((s, v) => s + v, 0)
    for (const c of clientes) {
      const nome = c.getString('nome')
      const min = minutos[nome]
      if (min === undefined) continue
      c.set('dias_atendimento', min) // minutos semanais (base do cálculo)
      c.set('pct_rateio', total > 0 ? Math.round((min / total) * 10000) / 100 : 0)
      app.save(c)
    }
  },
  (app) => {
    console.log('down: rateio é recálculo — noop.')
  },
)
