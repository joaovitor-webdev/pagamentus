import { Router, Request, Response } from 'express';
import { query } from '../db/database';
import {
  calculateMonthlyPayroll,
  calculateVacation,
  calculate13Salary,
  approvePayroll,
  registerDeniedPayrollApproval
} from '../services/payrollService';
import { maskObject } from '../services/maskingService';
import { Employee } from '../types';

const router = Router();

// POST /api/payroll/calculate - Executa cálculo de folha
router.post('/calculate', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { competencia, persist, usuario } = req.body;
    if (!competencia) {
      res.status(400).json({ error: 'Competência (YYYY-MM) é obrigatória.' });
      return;
    }

    const shouldPersist = persist === true || persist === 'true';
    const result = await calculateMonthlyPayroll(competencia, shouldPersist, usuario || 'Douglas (RH)', orgId);

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/preview/:competencia - Prévia da folha e provisões
router.get('/preview/:competencia', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const competencia = String(req.params.competencia);

    const runRes = await query(
      'SELECT * FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = $3',
      [orgId, competencia, 'mensal']
    );

    if (runRes.rows.length === 0) {
      const simulated = await calculateMonthlyPayroll(competencia, false, 'Simulação', orgId);
      res.json(maskObject(simulated, req.isRhAdmin));
      return;
    }

    const run = runRes.rows[0];

    const itemsRes = await query(`
      SELECT pi.*, e.nome, e.cpf, e.cargo, e.jornada, e.dependentes
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      WHERE pi.organization_id = $1 AND pi.payroll_run_id = $2
      ORDER BY e.id ASC
    `, [orgId, run.id]);

    const accountingEntryRes = await query(
      `SELECT id, dados_lancamento
       FROM payroll_accounting_entries
       WHERE organization_id = $1 AND payroll_run_id = $2`,
      [orgId, run.id]
    );
    const accountingEntry = accountingEntryRes.rows[0];

    const fullResult = {
      runId: run.id,
      competencia: run.competencia,
      tipo: run.tipo,
      status: run.status,
      total_colaboradores: itemsRes.rows.length,
      total_proventos: parseFloat(run.total_proventos),
      total_descontos: parseFloat(run.total_descontos),
      total_liquido: parseFloat(run.total_liquido),
      total_encargos: parseFloat(run.total_encargos),
      total_provisoes: parseFloat(run.total_provisoes),
      custo_total_empresa: Number((parseFloat(run.total_proventos) + parseFloat(run.total_encargos) + parseFloat(run.total_provisoes)).toFixed(2)),
      lancamento_contabil: accountingEntry
        ? {
            ...accountingEntry.dados_lancamento,
            id: accountingEntry.id,
            payroll_run_id: run.id,
            status: 'integrado_a_folha'
          }
        : null,
      itens: itemsRes.rows.map(it => ({
        ...it,
        salario_base: parseFloat(it.salario_base),
        total_proventos: parseFloat(it.total_proventos),
        total_descontos: parseFloat(it.total_descontos),
        salario_liquido: parseFloat(it.salario_liquido),
        desconto_inss: parseFloat(it.desconto_inss),
        desconto_irrf: parseFloat(it.desconto_irrf),
        valor_fgts: parseFloat(it.valor_fgts)
      }))
    };

    res.json(maskObject(fullResult, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/vacation - Simulação de cálculo de Férias
router.get('/vacation', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { employee_id, dias } = req.query;
    if (!employee_id) {
      res.status(400).json({ error: 'ID do empregado é obrigatório.' });
      return;
    }

    const diasGozo = dias ? parseInt(dias as string, 10) : 30;
    const result = await calculateVacation(Number(employee_id), diasGozo, orgId);

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/13th - Simulação de cálculo de 13º Salário
router.get('/13th', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const { employee_id, parcela, meses } = req.query;
    if (!employee_id) {
      res.status(400).json({ error: 'ID do empregado é obrigatório.' });
      return;
    }

    const parcelaNum = parcela === '2' ? '2' : '1';
    const mesesTrabalhados = meses ? parseInt(meses as string, 10) : 12;
    const result = await calculate13Salary(Number(employee_id), parcelaNum, mesesTrabalhados, orgId);

    res.json(maskObject(result, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/receipt/:competencia/:employeeId - Holerite individual formatado
router.get('/receipt/:competencia/:employeeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = req.organizationId || 1;
    const competencia = String(req.params.competencia);
    const employeeId = String(req.params.employeeId);

    const empRes = await query<Employee>(
      'SELECT * FROM employees WHERE organization_id = $1 AND id = $2',
      [orgId, employeeId]
    );

    if (empRes.rows.length === 0) {
      res.status(404).json({ error: 'Empregado não encontrado.' });
      return;
    }

    const emp = empRes.rows[0];

    const runRes = await query(
      'SELECT id, status FROM payroll_runs WHERE organization_id = $1 AND competencia = $2 AND tipo = $3',
      [orgId, competencia, 'mensal']
    );

    let item: any;
    if (runRes.rows.length > 0) {
      const itemRes = await query(
        'SELECT * FROM payroll_items WHERE organization_id = $1 AND payroll_run_id = $2 AND employee_id = $3',
        [orgId, runRes.rows[0].id, emp.id]
      );
      if (itemRes.rows.length > 0) item = itemRes.rows[0];
    }

    if (!item) {
      const sim = await calculateMonthlyPayroll(competencia, false, 'Simulação', orgId);
      item = sim.itens.find((i: any) => i.employee_id === emp.id);
    }

    if (!item) {
      res.status(404).json({ error: 'Dados da folha não encontrados para este empregado.' });
      return;
    }

    let parsedDetalhes = typeof item.detalhes_json === 'string'
      ? JSON.parse(item.detalhes_json)
      : item.detalhes_json || {};

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
        { codigo: '001', descricao: 'Salário Base', referencia: '30d', valor: parseFloat(item.salario_base) }
      ],
      descontos: parsedDetalhes.descontos || [],
      totais: {
        totalProventos: parseFloat(item.total_proventos),
        totalDescontos: parseFloat(item.total_descontos),
        salarioLiquido: parseFloat(item.salario_liquido)
      },
      bases: {
        salarioBase: parseFloat(item.salario_base),
        baseInss: parseFloat(item.base_inss),
        baseFgts: parseFloat(item.base_fgts),
        valorFgts: parseFloat(item.valor_fgts),
        baseIrrf: parsedDetalhes.irrfDetalhes ? parsedDetalhes.irrfDetalhes.baseCalculo : parseFloat(item.base_inss)
      },
      provisoes: parsedDetalhes.provisoes || null,
      statusFolha: runRes.rows.length > 0 ? runRes.rows[0].status : 'rascunho'
    };

    res.json(maskObject(holerite, req.isRhAdmin));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payroll/approve - Aprovação formal da folha (RF-056)
router.post('/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { competencia, status, justificativa, usuario } = req.body;
    if (typeof competencia !== 'string' || !competencia) {
      res.status(400).json({ error: 'Competência é obrigatória.' });
      return;
    }

    if (!req.isRhAdmin) {
      await registerDeniedPayrollApproval(
        competencia,
        usuario || req.userRole || 'não identificado',
        req.userRole || 'não autorizado',
        req.organizationId || 1
      );
      res.status(403).json({
        error: 'Acesso Negado: Apenas usuários autorizados com perfil RH/Admin podem aprovar ou fechar a folha (RF-056).'
      });
      return;
    }

    const orgId = req.organizationId || 1;
    const novoStatus = status || 'aprovada';
    const user = usuario || 'Douglas (Gestor de RH)';

    const result = await approvePayroll(competencia, novoStatus, user, justificativa, orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payroll/audit-logs - Trilha de aprovação e auditoria
router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.isRhAdmin) {
      res.status(403).json({ error: 'Acesso negado à trilha de auditoria.' });
      return;
    }

    const orgId = req.organizationId || 1;
    const result = await query(
      'SELECT * FROM payroll_approval_logs WHERE organization_id = $1 ORDER BY id DESC LIMIT 50',
      [orgId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
