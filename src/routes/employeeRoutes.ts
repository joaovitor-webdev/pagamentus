import { Router, Request, Response } from 'express';
import { PoolClient } from 'pg';
import { pool, query } from '../db/database';
import { maskObject } from '../services/maskingService';
import { isNonNegativeNumber, isPositiveInteger, isValidDate } from '../services/rf053Validation';
import { Employee } from '../types';

const router = Router();

// GET /api/employees - Lista todos os empregados
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const orgId = req.organizationId || 1;

    let sql = 'SELECT * FROM employees WHERE organization_id = $1';
    const params: any[] = [orgId];

    if (status) {
      sql += ' AND status = $2';
      params.push(status);
    }
    sql += ' ORDER BY id ASC';

    const result = await query<Employee>(sql, params);
    res.json(maskObject(result.rows, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/:id - Detalhes do empregado com histórico contratual e licenças
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const empRes = await query<Employee>(
      'SELECT * FROM employees WHERE organization_id = $1 AND id = $2',
      [orgId, req.params.id]
    );

    if (empRes.rows.length === 0) {
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const emp = empRes.rows[0];

    const changesRes = await query(
      'SELECT * FROM contract_changes WHERE organization_id = $1 AND employee_id = $2 ORDER BY data_alteracao DESC',
      [orgId, emp.id]
    );
    const leavesRes = await query(
      'SELECT * FROM leaves WHERE organization_id = $1 AND employee_id = $2 ORDER BY data_inicio DESC',
      [orgId, emp.id]
    );

    const fullData = {
      ...emp,
      alteracoesContratuais: changesRes.rows,
      afastamentos: leavesRes.rows
    };

    res.json(maskObject(fullData, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees - Cadastra novo empregado (RF-051)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const {
      nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes,
      departamento, regime_contratual
    } = req.body;

    if (!nome || !cpf || !cargo || salario_base === undefined || !jornada || !data_admissao) {
      res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      return;
    }

    // Unicidade de CPF no escopo da organização
    const existing = await query(
      'SELECT id FROM employees WHERE organization_id = $1 AND cpf = $2',
      [orgId, cpf.trim()]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Já existe um empregado cadastrado com este CPF.' });
      return;
    }

    const insertRes = await query(`
      INSERT INTO employees (organization_id, nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes, departamento, regime_contratual)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      orgId,
      nome.trim(),
      cpf.trim(),
      cargo.trim(),
      Number(salario_base),
      jornada.trim(),
      data_admissao,
      status || 'ativo',
      Number(dependentes) || 0,
      departamento ? departamento.trim() : 'Geral',
      regime_contratual ? regime_contratual.trim() : 'CLT'
    ]);

    const created = insertRes.rows[0];

    await query(`
      INSERT INTO contract_changes (organization_id, employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
      VALUES ($1, $2, 'Contrato Inicial', 'Admissão formal do empregado no quadro da empresa', NULL, $3, NULL, $4, $5)
    `, [orgId, created.id, Number(salario_base), cargo.trim(), data_admissao]);

    await query(`
      INSERT INTO payroll_approval_logs (organization_id, competencia, usuario, perfil, acao, detalhes)
      VALUES ($1, 'GERAL', 'Douglas (RH)', 'RH/Admin', 'Cadastro de Empregado', $2)
    `, [orgId, `Empregado criado: ${nome} (Cargo: ${cargo}, Salário: R$ ${salario_base})`]);

    res.status(201).json(maskObject(created, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/employees/:id - Atualiza dados cadastrais
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { id } = req.params;

    const currentRes = await query<Employee>(
      'SELECT * FROM employees WHERE organization_id = $1 AND id = $2',
      [orgId, id]
    );

    if (currentRes.rows.length === 0) {
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const current = currentRes.rows[0];
    const {
      nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes,
      departamento, regime_contratual
    } = req.body;

    const novoSalario = Number(salario_base);
    const novoCargo = cargo ? cargo.trim() : current.cargo;

    if (novoSalario !== parseFloat(String(current.salario_base)) || novoCargo !== current.cargo || (jornada && jornada !== current.jornada)) {
      let tipo = 'Alteração Cadastral';
      let desc = 'Atualização contratual';
      if (novoSalario > parseFloat(String(current.salario_base))) {
        tipo = 'Reajuste Salarial';
        desc = `Aumento salarial de R$ ${current.salario_base} para R$ ${novoSalario}`;
      } else if (novoCargo !== current.cargo) {
        tipo = 'Mudança de Cargo / Promoção';
        desc = `Mudança de cargo de "${current.cargo}" para "${novoCargo}"`;
      }

      await query(`
        INSERT INTO contract_changes (organization_id, employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE)
      `, [orgId, id, tipo, desc, current.salario_base, novoSalario, current.cargo, novoCargo]);
    }

    const updateRes = await query(`
      UPDATE employees
      SET nome = COALESCE($1, nome),
          cpf = COALESCE($2, cpf),
          cargo = COALESCE($3, cargo),
          salario_base = COALESCE($4, salario_base),
          jornada = COALESCE($5, jornada),
          data_admissao = COALESCE($6, data_admissao),
          status = COALESCE($7, status),
          dependentes = COALESCE($8, dependentes),
          departamento = COALESCE($9, departamento),
          regime_contratual = COALESCE($10, regime_contratual),
          updated_at = CURRENT_TIMESTAMP
      WHERE organization_id = $11 AND id = $12
      RETURNING *
    `, [
      nome ? nome.trim() : null,
      cpf ? cpf.trim() : null,
      cargo ? cargo.trim() : null,
      salario_base !== undefined ? Number(salario_base) : null,
      jornada ? jornada.trim() : null,
      data_admissao || null,
      status || null,
      dependentes !== undefined ? Number(dependentes) : null,
      departamento ? departamento.trim() : null,
      regime_contratual ? regime_contratual.trim() : null,
      orgId,
      id
    ]);

    res.json(maskObject(updateRes.rows[0], req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/employees/:id - Inativa empregado (lógico / RB-007)
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { id } = req.params;

    const currentRes = await query<Employee>(
      'SELECT * FROM employees WHERE organization_id = $1 AND id = $2',
      [orgId, id]
    );

    if (currentRes.rows.length === 0) {
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    await query(
      `UPDATE employees SET status = 'inativo', updated_at = CURRENT_TIMESTAMP WHERE organization_id = $1 AND id = $2`,
      [orgId, id]
    );

    await query(`
      INSERT INTO payroll_approval_logs (organization_id, competencia, usuario, perfil, acao, detalhes)
      VALUES ($1, 'GERAL', 'Douglas (RH)', 'RH/Admin', 'Inativação de Empregado', $2)
    `, [orgId, `Empregado ID ${id} (${currentRes.rows[0].nome}) marcado como inativo`]);

    res.json({ message: 'Empregado inativado com sucesso.', id: Number(id) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const benefitTypes = new Set([
  'vale_transporte',
  'vale_refeicao',
  'vale_alimentacao',
  'plano_saude'
]);

router.get('/:id/benefits', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const employeeId = Number(req.params.id);
  if (!isPositiveInteger(employeeId)) {
    res.status(400).json({ error: 'Empregado inválido.' });
    return;
  }

  try {
    const employee = await query(
      'SELECT id FROM employees WHERE organization_id = $1 AND id = $2',
      [organizationId, employeeId]
    );
    if (employee.rowCount === 0) {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }

    const result = await query(
      `SELECT * FROM benefits
       WHERE organization_id = $1 AND employee_id = $2
       ORDER BY data_inicio DESC, id DESC`,
      [organizationId, employeeId]
    );
    res.json(maskObject(result.rows, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/benefits', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const employeeId = Number(req.params.id);
  const { tipo, descricao, valor, desconto_empregado = 0, data_inicio, data_fim } = req.body;
  const endDate = data_fim || null;

  if (!isPositiveInteger(employeeId)) {
    res.status(400).json({ error: 'Empregado inválido.' });
    return;
  }
  if (typeof tipo !== 'string' || !benefitTypes.has(tipo)) {
    res.status(400).json({ error: 'Tipo de benefício inválido.' });
    return;
  }
  if (!isNonNegativeNumber(valor)
    || !isNonNegativeNumber(desconto_empregado)
    || desconto_empregado > valor) {
    res.status(400).json({ error: 'Valores do benefício ou desconto inválidos.' });
    return;
  }
  if (!isValidDate(data_inicio) || (endDate !== null && !isValidDate(endDate)) || (endDate && endDate < data_inicio)) {
    res.status(400).json({ error: 'Informe um período de vigência válido.' });
    return;
  }
  if (descricao !== undefined && (typeof descricao !== 'string' || descricao.length > 255)) {
    res.status(400).json({ error: 'A descrição deve ter no máximo 255 caracteres.' });
    return;
  }

  try {
    const employee = await query(
      'SELECT id FROM employees WHERE organization_id = $1 AND id = $2',
      [organizationId, employeeId]
    );
    if (employee.rowCount === 0) {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }

    const result = await query(
      `INSERT INTO benefits (
        organization_id, employee_id, tipo, descricao, valor, desconto_empregado, data_inicio, data_fim
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        organizationId,
        employeeId,
        tipo,
        descricao?.trim() || null,
        valor,
        desconto_empregado,
        data_inicio,
        endDate
      ]
    );
    res.status(201).json(maskObject(result.rows[0], req.isRhAdmin));
  } catch (error: any) {
    if (error.code === '23503') {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }
    if (error.code === '23514' || error.code === '22003') {
      res.status(400).json({ error: 'O benefício viola uma regra de validação.' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/employees/:id/benefits/:benefitId - Desativa/remove benefício do colaborador
router.delete('/:id/benefits/:benefitId', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const employeeId = Number(req.params.id);
  const benefitId = Number(req.params.benefitId);

  try {
    const benRes = await query(
      'SELECT id FROM benefits WHERE organization_id = $1 AND employee_id = $2 AND id = $3',
      [organizationId, employeeId, benefitId]
    );

    if (benRes.rows.length === 0) {
      res.status(404).json({ error: 'Benefício não encontrado para este colaborador.' });
      return;
    }

    await query(
      'UPDATE benefits SET ativo = FALSE, updated_at = CURRENT_TIMESTAMP WHERE organization_id = $1 AND employee_id = $2 AND id = $3',
      [organizationId, employeeId, benefitId]
    );

    res.json({ success: true, message: 'Benefício desativado com sucesso.', id: benefitId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees/:id/contract-changes - Registra alteração contratual manual
router.post('/:id/contract-changes', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const employeeId = Number(req.params.id);
  const {
    tipo_alteracao,
    descricao,
    motivo,
    novo_salario,
    novo_cargo,
    nova_jornada,
    novo_departamento,
    novo_regime,
    data_alteracao
  } = req.body;

  if (!isPositiveInteger(employeeId)) {
    res.status(400).json({ error: 'Empregado inválido.' });
    return;
  }

  const contractFields = [
    novo_salario,
    novo_cargo,
    nova_jornada,
    novo_departamento,
    novo_regime
  ];
  if (contractFields.every((value) => value === undefined)) {
    res.status(400).json({ error: 'Informe ao menos um campo contratual para alterar.' });
    return;
  }
  if (novo_salario !== undefined && !isNonNegativeNumber(novo_salario)) {
    res.status(400).json({ error: 'O novo salário deve ser um valor não negativo.' });
    return;
  }
  const contractTextLimits = [150, 50, 150, 100];
  if (contractFields.slice(1).some((value, index) => value !== undefined
    && (typeof value !== 'string' || !value.trim() || value.length > contractTextLimits[index]))) {
    res.status(400).json({ error: 'Os novos dados contratuais devem ser textos válidos.' });
    return;
  }
  if (data_alteracao !== undefined && !isValidDate(data_alteracao)) {
    res.status(400).json({ error: 'A data de vigência é inválida.' });
    return;
  }
  if (tipo_alteracao !== undefined
    && (typeof tipo_alteracao !== 'string' || !tipo_alteracao.trim() || tipo_alteracao.length > 100)) {
    res.status(400).json({ error: 'O tipo de alteração é inválido.' });
    return;
  }
  if (descricao !== undefined && typeof descricao !== 'string') {
    res.status(400).json({ error: 'A descrição da alteração é inválida.' });
    return;
  }
  if (motivo !== undefined && typeof motivo !== 'string') {
    res.status(400).json({ error: 'O motivo da alteração é inválido.' });
    return;
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const currentRes = await client.query<Employee>(
      'SELECT * FROM employees WHERE organization_id = $1 AND id = $2 FOR UPDATE',
      [organizationId, employeeId]
    );
    if (currentRes.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const current = currentRes.rows[0];
    const salary = novo_salario ?? Number(current.salario_base);
    const cargo = novo_cargo ?? current.cargo;
    const jornada = nova_jornada ?? current.jornada;
    const departamento = novo_departamento ?? current.departamento;
    const regime = novo_regime ?? current.regime_contratual;
    const history = await client.query(`
      INSERT INTO contract_changes (
        organization_id, employee_id, tipo_alteracao, descricao,
        salario_anterior, novo_salario, cargo_anterior, novo_cargo,
        jornada_anterior, nova_jornada, departamento_anterior, novo_departamento,
        regime_anterior, novo_regime, data_alteracao
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      organizationId,
      employeeId,
      tipo_alteracao?.trim() || 'Alteração Contratual',
      descricao?.trim() || motivo?.trim() || 'Registro formal de alteração',
      current.salario_base,
      salary,
      current.cargo,
      cargo,
      current.jornada,
      jornada,
      current.departamento,
      departamento,
      current.regime_contratual,
      regime,
      data_alteracao || new Date().toISOString().slice(0, 10)
    ]);

    await client.query(
      `UPDATE employees
       SET salario_base = $1, cargo = $2, jornada = $3, departamento = $4, regime_contratual = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $6 AND id = $7`,
      [salary, cargo, jornada, departamento, regime, organizationId, employeeId]
    );
    await client.query('COMMIT');
    res.status(201).json(maskObject(history.rows[0], req.isRhAdmin));
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (error.code === '23503') {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }
    if (error.code === '23514' || error.code === '22003') {
      res.status(400).json({ error: 'A alteração contratual viola uma regra de validação.' });
      return;
    }
    res.status(500).json({ error: error.message });
  } finally {
    client?.release();
  }
});

// POST /api/employees/:id/leaves - Registra afastamento/licença
router.post('/:id/leaves', async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.organizationId || 1;
  const employeeId = Number(req.params.id);
  const { tipo, data_inicio, data_fim, motivo } = req.body;
  const endDate = data_fim || null;
  const validTypes = new Set([
    'Médico/Doença',
    'Licença Maternidade',
    'Licença Paternidade',
    'Acidente de Trabalho',
    'Sem Remuneração',
    'Médico',
    'Maternidade',
    'Férias',
    'Licença não remunerada',
    'medico',
    'maternidade',
    'paternidade',
    'ferias',
    'sem_vencimento',
    'acidente_trabalho',
    'outro'
  ]);

  if (!isPositiveInteger(employeeId)) {
    res.status(400).json({ error: 'Empregado inválido.' });
    return;
  }
  if (typeof tipo !== 'string' || !validTypes.has(tipo)) {
    res.status(400).json({ error: 'Tipo de afastamento ou licença inválido.' });
    return;
  }
  if (!isValidDate(data_inicio)
    || (endDate !== null && !isValidDate(endDate))
    || (endDate && endDate < data_inicio)) {
    res.status(400).json({ error: 'Informe datas coerentes para o afastamento.' });
    return;
  }
  if (typeof motivo !== 'string' || !motivo.trim()) {
    res.status(400).json({ error: 'O motivo do afastamento é obrigatório.' });
    return;
  }

  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const employee = await client.query(
      'SELECT id FROM employees WHERE organization_id = $1 AND id = $2 FOR UPDATE',
      [organizationId, employeeId]
    );
    if (employee.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const overlap = await client.query(
      `SELECT id FROM leaves
       WHERE organization_id = $1
         AND employee_id = $2
         AND daterange(data_inicio, data_fim, '[]')
             && daterange($3::date, $4::date, '[]')
       LIMIT 1`,
      [organizationId, employeeId, data_inicio, endDate]
    );
    if (overlap.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'O período informado se sobrepõe a outro afastamento deste empregado.' });
      return;
    }

    const result = await client.query(`
      INSERT INTO leaves (organization_id, employee_id, tipo, data_inicio, data_fim, motivo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [organizationId, employeeId, tipo, data_inicio, endDate, motivo.trim()]);

    await client.query(
      `UPDATE employees SET status = 'afastado', updated_at = CURRENT_TIMESTAMP WHERE organization_id = $1 AND id = $2`,
      [organizationId, employeeId]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
    }
    if (error.code === '23503') {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }
    if (error.code === '23514') {
      res.status(400).json({ error: 'O afastamento viola uma regra de validação.' });
      return;
    }
    res.status(500).json({ error: error.message });
  } finally {
    client?.release();
  }
});

export default router;
