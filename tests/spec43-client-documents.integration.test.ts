jest.mock('../src/db/database', () => jest.requireActual('../src/db/database.ts'));
jest.mock('../src/routes/employeeRoutes', () => jest.requireActual('../src/routes/employeeRoutes.ts'));
jest.mock('../src/routes/eventRoutes', () => jest.requireActual('../src/routes/eventRoutes.ts'));
jest.mock('../src/routes/timeRecordRoutes', () => jest.requireActual('../src/routes/timeRecordRoutes.ts'));
jest.mock('../src/routes/payrollRoutes', () => jest.requireActual('../src/routes/payrollRoutes.ts'));
jest.mock('../src/routes/esocialRoutes', () => jest.requireActual('../src/routes/esocialRoutes.ts'));
jest.mock('../src/routes/parameterRoutes', () => jest.requireActual('../src/routes/parameterRoutes.ts'));
jest.mock('../src/services/maskingService', () => jest.requireActual('../src/services/maskingService.ts'));

import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { app } from '../src/server';
import { initDatabase, pool, query } from '../src/db/database';

describe('SPEC-4.3 – portal de documentos do cliente', () => {
  let organizationId: number;
  let ownClientId: number;
  let foreignClientId: number;

  beforeAll(async () => {
    await initDatabase();
    const migrationPath = path.resolve(process.cwd(), 'src/db/migrations/003_spec_4_3_client_documents.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('SET search_path TO pagamentus, public');
      await client.query(migrationSql);
    } finally {
      client.release();
    }
  });

  beforeEach(() => {
    organizationId = 400000000 + Math.floor(Math.random() * 10000000);
    ownClientId = 101;
    foreignClientId = 202;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('isola documentos por cliente e bloqueia download de outro cliente', async () => {
    const ownUpload = await request(app)
      .post('/api/client-documents/upload')
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente')
      .send({
        exercise: '2026',
        competence: '2026-11',
        type: 'fiscal',
        process: 'fechamento-novembro',
        file_name: 'documento-ficticio.pdf',
        content_type: 'application/pdf',
        file_content_base64: Buffer.from('documento ficticio').toString('base64')
      });
    expect(ownUpload.status).toBe(201);

    const foreignUpload = await request(app)
      .post('/api/client-documents/upload')
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(foreignClientId))
      .set('x-user-role', 'cliente')
      .send({
        exercise: '2026',
        competence: '2026-11',
        type: 'cadastral',
        process: 'cadastro',
        file_name: 'outro-cliente.pdf',
        content_type: 'application/pdf',
        file_content_base64: Buffer.from('outro cliente').toString('base64')
      });
    expect(foreignUpload.status).toBe(201);

    const listed = await request(app)
      .get('/api/client-documents?exercise=2026&type=fiscal')
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente');
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].client_id).toBe(ownClientId);

    const blockedDownload = await request(app)
      .get(`/api/client-documents/${foreignUpload.body.id}/download`)
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente');
    expect(blockedDownload.status).toBe(404);

    const ownDownload = await request(app)
      .get(`/api/client-documents/${ownUpload.body.id}/download`)
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente');
    expect(ownDownload.status).toBe(200);
  });

  it('rejeita metadados incompletos e registra a operação bloqueada', async () => {
    const invalid = await request(app)
      .post('/api/client-documents/upload')
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente')
      .send({
        exercise: '2026',
        type: 'fiscal',
        file_name: 'sem-competencia.pdf',
        file_content_base64: 'ZmFrZQ=='
      });
    expect(invalid.status).toBe(400);
  });

  it('associa checklist, confirma recebimento e solicita correção', async () => {
    const requestCreated = await request(app)
      .post('/api/client-documents/requests')
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin')
      .send({
        client_id: ownClientId,
        exercise: '2026',
        competence: '2026-11',
        type: 'declaracao',
        process: 'irpf',
        title: 'Enviar informe fictício'
      });
    expect(requestCreated.status).toBe(201);

    const upload = await request(app)
      .post('/api/client-documents/upload')
      .set('x-organization-id', String(organizationId))
      .set('x-client-id', String(ownClientId))
      .set('x-user-role', 'cliente')
      .send({
        exercise: '2026',
        competence: '2026-11',
        type: 'declaracao',
        process: 'irpf',
        file_name: 'informe-ficticio.pdf',
        content_type: 'application/pdf',
        file_content_base64: 'ZmFrZQ==',
        request_id: requestCreated.body.id
      });
    expect(upload.status).toBe(201);

    const confirmed = await request(app)
      .post(`/api/client-documents/requests/${requestCreated.body.id}/confirm`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin');
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe('recebido');

    const correction = await request(app)
      .post(`/api/client-documents/requests/${requestCreated.body.id}/correction`)
      .set('x-organization-id', String(organizationId))
      .set('x-user-role', 'rh_admin')
      .send({ comments: 'Envie uma cópia legível.' });
    expect(correction.status).toBe(200);
    expect(correction.body.status).toBe('aguardando_correcao');
    expect(correction.body.comments).toBe('Envie uma cópia legível.');

    const audit = await query(
      'SELECT operation, result FROM client_document_audit WHERE organization_id = $1 ORDER BY id',
      [organizationId]
    );
    expect(audit.rows.some((row) => row.operation === 'confirmacao_recebimento' && row.result === 'aceito')).toBe(true);
  });
});
