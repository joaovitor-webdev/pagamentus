import { Router, Request, Response } from 'express';
import { query } from '../db/database';
import { maskObject } from '../services/maskingService';
import { isNonNegativeNumber, isPositiveInteger, isValidCompetence } from '../services/rf053Validation';
import { Employee } from '../types';

const router = Router();

// GET /api/events - Lista eventos variáveis
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { competencia, employee_id } = req.query;

    let sql = `
      SELECT v.*, e.nome as employee_nome, e.cargo as employee_cargo
      FROM variable_events v
      JOIN employees e ON v.employee_id = e.id AND v.organization_id = e.organization_id
      WHERE v.organization_id = $1
    `;
    const params: any[] = [orgId];

    if (competencia) {
      params.push(competencia);
      sql += ` AND v.competencia = $${params.length}`;
    }
    if (employee_id) {
      params.push(employee_id);
      sql += ` AND v.employee_id = $${params.length}`;
    }

    sql += ' ORDER BY v.id DESC';

    const result = await query(sql, params);
    res.json(maskObject(result.rows, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Registra novo evento variável
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const {
      employee_id,
      competencia,
      tipo,
      descricao,
      quantidade = 0,
      percentual = 0,
      valor
    } = req.body;
    const amount = Number(valor);
    const quantity = Number(quantidade);
    const percentage = Number(percentual);

    if (valor === undefined || valor === null || valor === ''
      || !isPositiveInteger(Number(employee_id))
      || !isValidCompetence(competencia)
      || typeof tipo !== 'string'
      || !tipo.trim()
      || tipo.trim().length > 50
      || !Number.isFinite(amount)
      || !isNonNegativeNumber(amount)
      || amount > 9999999999.99
      || !Number.isFinite(quantity)
      || !isNonNegativeNumber(quantity)
      || quantity > 9999.99
      || !Number.isFinite(percentage)
      || !isNonNegativeNumber(percentage)
      || percentage > 9999.99) {
      res.status(400).json({ error: 'Empregado, competência e valores válidos são obrigatórios.' });
      return;
    }

    const empRes = await query<Employee>(
      'SELECT id, nome, salario_base, jornada FROM employees WHERE organization_id = $1 AND id = $2',
      [orgId, Number(employee_id)]
    );

    if (empRes.rows.length === 0) {
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const emp = empRes.rows[0];
    let calculatedValue = amount;

    if (calculatedValue === 0 && quantity > 0) {
      const divisor = emp.jornada.includes('40h') ? 200 : 220;
      const valorHora = parseFloat(String(emp.salario_base)) / divisor;

      if (tipo === 'hora_extra') {
        const fator = 1 + ((percentage || 50) / 100);
        calculatedValue = Number((valorHora * fator * quantity).toFixed(2));
      } else if (tipo === 'falta') {
        const valorDia = parseFloat(String(emp.salario_base)) / 30;
        calculatedValue = Number((valorDia * quantity).toFixed(2));
      }
    }

    const insertRes = await query(`
      INSERT INTO variable_events (organization_id, employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      orgId,
      Number(employee_id),
      competencia,
      tipo.trim(),
      descricao ? String(descricao).trim() : `${tipo} - ${quantity || ''}`,
      quantity,
      percentage,
      calculatedValue
    ]);

    const created = insertRes.rows[0];
    created.employee_nome = emp.nome;

    res.status(201).json(maskObject(created, req.isRhAdmin));
  } catch (error: any) {
    if (error.code === '23503') {
      res.status(404).json({ error: 'Empregado não encontrado nesta organização.' });
      return;
    }
    if (error.code === '23514') {
      res.status(400).json({ error: 'O evento viola uma regra de validação.' });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Remove evento variável
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { id } = req.params;

    const findRes = await query('SELECT * FROM variable_events WHERE organization_id = $1 AND id = $2', [orgId, id]);
    if (findRes.rows.length === 0) {
      res.status(404).json({ error: 'Evento não encontrado.' });
      return;
    }

    await query('DELETE FROM variable_events WHERE organization_id = $1 AND id = $2', [orgId, id]);
    res.json({ message: 'Evento excluído com sucesso.', id: Number(id) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/leaves - Lista todos os afastamentos
router.get('/leaves', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const result = await query(`
      SELECT l.*, e.nome as employee_nome, e.cargo as employee_cargo
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id AND l.organization_id = e.organization_id
      WHERE l.organization_id = $1
      ORDER BY l.data_inicio DESC
    `, [orgId]);
    res.json(maskObject(result.rows, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/contract-changes - Lista histórico de alterações contratuais
router.get('/contract-changes', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const result = await query(`
      SELECT cc.*, e.nome as employee_nome
      FROM contract_changes cc
      JOIN employees e ON cc.employee_id = e.id AND cc.organization_id = e.organization_id
      WHERE cc.organization_id = $1
      ORDER BY cc.data_alteracao DESC
    `, [orgId]);
    res.json(maskObject(result.rows, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
