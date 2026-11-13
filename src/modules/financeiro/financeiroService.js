const db = require('../../database/db');
const { randomUUID } = require('crypto');

class FinanceiroService {
  arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Cadastra um novo título financeiro (Pagar ou Receber) com geração de parcelas (CA-1)
   */
  async criarTitulo(organizationId, dados) {
    const { tipo, pessoa_nome, descricao, valor_total, quantidade_parcelas, data_emissao, primeiro_vencimento } = dados;

    if (!tipo || !pessoa_nome || !descricao || !valor_total) {
      throw new Error("Tipo, pessoa/fornecedor, descrição e valor total são obrigatórios.");
    }

    const tipoNormalizado = tipo.toUpperCase();
    if (!['PAGAR', 'RECEBER'].includes(tipoNormalizado)) {
      throw new Error("Tipo deve ser 'PAGAR' ou 'RECEBER'.");
    }

    const valorTotalNum = this.arredondar(valor_total);
    if (isNaN(valorTotalNum) || valorTotalNum <= 0) {
      throw new Error("Valor total deve ser estritamente positivo.");
    }

    const qtdParcelas = parseInt(quantidade_parcelas, 10) || 1;
    if (qtdParcelas < 1) {
      throw new Error("Quantidade de parcelas deve ser ao menos 1.");
    }

    const tituloId = dados.id || `tit-${randomUUID()}`;
    const emissao = data_emissao || new Date().toISOString().substring(0, 10);
    const dataBaseVencimento = primeiro_vencimento ? new Date(primeiro_vencimento) : new Date(emissao);

    // Divisão de parcelas com ajuste de centavos na última parcela
    const valorParcelaBase = this.arredondar(valorTotalNum / qtdParcelas);
    let somaParcelas = 0;
    const parcelas = [];

    for (let i = 1; i <= qtdParcelas; i++) {
      let valorDaParcela = valorParcelaBase;
      if (i === qtdParcelas) {
        valorDaParcela = this.arredondar(valorTotalNum - somaParcelas);
      } else {
        somaParcelas = this.arredondar(somaParcelas + valorDaParcela);
      }

      // Calcula a data de vencimento sequencial (cada parcela com intervalo de 30 dias)
      const dataVenc = new Date(dataBaseVencimento);
      if (i > 1) {
        dataVenc.setDate(dataVenc.getDate() + (i - 1) * 30);
      }
      const dataVencStr = dataVenc.toISOString().substring(0, 10);

      parcelas.push({
        id: `parc-${randomUUID()}`,
        titulo_id: tituloId,
        numero_parcela: i,
        data_vencimento: dataVencStr,
        valor_original: valorDaParcela,
        valor_pago: 0,
        saldo_pendente: valorDaParcela,
        status: 'PENDENTE'
      });
    }

    const now = new Date().toISOString();

    // Persistência atômica
    return await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO titulos_financeiros
          (id, organization_id, tipo, pessoa_nome, descricao, valor_total, quantidade_parcelas, data_emissao, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDENTE', ?)`,
        [tituloId, organizationId, tipoNormalizado, pessoa_nome.trim(), descricao.trim(), valorTotalNum, qtdParcelas, emissao, now]
      );

      for (const p of parcelas) {
        await tx.run(
          `INSERT INTO parcelas_financeiras
            (id, titulo_id, numero_parcela, data_vencimento, valor_original, valor_pago, saldo_pendente, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.id, p.titulo_id, p.numero_parcela, p.data_vencimento, p.valor_original, p.valor_pago, p.saldo_pendente, p.status]
        );
      }

      return await this.obterTituloPorId(tituloId, organizationId);
    });
  }

  /**
   * Obtém título por ID com parcelas e baixas associadas
   */
  async obterTituloPorId(id, organizationId) {
    const titulo = await db.get(
      `SELECT * FROM titulos_financeiros WHERE id = ? AND organization_id = ?`,
      [id, organizationId]
    );

    if (!titulo) return null;

    const parcelas = await db.all(
      `SELECT * FROM parcelas_financeiras WHERE titulo_id = ? ORDER BY numero_parcela ASC`,
      [id]
    );

    // Carrega baixas de cada parcela
    for (const p of parcelas) {
      p.baixas = await db.all(
        `SELECT * FROM baixas_financeiras WHERE parcela_id = ? ORDER BY data_baixa DESC`,
        [p.id]
      );
    }

    return {
      ...titulo,
      parcelas
    };
  }

  /**
   * Realiza a baixa de uma parcela (parcial ou total) (CA-2, CA-3, CA-4, CA-5)
   */
  async baixarParcela(organizationId, parcelaId, dadosBaixa) {
    const { valor_pago, data_baixa, forma_pagamento, observacao } = dadosBaixa;

    const valorPagoNum = this.arredondar(valor_pago);
    if (isNaN(valorPagoNum) || valorPagoNum <= 0) {
      throw new Error("O valor da baixa deve ser estritamente maior que zero.");
    }

    // Busca a parcela e valida pertencimento à organização
    const parcela = await db.get(
      `SELECT p.*, t.organization_id, t.id as titulo_id 
       FROM parcelas_financeiras p
       INNER JOIN titulos_financeiros t ON t.id = p.titulo_id
       WHERE p.id = ? AND t.organization_id = ?`,
      [parcelaId, organizationId]
    );

    if (!parcela) {
      const err = new Error("Parcela não encontrada ou não pertence à organização informada.");
      err.statusCode = 404;
      throw err;
    }

    if (parcela.status === 'PAGO' || parcela.saldo_pendente <= 0) {
      const err = new Error("Esta parcela já foi integralmente quitada.");
      err.statusCode = 400;
      throw err;
    }

    // CA-5: Bloqueio caso o valor pago exceda o saldo pendente
    if (valorPagoNum > parcela.saldo_pendente) {
      const err = new Error(
        `Valor da baixa (R$ ${valorPagoNum.toFixed(2)}) excede o saldo pendente da parcela (R$ ${parcela.saldo_pendente.toFixed(2)}).`
      );
      err.statusCode = 400;
      throw err;
    }

    const novoValorPago = this.arredondar(parcela.valor_pago + valorPagoNum);
    const novoSaldoPendente = this.arredondar(parcela.saldo_pendente - valorPagoNum);

    // Determina status da parcela: CA-2 (PARCIAL) ou CA-3 (PAGO)
    const novoStatusParcela = novoSaldoPendente <= 0.0001 ? 'PAGO' : 'PARCIAL';

    const baixaId = `bx-${randomUUID()}`;
    const dtBaixa = data_baixa || new Date().toISOString().substring(0, 10);
    const now = new Date().toISOString();

    return await db.transaction(async (tx) => {
      // 1. Registra a baixa
      await tx.run(
        `INSERT INTO baixas_financeiras
          (id, parcela_id, data_baixa, valor_pago, forma_pagamento, observacao, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [baixaId, parcelaId, dtBaixa, valorPagoNum, forma_pagamento || 'DINHEIRO', observacao || null, now]
      );

      // 2. Atualiza a parcela
      await tx.run(
        `UPDATE parcelas_financeiras
         SET valor_pago = ?, saldo_pendente = ?, status = ?
         WHERE id = ?`,
        [novoValorPago, novoSaldoPendente, novoStatusParcela, parcelaId]
      );

      // 3. CA-4: Atualiza o status consolidado do título pai
      const todasParcelas = await tx.all(
        `SELECT status, saldo_pendente FROM parcelas_financeiras WHERE titulo_id = ?`,
        [parcela.titulo_id]
      );

      const todasPagas = todasParcelas.every(p => p.status === 'PAGO');
      const algumaPagaOuParcial = todasParcelas.some(p => p.status === 'PAGO' || p.status === 'PARCIAL');

      let novoStatusTitulo = 'PENDENTE';
      if (todasPagas) {
        novoStatusTitulo = 'PAGO';
      } else if (algumaPagaOuParcial) {
        novoStatusTitulo = 'PARCIAL';
      }

      await tx.run(
        `UPDATE titulos_financeiros SET status = ? WHERE id = ?`,
        [novoStatusTitulo, parcela.titulo_id]
      );

      return await this.obterTituloPorId(parcela.titulo_id, organizationId);
    });
  }

  /**
   * Consulta títulos com filtros e resumo financeiro (CA-6)
   */
  async listarTitulos(organizationId, filtros = {}) {
    let sql = `
      SELECT t.*, 
        COALESCE(SUM(p.valor_pago), 0) as total_pago,
        COALESCE(SUM(p.saldo_pendente), 0) as total_pendente
      FROM titulos_financeiros t
      LEFT JOIN parcelas_financeiras p ON p.titulo_id = t.id
      WHERE t.organization_id = ?
    `;
    const params = [organizationId];

    if (filtros.tipo) {
      sql += ` AND t.tipo = ?`;
      params.push(filtros.tipo.toUpperCase());
    }
    if (filtros.status) {
      sql += ` AND t.status = ?`;
      params.push(filtros.status.toUpperCase());
    }
    if (filtros.busca) {
      sql += ` AND (t.descricao LIKE ? OR t.pessoa_nome LIKE ?)`;
      params.push(`%${filtros.busca}%`, `%${filtros.busca}%`);
    }

    sql += ` GROUP BY t.id ORDER BY t.data_emissao DESC, t.created_at DESC`;

    const titulos = await db.all(sql, params);

    // Carrega parcelas resumidas
    for (const t of titulos) {
      t.parcelas = await db.all(
        `SELECT id, numero_parcela, data_vencimento, valor_original, valor_pago, saldo_pendente, status
         FROM parcelas_financeiras
         WHERE titulo_id = ?
         ORDER BY numero_parcela ASC`,
        [t.id]
      );
    }

    return titulos;
  }

  /**
   * Resumo de indicadores financeiros consolidados (Cards do Dashboard)
   */
  async obterResumoFinanceiro(organizationId) {
    const titulos = await db.all(
      `SELECT t.tipo, t.status, p.valor_original, p.valor_pago, p.saldo_pendente
       FROM titulos_financeiros t
       INNER JOIN parcelas_financeiras p ON p.titulo_id = t.id
       WHERE t.organization_id = ?`,
      [organizationId]
    );

    let totalPagar = 0;
    let totalPagarPendente = 0;
    let totalPagarQuitado = 0;

    let totalReceber = 0;
    let totalReceberPendente = 0;
    let totalReceberQuitado = 0;

    titulos.forEach(item => {
      if (item.tipo === 'PAGAR') {
        totalPagar += item.valor_original;
        totalPagarPendente += item.saldo_pendente;
        totalPagarQuitado += item.valor_pago;
      } else if (item.tipo === 'RECEBER') {
        totalReceber += item.valor_original;
        totalReceberPendente += item.saldo_pendente;
        totalReceberQuitado += item.valor_pago;
      }
    });

    return {
      pagar: {
        total: this.arredondar(totalPagar),
        pendente: this.arredondar(totalPagarPendente),
        quitado: this.arredondar(totalPagarQuitado)
      },
      receber: {
        total: this.arredondar(totalReceber),
        pendente: this.arredondar(totalReceberPendente),
        quitado: this.arredondar(totalReceberQuitado)
      },
      saldoLiquidoPendente: this.arredondar(totalReceberPendente - totalPagarPendente)
    };
  }
}

module.exports = new FinanceiroService();
