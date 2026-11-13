const db = require('../../database/db');
const planoContasService = require('./planoContasService');
const { randomUUID } = require('crypto');

class LancamentosService {
  /**
   * Arredonda valor para 2 casas decimais evitando problemas de ponto flutuante
   */
  arredondar(valor) {
    return Math.round((Number(valor) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Cria um lançamento contábil baseado no método das partidas dobradas.
   * Regra Fundamental RB-001: Soma dos débitos DEVE ser igual à soma dos créditos.
   */
  async criarLancamento(organizationId, dados) {
    const { data_lancamento, competencia, historico, partidas } = dados;

    if (!data_lancamento || !historico) {
      throw new Error("Data do lançamento e histórico são obrigatórios.");
    }

    if (!Array.isArray(partidas) || partidas.length < 2) {
      throw new Error("O lançamento contábil deve conter ao menos duas partidas (uma a débito e uma a crédito).");
    }

    let totalDebitos = 0;
    let totalCreditos = 0;
    const partidasValidadas = [];

    let temDebito = false;
    let temCredito = false;

    // Valida cada partida individualmente
    for (let i = 0; i < partidas.length; i++) {
      const p = partidas[i];
      const tipo = (p.tipo || '').toUpperCase();
      const valor = this.arredondar(p.valor);

      if (!['DEBITO', 'CREDITO'].includes(tipo)) {
        throw new Error(`Partida #${i + 1}: tipo inválido '${p.tipo}'. Deve ser 'DEBITO' ou 'CREDITO'.`);
      }

      // CA-5: Rejeição de valores menores ou iguais a zero
      if (isNaN(valor) || valor <= 0) {
        throw new Error(`Partida #${i + 1}: o valor deve ser estritamente maior que zero.`);
      }

      if (!p.conta_id) {
        throw new Error(`Partida #${i + 1}: conta contábil é obrigatória.`);
      }

      // CA-3: Valida se a conta contábil é ANALÍTICA e ATIVA
      // Lança erro caso a conta seja sintética ou inativa
      const conta = await planoContasService.validarAptidaoLancamento(p.conta_id, organizationId);

      if (tipo === 'DEBITO') {
        totalDebitos = this.arredondar(totalDebitos + valor);
        temDebito = true;
      } else {
        totalCreditos = this.arredondar(totalCreditos + valor);
        temCredito = true;
      }

      partidasValidadas.push({
        id: p.id || `pt-${randomUUID()}`,
        conta_id: conta.id,
        tipo,
        valor,
        historico_complementar: p.historico_complementar ? p.historico_complementar.trim() : null
      });
    }

    if (!temDebito || !temCredito) {
      throw new Error("O lançamento deve ter obrigatoriamente ao menos uma partida de débito e uma de crédito.");
    }

    // REGRA FUNDAMENTAL RB-001 & CA-2:
    // A soma dos débitos deve ser rigorosamente igual à soma dos créditos.
    if (totalDebitos !== totalCreditos) {
      const diferenca = this.arredondar(Math.abs(totalDebitos - totalCreditos));
      const err = new Error(
        `Lançamento contábil desbalanceado rejeitado: a soma dos débitos (R$ ${totalDebitos.toFixed(2)}) ` +
        `difere da soma dos créditos (R$ ${totalCreditos.toFixed(2)}). ` +
        `Diferença apurada: R$ ${diferenca.toFixed(2)}. ` +
        `De acordo com a regra fundamental das partidas dobradas (RB-001), o sistema nunca aceita lançamentos desbalanceados.`
      );
      err.statusCode = 400;
      err.detalhes = {
        totalDebitos,
        totalCreditos,
        diferenca
      };
      throw err;
    }

    const lancamentoId = dados.id || `lan-${randomUUID()}`;
    const compCalculada = competencia || data_lancamento.substring(0, 7); // YYYY-MM
    const now = new Date().toISOString();

    // Executa em transação atômica (CA-1)
    return await db.transaction(async (tx) => {
      // Obter próximo número sequencial na organização
      const ultimoNum = await tx.get(
        `SELECT COALESCE(MAX(numero), 0) as max_num FROM lancamentos_contabeis WHERE organization_id = ?`,
        [organizationId]
      );
      const proximoNumero = (ultimoNum ? ultimoNum.max_num : 0) + 1;

      await tx.run(
        `INSERT INTO lancamentos_contabeis
          (id, organization_id, numero, data_lancamento, competencia, historico, valor_total, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'EFETIVADO', ?)`,
        [lancamentoId, organizationId, proximoNumero, data_lancamento, compCalculada, historico.trim(), totalDebitos, now]
      );

      for (const partida of partidasValidadas) {
        await tx.run(
          `INSERT INTO partidas_lancamento
            (id, lancamento_id, conta_id, tipo, valor, historico_complementar)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [partida.id, lancamentoId, partida.conta_id, partida.tipo, partida.valor, partida.historico_complementar]
        );
      }

      return await this.obterLancamentoPorId(lancamentoId, organizationId);
    });
  }

  /**
   * Consulta um lançamento e suas partidas
   */
  async obterLancamentoPorId(id, organizationId) {
    const lancamento = await db.get(
      `SELECT * FROM lancamentos_contabeis WHERE id = ? AND organization_id = ?`,
      [id, organizationId]
    );

    if (!lancamento) return null;

    const partidas = await db.all(
      `SELECT p.*, c.codigo as conta_codigo, c.nome as conta_nome, c.natureza as conta_natureza
       FROM partidas_lancamento p
       INNER JOIN contas_contabeis c ON c.id = p.conta_id
       WHERE p.lancamento_id = ?
       ORDER BY p.tipo DESC, p.valor DESC`,
      [id]
    );

    return {
      ...lancamento,
      partidas
    };
  }

  /**
   * Lista lançamentos contábeis com paginação, filtros e partidas associadas (CA-4)
   */
  async listarLancamentos(organizationId, filtros = {}) {
    let sql = `
      SELECT id, organization_id, numero, data_lancamento, competencia, historico, valor_total, status, created_at
      FROM lancamentos_contabeis
      WHERE organization_id = ?
    `;
    const params = [organizationId];

    if (filtros.data_inicio) {
      sql += ` AND data_lancamento >= ?`;
      params.push(filtros.data_inicio);
    }
    if (filtros.data_fim) {
      sql += ` AND data_lancamento <= ?`;
      params.push(filtros.data_fim);
    }
    if (filtros.competencia) {
      sql += ` AND competencia = ?`;
      params.push(filtros.competencia);
    }
    if (filtros.busca) {
      sql += ` AND (historico LIKE ? OR CAST(numero AS TEXT) LIKE ?)`;
      params.push(`%${filtros.busca}%`, `%${filtros.busca}%`);
    }

    sql += ` ORDER BY data_lancamento DESC, numero DESC`;

    const lancamentos = await db.all(sql, params);

    // Carrega as partidas de cada lançamento para detalhamento
    const resultado = [];
    for (const l of lancamentos) {
      const partidas = await db.all(
        `SELECT p.*, c.codigo as conta_codigo, c.nome as conta_nome
         FROM partidas_lancamento p
         INNER JOIN contas_contabeis c ON c.id = p.conta_id
         WHERE p.lancamento_id = ?
         ORDER BY p.tipo DESC`,
        [l.id]
      );
      resultado.push({ ...l, partidas });
    }

    return resultado;
  }
}

module.exports = new LancamentosService();
