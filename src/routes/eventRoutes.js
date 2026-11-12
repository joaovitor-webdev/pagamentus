const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { maskObject } = require('../services/maskingService');

// GET /api/events - Lista eventos variáveis (opcionalmente filtrado por competência ou employee_id)
router.get('/', (req, res) => {
  try {
    const { competencia, employee_id } = req.query;
    let query = `
      SELECT v.*, e.nome as employee_nome, e.cargo as employee_cargo
      FROM variable_events v
      JOIN employees e ON v.employee_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (competencia) {
      query += ' AND v.competencia = ?';
      params.push(competencia);
    }
    if (employee_id) {
      query += ' AND v.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY v.id DESC';

    const events = db.prepare(query).all(...params);
    res.json(maskObject(events, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Registra novo evento variável (horas extras, faltas, adicionais, descontos)
router.post('/', (req, res) => {
  try {
    const { employee_id, competencia, tipo, descricao, quantidade, percentual, valor } = req.body;

    if (!employee_id || !competencia || !tipo || valor === undefined) {
      return res.status(400).json({ error: 'Empregado, competência, tipo e valor são obrigatórios.' });
    }

    const emp = db.prepare('SELECT id, nome, salario_base, jornada FROM employees WHERE id = ?').get(employee_id);
    if (!emp) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    let calculatedValue = Number(valor);

    // Se o usuário informou quantidade de horas ou faltas e deixou valor 0, calcula automaticamente
    if (calculatedValue === 0 && quantidade > 0) {
      const divisor = emp.jornada.includes('40h') ? 200 : 220;
      const valorHora = emp.salario_base / divisor;

      if (tipo === 'hora_extra') {
        const fator = 1 + ((Number(percentual) || 50) / 100);
        calculatedValue = Number((valorHora * fator * Number(quantidade)).toFixed(2));
      } else if (tipo === 'falta') {
        const valorDia = emp.salario_base / 30;
        calculatedValue = Number((valorDia * Number(quantidade)).toFixed(2));
      }
    }

    const result = db.prepare(`
      INSERT INTO variable_events (employee_id, competencia, tipo, descricao, quantidade, percentual, valor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      employee_id,
      competencia.trim(),
      tipo.trim(),
      descricao ? descricao.trim() : `${tipo} - ${quantidade || ''}`,
      Number(quantidade) || 0,
      Number(percentual) || 0,
      calculatedValue
    );

    const created = db.prepare(`
      SELECT v.*, e.nome as employee_nome
      FROM variable_events v
      JOIN employees e ON v.employee_id = e.id
      WHERE v.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(maskObject(created, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/events/:id - Remove evento variável
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = db.prepare('SELECT * FROM variable_events WHERE id = ?').get(id);
    if (!item) {
      return res.status(404).json({ error: 'Evento não encontrado.' });
    }

    db.prepare('DELETE FROM variable_events WHERE id = ?').run(id);
    res.json({ message: 'Evento excluído com sucesso.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/leaves - Lista todos os afastamentos
router.get('/leaves', (req, res) => {
  try {
    const leaves = db.prepare(`
      SELECT l.*, e.nome as employee_nome, e.cargo as employee_cargo
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      ORDER BY l.data_inicio DESC
    `).all();
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/contract-changes - Lista histórico de alterações contratuais
router.get('/contract-changes', (req, res) => {
  try {
    const changes = db.prepare(`
      SELECT cc.*, e.nome as employee_nome
      FROM contract_changes cc
      JOIN employees e ON cc.employee_id = e.id
      ORDER BY cc.data_alteracao DESC
    `).all();
    res.json(maskObject(changes, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
