const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { maskObject } = require('../services/maskingService');

// GET /api/employees - Lista todos os empregados
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM employees';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY id ASC';

    const employees = db.prepare(query).all(...params);
    res.json(maskObject(employees, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/:id - Detalhes do empregado com histórico contratual e licenças
router.get('/:id', (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!emp) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    const changes = db.prepare('SELECT * FROM contract_changes WHERE employee_id = ? ORDER BY data_alteracao DESC').all(emp.id);
    const leaves = db.prepare('SELECT * FROM leaves WHERE employee_id = ? ORDER BY data_inicio DESC').all(emp.id);

    const fullData = {
      ...emp,
      alteracoesContratuais: changes,
      afastamentos: leaves
    };

    res.json(maskObject(fullData, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees - Cadastra novo empregado (RF-051)
router.post('/', (req, res) => {
  try {
    const { nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes } = req.body;

    if (!nome || !cpf || !cargo || salario_base === undefined || !jornada || !data_admissao) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Verifica unicidade de CPF
    const existing = db.prepare('SELECT id FROM employees WHERE cpf = ?').get(cpf);
    if (existing) {
      return res.status(409).json({ error: 'Já existe um empregado cadastrado com este CPF.' });
    }

    const stmt = db.prepare(`
      INSERT INTO employees (nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nome.trim(),
      cpf.trim(),
      cargo.trim(),
      Number(salario_base),
      jornada.trim(),
      data_admissao,
      status || 'ativo',
      Number(dependentes) || 0
    );

    // Registra alteração contratual inicial
    db.prepare(`
      INSERT INTO contract_changes (employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
      VALUES (?, 'Contrato Inicial', 'Admissão formal do empregado no quadro da empresa', NULL, ?, NULL, ?, ?)
    `).run(result.lastInsertRowid, Number(salario_base), cargo.trim(), data_admissao);

    // Log de auditoria (RF-056)
    db.prepare(`
      INSERT INTO payroll_approval_logs (competencia, usuario, perfil, acao, detalhes)
      VALUES ('GERAL', 'Douglas (RH)', 'RH/Admin', 'Cadastro de Empregado', ?)
    `).run(`Empregado criado: ${nome} (Cargo: ${cargo}, Salário: R$ ${salario_base})`);

    const created = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(maskObject(created, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/employees/:id - Atualiza dados cadastrais
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    const { nome, cpf, cargo, salario_base, jornada, data_admissao, status, dependentes } = req.body;

    // Detectar alterações contratuais relevantes (RF-053)
    const novoSalario = Number(salario_base);
    const novoCargo = cargo.trim();
    if (novoSalario !== current.salario_base || novoCargo !== current.cargo || jornada !== current.jornada) {
      let tipo = 'Alteração Cadastral';
      let desc = 'Atualização contratual';
      if (novoSalario > current.salario_base) {
        tipo = 'Reajuste Salarial';
        desc = `Aumento salarial de R$ ${current.salario_base} para R$ ${novoSalario}`;
      } else if (novoCargo !== current.cargo) {
        tipo = 'Mudança de Cargo / Promoção';
        desc = `Mudança de cargo de "${current.cargo}" para "${novoCargo}"`;
      }

      db.prepare(`
        INSERT INTO contract_changes (employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now', 'localtime'))
      `).run(id, tipo, desc, current.salario_base, novoSalario, current.cargo, novoCargo);
    }

    db.prepare(`
      UPDATE employees
      SET nome = ?, cpf = ?, cargo = ?, salario_base = ?, jornada = ?,
          data_admissao = ?, status = ?, dependentes = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(
      nome ? nome.trim() : current.nome,
      cpf ? cpf.trim() : current.cpf,
      cargo ? cargo.trim() : current.cargo,
      salario_base !== undefined ? Number(salario_base) : current.salario_base,
      jornada ? jornada.trim() : current.jornada,
      data_admissao || current.data_admissao,
      status || current.status,
      dependentes !== undefined ? Number(dependentes) : current.dependentes,
      id
    );

    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json(maskObject(updated, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/employees/:id - Inativa ou remove empregado
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    // Inativação lógica para preservação de histórico contábil (RB-007)
    db.prepare(`UPDATE employees SET status = 'inativo', updated_at = datetime('now', 'localtime') WHERE id = ?`).run(id);

    db.prepare(`
      INSERT INTO payroll_approval_logs (competencia, usuario, perfil, acao, detalhes)
      VALUES ('GERAL', 'Douglas (RH)', 'RH/Admin', 'Inativação de Empregado', ?)
    `).run(`Empregado ID ${id} (${current.nome}) marcado como inativo`);

    res.json({ message: 'Empregado inativado com sucesso.', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees/:id/contract-changes - Registra alteração contratual manual (RF-053)
router.post('/:id/contract-changes', (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao } = req.body;

    const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    const result = db.prepare(`
      INSERT INTO contract_changes (employee_id, tipo_alteracao, descricao, salario_anterior, novo_salario, cargo_anterior, novo_cargo, data_alteracao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      tipo_alteracao || 'Alteração Contratual',
      descricao || 'Registro formal de alteração',
      salario_anterior !== undefined ? Number(salario_anterior) : current.salario_base,
      novo_salario !== undefined ? Number(novo_salario) : current.salario_base,
      cargo_anterior || current.cargo,
      novo_cargo || current.cargo,
      data_alteracao || new Date().toISOString().split('T')[0]
    );

    // Se houver novo salário ou novo cargo, atualiza o cadastro principal
    if (novo_salario !== undefined || novo_cargo) {
      db.prepare(`
        UPDATE employees
        SET salario_base = COALESCE(?, salario_base),
            cargo = COALESCE(?, cargo),
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(novo_salario !== undefined ? Number(novo_salario) : null, novo_cargo || null, id);
    }

    const created = db.prepare('SELECT * FROM contract_changes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(maskObject(created, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/employees/:id/leaves - Registra afastamento/licença (RF-053)
router.post('/:id/leaves', (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, data_inicio, data_fim, motivo } = req.body;

    const current = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    if (!tipo || !data_inicio) {
      return res.status(400).json({ error: 'Tipo e data de início do afastamento são obrigatórios.' });
    }

    const result = db.prepare(`
      INSERT INTO leaves (employee_id, tipo, data_inicio, data_fim, motivo)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, tipo, data_inicio, data_fim || null, motivo || null);

    // Atualiza status do empregado se o afastamento estiver ativo
    db.prepare(`
      UPDATE employees
      SET status = 'afastado', updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(id);

    const created = db.prepare('SELECT * FROM leaves WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
