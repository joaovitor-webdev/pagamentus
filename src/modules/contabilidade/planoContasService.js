const db = require('../../database/db');
const { randomUUID } = require('crypto');

class PlanoContasService {
  /**
   * Lista todas as contas ordenadas hierarquicamente por código
   */
  async listarContas(organizationId, filtros = {}) {
    let sql = `
      SELECT id, organization_id, codigo, nome, natureza, tipo, nivel, conta_pai_id, status, created_at, updated_at
      FROM contas_contabeis
      WHERE organization_id = ?
    `;
    const params = [organizationId];

    if (filtros.natureza) {
      sql += ` AND natureza = ?`;
      params.push(filtros.natureza);
    }
    if (filtros.tipo) {
      sql += ` AND tipo = ?`;
      params.push(filtros.tipo);
    }
    if (filtros.status) {
      sql += ` AND status = ?`;
      params.push(filtros.status);
    }
    if (filtros.busca) {
      sql += ` AND (codigo LIKE ? OR nome LIKE ?)`;
      params.push(`%${filtros.busca}%`, `%${filtros.busca}%`);
    }

    sql += ` ORDER BY codigo ASC`;

    return await db.all(sql, params);
  }

  /**
   * Retorna a estrutura do plano de contas organizada em árvore hierárquica
   */
  async obterArvoreContas(organizationId) {
    const contas = await this.listarContas(organizationId);
    const mapa = {};
    const raiz = [];

    contas.forEach(c => {
      mapa[c.id] = { ...c, filhas: [] };
    });

    contas.forEach(c => {
      if (c.conta_pai_id && mapa[c.conta_pai_id]) {
        mapa[c.conta_pai_id].filhas.push(mapa[c.id]);
      } else {
        raiz.push(mapa[c.id]);
      }
    });

    return raiz;
  }

  /**
   * Obtém detalhes de uma conta específica
   */
  async obterContaPorId(id, organizationId) {
    return await db.get(
      `SELECT * FROM contas_contabeis WHERE id = ? AND organization_id = ?`,
      [id, organizationId]
    );
  }

  /**
   * Obtém conta por código na organização
   */
  async obterContaPorCodigo(codigo, organizationId) {
    return await db.get(
      `SELECT * FROM contas_contabeis WHERE codigo = ? AND organization_id = ?`,
      [codigo, organizationId]
    );
  }

  /**
   * Cadastra uma nova conta contábil com validação estrita
   */
  async criarConta(organizationId, dados) {
    const { codigo, nome, natureza, tipo, conta_pai_id } = dados;

    if (!codigo || !nome || !natureza || !tipo) {
      throw new Error("Campos obrigatórios ausentes: código, nome, natureza e tipo são necessários.");
    }

    const naturezasValidas = ['ATIVO', 'PASSIVO', 'PATRIMONIO_LIQUIDO', 'RECEITA', 'DESPESA'];
    if (!naturezasValidas.includes(natureza.toUpperCase())) {
      throw new Error(`Natureza inválida: deve ser uma de ${naturezasValidas.join(', ')}.`);
    }

    const tipoNormalizado = tipo.toUpperCase();
    if (!['SINTETICA', 'ANALITICA'].includes(tipoNormalizado)) {
      throw new Error("Tipo de conta inválido: deve ser 'SINTETICA' ou 'ANALITICA'.");
    }

    // CA-6: Unicidade do código por organização
    const contaExistente = await this.obterContaPorCodigo(codigo.trim(), organizationId);
    if (contaExistente) {
      const err = new Error(`Código contábil '${codigo}' já cadastrado para esta organização.`);
      err.statusCode = 409;
      throw err;
    }

    // Cálculo do nível hierárquico com base no código estruturado (ex: 1 = nível 1, 1.1 = nível 2)
    const partes = codigo.trim().split('.');
    const nivel = partes.length;

    // Se informou conta pai, valida existência e tipo sintético
    let paiId = conta_pai_id || null;
    if (paiId) {
      const contaPai = await this.obterContaPorId(paiId, organizationId);
      if (!contaPai) {
        throw new Error("Conta pai referenciada não foi encontrada nesta organização.");
      }
      if (contaPai.tipo !== 'SINTETICA') {
        throw new Error("A conta pai de uma estrutura hierárquica deve ser obrigatoriamente SINTÉTICA.");
      }
    }

    const id = dados.id || `c-${randomUUID()}`;
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO contas_contabeis
        (id, organization_id, codigo, nome, natureza, tipo, nivel, conta_pai_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ATIVA', ?, ?)`,
      [id, organizationId, codigo.trim(), nome.trim(), natureza.toUpperCase(), tipoNormalizado, nivel, paiId, now, now]
    );

    return await this.obterContaPorId(id, organizationId);
  }

  /**
   * Atualiza dados de uma conta existente
   */
  async atualizarConta(id, organizationId, dados) {
    const conta = await this.obterContaPorId(id, organizationId);
    if (!conta) {
      const err = new Error("Conta contábil não encontrada.");
      err.statusCode = 404;
      throw err;
    }

    const nome = dados.nome ? dados.nome.trim() : conta.nome;
    const natureza = dados.natureza ? dados.natureza.toUpperCase() : conta.natureza;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE contas_contabeis
       SET nome = ?, natureza = ?, updated_at = ?
       WHERE id = ? AND organization_id = ?`,
      [nome, natureza, now, id, organizationId]
    );

    return await this.obterContaPorId(id, organizationId);
  }

  /**
   * Desativa uma conta com validação de dependências filhas (CA-5)
   */
  async desativarConta(id, organizationId) {
    const conta = await this.obterContaPorId(id, organizationId);
    if (!conta) {
      const err = new Error("Conta contábil não encontrada.");
      err.statusCode = 404;
      throw err;
    }

    // CA-5: Bloquear desativação se possuir contas filhas ativas
    const filhasAtivas = await db.all(
      `SELECT id, codigo, nome FROM contas_contabeis 
       WHERE conta_pai_id = ? AND organization_id = ? AND status = 'ATIVA'`,
      [id, organizationId]
    );

    if (filhasAtivas.length > 0) {
      const err = new Error(
        `Não é possível desativar a conta sintética '${conta.codigo} - ${conta.nome}' pois ela possui ${filhasAtivas.length} conta(s) filha(s) ativa(s).`
      );
      err.statusCode = 400;
      throw err;
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE contas_contabeis SET status = 'INATIVA', updated_at = ? WHERE id = ? AND organization_id = ?`,
      [now, id, organizationId]
    );

    return await this.obterContaPorId(id, organizationId);
  }

  /**
   * Ativa uma conta
   */
  async ativarConta(id, organizationId) {
    const conta = await this.obterContaPorId(id, organizationId);
    if (!conta) {
      const err = new Error("Conta contábil não encontrada.");
      err.statusCode = 404;
      throw err;
    }

    const now = new Date().toISOString();
    await db.run(
      `UPDATE contas_contabeis SET status = 'ATIVA', updated_at = ? WHERE id = ? AND organization_id = ?`,
      [now, id, organizationId]
    );

    return await this.obterContaPorId(id, organizationId);
  }

  /**
   * Regra Central (CA-4): Valida se a conta está apta a receber lançamentos contábeis.
   * Contas sintéticas são sumariamente bloqueadas. Apenas analíticas ativas são permitidas.
   */
  async validarAptidaoLancamento(contaId, organizationId) {
    const conta = await this.obterContaPorId(contaId, organizationId);
    if (!conta) {
      throw new Error(`Conta contábil ID '${contaId}' não encontrada para esta organização.`);
    }

    if (conta.status !== 'ATIVA') {
      throw new Error(`A conta '${conta.codigo} - ${conta.nome}' está INATIVA e não pode receber lançamentos.`);
    }

    if (conta.tipo === 'SINTETICA') {
      const err = new Error(
        `Lançamentos contábeis são permitidos exclusivamente em contas analíticas. A conta '${conta.codigo} - ${conta.nome}' é SINTÉTICA e não aceita lançamentos.`
      );
      err.statusCode = 400;
      throw err;
    }

    return conta;
  }
}

module.exports = new PlanoContasService();
