jest.mock('../src/db/database', () => jest.requireActual('../src/db/database.ts'));
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

describe('SPEC-4.4 – recibos, relatórios e integração da folha', () => {
  let organizationId: number;
  let employeeId: number;
  const competencia = '2026-11';

  beforeAll(async () => {
    await initDatabase();

    const migrationPath = path.resolve(
      process.cwd(),
      'src/db/migrations/004_spec_4_4_payroll_accounting_entries.sql'
    );
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('SET search_path TO pagamentus, public');
      await client.query(migrationSql);
      await client.query(migrationSql);
    } finally {
      client.release();
    }
  });

  beforeEach(async () => {
    organizationId = 1800000000 + Math.floor(Math.random() * 100000000);
    const employee = await query<{ id: number }>(
      `INSERT INTO employees (
        organization_id, nome, cpf, cargo, salario_base, jornada, data_admissao
      )
      VALUES ($1, 'Empregado SPEC-4.4', $2, 'Analista', 4000, '40h semanais', '2024-01-01')
      RETURNING id`,
      [organizationId, `spec44-${organizationId}`]
    );
    employeeId = employee.rows[0].id;
  });

  afterEach(async () => {
    await query('DELETE FROM payroll_runs WHERE organization_id = $1', [organizationId]);
    await query('DELETE FROM employees WHERE organization_id = $1', [organizationId]);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('gera recibo e relatório e associa os totais contábeis ao processamento persistido', async () => {
    const calculation = await request(app)
      .post('/api/payroll/calculate')
      .set('x-organization-id', String(organizationId))
      .send({ competencia, persist: true });

    expect(calculation.status).toBe(200);
    expect(calculation.body.lancamento_contabil).toMatchObject({
      competencia,
      payroll_run_id: calculation.body.runId,
      status: 'integrado_a_folha',
      total_proventos: calculation.body.total_proventos,
      total_descontos: calculation.body.total_descontos,
      total_liquido: calculation.body.total_liquido,
      total_encargos: calculation.body.total_encargos,
      total_provisoes: calculation.body.total_provisoes
    });

    const persistedEntry = await query(
      `SELECT dados_lancamento
       FROM payroll_accounting_entries
       WHERE organization_id = $1 AND payroll_run_id = $2`,
      [organizationId, calculation.body.runId]
    );
    expect(persistedEntry.rows).toHaveLength(1);
    expect(persistedEntry.rows[0].dados_lancamento.total_liquido).toBe(calculation.body.total_liquido);

    const preview = await request(app)
      .get(`/api/payroll/preview/${competencia}`)
      .set('x-organization-id', String(organizationId));
    expect(preview.status).toBe(200);
    expect(preview.body.lancamento_contabil.id).toBe(calculation.body.lancamento_contabil.id);
    expect(preview.body.total_encargos).toBe(calculation.body.total_encargos);
    expect(preview.body.total_provisoes).toBe(calculation.body.total_provisoes);

    const receipt = await request(app)
      .get(`/api/payroll/receipt/${competencia}/${employeeId}`)
      .set('x-organization-id', String(organizationId));
    expect(receipt.status).toBe(200);
    expect(receipt.body.competencia).toBe(competencia);
    expect(receipt.body.totais.salarioLiquido).toBe(calculation.body.itens[0].salario_liquido);
  });

  it('identifica o preparo oficial como simulado e não transmitido', async () => {
    const response = await request(app)
      .get(`/api/esocial/preview/${competencia}`)
      .set('x-organization-id', String(organizationId));

    expect(response.status).toBe(200);
    expect(response.body.cabecalho.versaoLeiaute).toContain('Simulado');
    expect(response.body.eventos.S1200).toHaveLength(1);
    expect(response.body.avisoLegal).toMatch(/NÃO CONSTITUI TRANSMISSÃO DIRETA/);
  });
});
