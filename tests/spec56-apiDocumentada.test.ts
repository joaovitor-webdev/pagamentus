import request from 'supertest';
import { criarApp } from '../src/app';
import { ApiDocumentadaService } from '../src/services/ApiDocumentadaService';

describe('SPEC-5.6 - API documentada (RF-077)', () => {
  it('deve disponibilizar contrato OpenAPI 3.0.3 com endpoints, autenticação, versionamento e política de rate limiting', async () => {
    const { app } = criarApp();

    const res = await request(app)
      .get('/api/docs/openapi.json')
      .set('x-cliente-integracao', 'parceiro-teste-1');

    expect(res.status).toBe(200);
    expect(res.headers['x-ratelimit-limit']).toBeDefined();
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.version).toBe('1.0.0');
    expect(res.body.components.securitySchemes.BearerAuth).toBeDefined();
    expect(res.body['x-rate-limit-policy'].statusExcedido).toBe(429);
    expect(res.body.paths['/indicadores']).toBeDefined();
    expect(res.body.paths['/relatorios/exportar']).toBeDefined();
  });

  it('deve servir página HTML de documentação em GET /api/docs', async () => {
    const { app } = criarApp();

    const res = await request(app).get('/api/docs');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Pagamentus API');
    expect(res.text).toContain('/api/docs/openapi.json');
  });

  it('deve aplicar rate limiting e retornar HTTP 429 quando o limite for excedido', () => {
    const service = new ApiDocumentadaService(2, 60);

    expect(service.verificarRateLimit('cliente-limite').permitido).toBe(true);
    expect(service.verificarRateLimit('cliente-limite').permitido).toBe(true);
    const terceiro = service.verificarRateLimit('cliente-limite');
    expect(terceiro.permitido).toBe(false);
    expect(terceiro.restante).toBe(0);
  });

  it('deve registrar logs sanitizados sem expor tokens e restringir consulta por perfil', async () => {
    const { app } = criarApp();

    await request(app)
      .get('/api/docs/openapi.json')
      .set('Authorization', 'Bearer segredo-super-confidencial')
      .set('x-cliente-integracao', 'parceiro-log');

    const negado = await request(app)
      .get('/api/docs/logs')
      .set('x-perfil-usuario', 'CLIENTE');
    expect(negado.status).toBe(403);

    const autorizado = await request(app)
      .get('/api/docs/logs')
      .set('x-perfil-usuario', 'AUDITOR');
    expect(autorizado.status).toBe(200);
    expect(autorizado.body.total).toBeGreaterThanOrEqual(1);
    const ultimoLog = autorizado.body.logs[autorizado.body.logs.length - 1];
    expect(ultimoLog.detalhesSanitizados.authorization).toBe('[REDACTED]');
    expect(JSON.stringify(autorizado.body)).not.toContain(
      'segredo-super-confidencial'
    );
  });
});
