const express = require('express');
const router = express.Router();
const db = require('../db/database');
const {
  calculateMonthlyPayroll,
  calculateVacation,
  calculate13Salary,
  approvePayroll
} = require('../services/payrollService');
const { maskObject } = require('../services/maskingService');

// POST /api/payroll/calculate - Executa ou simula o cálculo da folha (RF-052)
router.post('/calculate', (req, res) => {
  try {
    const { competencia, persist, usuario } = req.body;
    if (!competencia) {
      return res.status(400).json({ error: 'Competência (YYYY-MM) é obrigatória.' });
    }

    const shouldPersist = persist === true || persist === 'true';
    const result = calculateMonthlyPayroll(competencia, shouldPersist, usuario || 'Douglas (RH)');

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/preview/:competencia - Prévia da folha e provisões (RF-052 & RF-055)
router.get('/preview/:competencia', (req, res) => {
  try {
    const { competencia } = req.params;
    const run = db.prepare('SELECT * FROM payroll_runs WHERE competencia = ? AND tipo = ?').get(competencia, 'mensal');

    if (!run) {
      // Se ainda não foi salva no banco, simula em memória
      const simulated = calculateMonthlyPayroll(competencia, false);
      return res.json(maskObject(simulated, req.isRhAdmin));
    }

    const items = db.prepare(`
      SELECT pi.*, e.nome, e.cpf, e.cargo, e.jornada, e.dependentes
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      WHERE pi.payroll_run_id = ?
      ORDER BY e.id ASC
    `).all(run.id);

    const fullResult = {
      runId: run.id,
      competencia: run.competencia,
      tipo: run.tipo,
      status: run.status,
      total_colaboradores: items.length,
      total_proventos: run.total_proventos,
      total_descontos: run.total_descontos,
      total_liquido: run.total_liquido,
      total_encargos: run.total_encargos,
      total_provisoes: run.total_provisoes,
      custo_total_empresa: Number((run.total_proventos + run.total_encargos + run.total_provisoes).toFixed(2)),
      itens: items
    };

    res.json(maskObject(fullResult, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/vacation - Simulação de cálculo de Férias (RF-052)
router.get('/vacation', (req, res) => {
  try {
    const { employee_id, dias } = req.query;
    if (!employee_id) {
      return res.status(400).json({ error: 'ID do empregado é obrigatório.' });
    }

    const diasGozo = dias ? parseInt(dias, 10) : 30;
    const result = calculateVacation(employee_id, diasGozo);

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/13th - Simulação de cálculo de 13º Salário (RF-052)
router.get('/13th', (req, res) => {
  try {
    const { employee_id, parcela, meses } = req.query;
    if (!employee_id) {
      return res.status(400).json({ error: 'ID do empregado é obrigatório.' });
    }

    const parcelaNum = parcela === '2' ? '2' : '1';
    const mesesTrabalhados = meses ? parseInt(meses, 10) : 12;
    const result = calculate13Salary(employee_id, parcelaNum, mesesTrabalhados);

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/receipt/:competencia/:employeeId - Holerite individual formatado (RF-055)
router.get('/receipt/:competencia/:employeeId', (req, res) => {
  try {
    const { competencia, employeeId } = req.params;

    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!emp) {
      return res.status(404).json({ error: 'Empregado não encontrado.' });
    }

    // Busca folha calculada ou gera simulação precisa
    const run = db.prepare('SELECT id, status FROM payroll_runs WHERE competencia = ? AND tipo = ?').get(competencia, 'mensal');
    let item;

    if (run) {
      item = db.prepare('SELECT * FROM payroll_items WHERE payroll_run_id = ? AND employee_id = ?').get(run.id, emp.id);
    }

    if (!item) {
      // Simula caso não esteja persistido
      const sim = calculateMonthlyPayroll(competencia, false);
      item = sim.itens.find(i => i.employee_id === emp.id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Dados da folha não encontrados para este empregado.' });
    }

    let parsedDetalhes = {};
    try {
      parsedDetalhes = typeof item.detalhes_json === 'string' ? JSON.parse(item.detalhes_json) : item.detalhes_json;
    } catch (e) {
      parsedDetalhes = {};
    }

    const holerite = {
      empresa: {
        razaoSocial: 'Audicon Contabilidade & Gestão Empresarial Ltda',
        cnpj: '00.123.456/0001-78',
        endereco: 'Av. Agamenon Magalhães, 1200 - Recife/PE'
      },
      colaborador: {
        id: emp.id,
        nome: emp.nome,
        cpf: emp.cpf,
        cargo: emp.cargo,
        dataAdmissao: emp.data_admissao,
        jornada: emp.jornada,
        dependentes: emp.dependentes
      },
      competencia,
      dataEmissao: new Date().toLocaleDateString('pt-BR'),
      proventos: parsedDetalhes.proventos || [
        { codigo: '001', descricao: 'Salário Base', referencia: '30d', valor: item.salario_base }
      ],
      descontos: parsedDetalhes.descontos || [],
      totais: {
        totalProventos: item.total_proventos,
        totalDescontos: item.total_descontos,
        salarioLiquido: item.salario_liquido
      },
      bases: {
        salarioBase: item.salario_base,
        baseInss: item.base_inss,
        baseFgts: item.base_fgts,
        valorFgts: item.valor_fgts,
        baseIrrf: parsedDetalhes.irrfDetalhes ? parsedDetalhes.irrfDetalhes.baseCalculo : item.base_inss
      },
      provisoes: parsedDetalhes.provisoes || null,
      statusFolha: run ? run.status : 'rascunho'
    };

    res.json(maskObject(holerite, req.isRhAdmin));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payroll/approve - Aprovação formal da folha (RF-056 & RB-003)
router.post('/approve', (req, res) => {
  try {
    // Validação estrita de Perfil (RF-056): apenas perfil RH/Admin pode aprovar
    if (!req.isRhAdmin) {
      return res.status(403).json({
        error: 'Acesso Negado: Apenas usuários autorizados com perfil RH/Admin podem aprovar ou fechar a folha (RF-056).'
      });
    }

    const { competencia, status, justificativa, usuario } = req.body;
    if (!competencia) {
      return res.status(400).json({ error: 'Competência é obrigatória.' });
    }

    const novoStatus = status || 'aprovada'; // 'aprovada' ou 'fechada'
    const user = usuario || 'Douglas (Gestor de RH)';

    const result = approvePayroll(competencia, novoStatus, user, justificativa);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/audit-logs - Trilha de aprovação e auditoria (RF-056 & RNF-004)
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM payroll_approval_logs ORDER BY id DESC LIMIT 50').all();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
