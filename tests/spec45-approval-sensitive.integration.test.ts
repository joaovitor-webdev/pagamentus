jest.mock('../src/db/database', () => jest.requireActual('../src/db/database.ts'));
jest.mock('../src/routes/employeeRoutes', () => jest.requireActual('../src/routes/employeeRoutes.ts'));
jest.mock('../src/routes/eventRoutes', () => jest.requireActual('../src/routes/eventRoutes.ts'));
jest.mock('../src/routes/payrollRoutes', () => jest.requireActual('../src/routes/payrollRoutes.ts'));
jest.mock('../src/routes/esocialRoutes', () => jest.requireActual('../src/routes/esocialRoutes.ts'));
jest.mock('../src/services/maskingService', () => jest.requireActual('../src/services/maskingService.ts'));
jest.mock('../src/services/payrollService', () => jest.requireActual('../src/services/payrollService.ts'));
jest.mock('../src/services/esocialService', () => jest.requireActual('../src/services/esocialService.ts'));

import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../src/server';
import { initDatabase, pool, query } from '../src/db/database';

describe('SPEC-4.5 – aprovação da folha e dados sensíveis', () => {
  let organizationId: number;
  let employeeId: number;
  const competencia = '2026-11';

  beforeAll(async () => {
    await initDatabase();

    const benefitsMigrationPath = path.resolve(
      process.cwd(),
      'src/db/migrations/002_spec_4_2_rf053.sql'
    );
    const benefitsMigrationSql = fs.readFileSync(benefitsMigrationPath, 'utf8');
    const migrationPath = path.resolve(
      process.cwd(),
      'src/db/migrations/005_spec_4_5_approval_audit.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('SET search_path TO pagamentus, public');
      await client.query(benefitsMigrationSql);
      await client.query(benefitsMigrationSql);
      await client.query(migrationSql);
      await client.query(migrationSql);
    } finally {
      client.release();
    }
  });

  beforeEach(async () => {
    organizationId = 1700000000 + Math.floor(Math.random() * 100000000);
    const employee = await query<{ id: number }>(
      `INSERT INTO employees (
        organization_id, nome, cpf, cargo, salario_base, jornada, data_admissao
      )
      VALUES ($1, 'Empregado fictício SPEC-4.5', $2, 'Analista', 4000, '40h semanais', '2024-01-01')
      RETURNING id`,
      [organizationId, `spec45-${organizationId}`]
    );
    employeeId = employee.rows[0].id;
  });

  afterEach(async () => {
    await query('DELETE FROM payroll_approval_logs WHERE organization_id = $1', [organizationId]);
    await query('DELETE FROM payroll_runs WHERE organization_id = $1', [organizationId]);
    await query('DELETE FROM employees WHERE organization_id = $1', [organizationId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  async function calculatePayroll(): Promise<number> {
    const response = await request(app)
      .post('/api/payroll/calculate')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin')
      .send({ competencia, persist: true });

    expect(response.status).toBe(200);
    return response.body.runId;
  }

  it('aprova a folha e registra usuário, horário, objeto, operação e resultado', async () => {
    const runId = await calculatePayroll();

    const approval = await request(app)
      .post('/api/payroll/approve')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin')
      .send({ competencia, usuario: 'Responsável RH fictício' });

    expect(approval.status).toBe(200);
    expect(approval.body.status).toBe('aprovada');

    const run = await query(
      'SELECT status FROM payroll_runs WHERE organization_id = $1 AND id = $2',
      [organizationId, runId]
    );
    expect(run.rows[0].status).toBe('aprovada');

    const logs = await request(app)
      .get('/api/payroll/audit-logs')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin');
    expect(logs.status).toBe(200);
    expect(logs.body[0]).toMatchObject({
      payroll_run_id: runId,
      competencia,
      usuario: 'Responsável RH fictício',
      resultado: 'sucesso'
    });
    expect(logs.body[0].data_hora).toBeTruthy();
    expect(logs.body[0].acao).toContain('APROVADA');
  });

  it('nega a aprovação não autorizada, mantém o status e audita a tentativa', async () => {
    const runId = await calculatePayroll();

    const approval = await request(app)
      .post('/api/payroll/approve')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente')
      .send({ competencia, usuario: 'Assistente fictício' });

    expect(approval.status).toBe(403);

    const run = await query(
      'SELECT status FROM payroll_runs WHERE organization_id = $1 AND id = $2',
      [organizationId, runId]
    );
    expect(run.rows[0].status).toBe('rascunho');

    const logs = await request(app)
      .get('/api/payroll/audit-logs')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin');
    expect(logs.body[0]).toMatchObject({
      payroll_run_id: runId,
      usuario: 'Assistente fictício',
      resultado: 'negado',
      acao: 'Tentativa de aprovação negada'
    });

    const deniedAuditAccess = await request(app)
      .get('/api/payroll/audit-logs')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(deniedAuditAccess.status).toBe(403);
  });

  it('disponibiliza dados salariais e de saúde somente ao perfil autorizado', async () => {
    await calculatePayroll();
    await query(
      `INSERT INTO leaves (organization_id, employee_id, tipo, data_inicio, data_fim, motivo)
       VALUES ($1, $2, 'Médico/Doença', '2026-11-10', '2026-11-12', 'Informação médica fictícia')`,
      [organizationId, employeeId]
    );
    await query(
      `INSERT INTO benefits (
        organization_id, employee_id, tipo, descricao, valor, desconto_empregado, data_inicio
      )
      VALUES ($1, $2, 'plano_saude', 'Plano de saúde fictício', 500, 50, '2026-11-01')`,
      [organizationId, employeeId]
    );

    const authorized = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin');
    expect(authorized.body.salario_base).toBe('4000.00');
    expect(authorized.body.afastamentos[0].motivo).toBe('Informação médica fictícia');

    const restricted = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(restricted.body.salario_base).toBe('R$ *****,**');
    expect(restricted.body.afastamentos[0].tipo).toBe('Dados restritos');
    expect(restricted.body.afastamentos[0].motivo).toBe('Dados restritos');

    const defaultRole = await request(app)
      .get(`/api/employees/${employeeId}`)
      .set('x-organization-id', String(organizationId));
    expect(defaultRole.body.salario_base).toBe('R$ *****,**');

    const payroll = await request(app)
      .get(`/api/payroll/preview/${competencia}`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(payroll.body.itens[0].salario_base).toBe('R$ *****,**');

    const leaves = await request(app)
      .get('/api/events/leaves')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(leaves.body[0].motivo).toBe('Dados restritos');

    const benefits = await request(app)
      .get(`/api/employees/${employeeId}/benefits`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(benefits.body[0].tipo).toBe('Dados restritos');
    expect(benefits.body[0].descricao).toBe('Dados restritos');
    expect(benefits.body[0].valor).toBe('R$ *****,**');

    const esocialPreview = await request(app)
      .get(`/api/esocial/preview/${competencia}`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(esocialPreview.body.eventos.S2230[0].infoAfastamento.codMotAfast).toBe('Dados restritos');
    expect(esocialPreview.body.eventos.S2230[0].infoAfastamento.observacao).toBe('Dados restritos');

    const esocialDownload = await request(app)
      .get(`/api/esocial/download/${competencia}?format=json`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'consulta_assistente');
    expect(esocialDownload.status).toBe(403);

    const defaultRoleDownload = await request(app)
      .get(`/api/esocial/download/${competencia}?format=json`)
      .set('x-organization-id', String(organizationId));
    expect(defaultRoleDownload.status).toBe(403);
  });
});
