import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.8 - Observabilidade e monitoramento (RNF-014, RNF-005)', () => {
  it('deve fornecer endpoint público de healthcheck para monitoramento e deploy Vercel', async () => {
    const { app } = criarApp();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.versao).toBe('1.0.0');
    expect(res.body.timestamp).toBeDefined();
  });

  it('deve expor métricas operacionais e meta de disponibilidade acordada com SLA (RNF-005)', async () => {
    const { app } = criarApp();

    const res = await request(app)
      .get('/api/observabilidade/metricas')
      .set('x-perfil-usuario', 'ADMINISTRADOR');

    expect(res.status).toBe(200);
    expect(res.body.metaDisponibilidadePercentual).toBe(99.5);
    expect(res.body.statusGeral).toBe('SAUDAVEL');
    expect(res.body.filas).toBeDefined();
    expect(res.body.integracoes).toBeDefined();
  });

  it('deve permitir emissão de alertas e registrar traces de erro com sanitização de dados sensíveis (RNF-014)', async () => {
    const { app, observabilidadeMonitoramentoService } = criarApp();

    // Registra trace de erro com dados sensíveis
    observabilidadeMonitoramentoService.registrarErroComTrace({
      componente: 'INTEGRACAO_BANCARIA',
      erroMensagem: 'Falha de comunicação',
      codigoErro: 'TIMEOUT_504',
      contexto: {
        token: 'token-secreto-banco',
        cpf: '123.456.789-00',
        tentativas: 3,
      },
    });

    const resTraces = await request(app)
      .get('/api/observabilidade/traces-erros')
      .set('x-perfil-usuario', 'OPERADOR');

    expect(resTraces.status).toBe(200);
    expect(resTraces.body.total).toBeGreaterThanOrEqual(1);
    const trace = resTraces.body.traces[resTraces.body.traces.length - 1];
    expect(trace.contextoSanitizado.token).toBe('[REDACTED]');
    expect(trace.contextoSanitizado.cpf).toBe('[REDACTED]');
    expect(trace.contextoSanitizado.tentativas).toBe(3);

    const resAlertas = await request(app)
      .get('/api/observabilidade/alertas')
      .set('x-perfil-usuario', 'OPERADOR');

    expect(resAlertas.status).toBe(200);
    expect(resAlertas.body.total).toBeGreaterThanOrEqual(1);
  });

  it('deve bloquear acesso a métricas para perfil não autorizado (HTTP 403)', async () => {
    const { app } = criarApp();

    const res = await request(app)
      .get('/api/observabilidade/metricas')
      .set('x-perfil-usuario', 'CLIENTE');

    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('ACESSO_NEGADO');
  });
});
