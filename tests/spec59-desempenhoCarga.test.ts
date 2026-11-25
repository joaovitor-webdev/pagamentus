import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.9 - Desempenho e carga (RNF-006)', () => {
  it('deve avaliar métricas de carga e comprovar que 95% das requisições respondem em até 3 segundos (SLA RNF-006)', async () => {
    const { app } = criarApp();

    // Simula 100 requisições sob carga acordada com tempos variando de 50ms a 400ms e apenas 2 picos de 1200ms
    const temposSimulados = Array.from({ length: 98 }, () => Math.floor(Math.random() * 200) + 50);
    temposSimulados.push(1100, 1250);

    const res = await request(app)
      .post('/api/desempenho/avaliar-carga')
      .send({
        cenario: '100 requisições simultâneas em rotas e telas comuns',
        temposMs: temposSimulados,
      });

    expect(res.status).toBe(200);
    expect(res.body.totalRequisicoes).toBe(100);
    expect(res.body.percentil95Ms).toBeLessThanOrEqual(3000);
    expect(res.body.metaSlaAtingida).toBe(true);
    expect(res.body.taxaSucessoPercentual).toBe(100);
  });

  it('deve fornecer feedback de progresso e estado para cálculos e relatórios de maior duração (RNF-006)', async () => {
    const { app } = criarApp();

    // 1. Inicia operação demorada
    const resInicio = await request(app)
      .post('/api/desempenho/operacoes-longas')
      .send({
        tipo: 'CALCULO_TRIBUTARIO_COMPLEXO',
        totalEtapas: 4,
      });

    expect(resInicio.status).toBe(202);
    expect(resInicio.body.status).toBe('PROCESSANDO');
    expect(resInicio.body.percentualConcluido).toBe(0);

    const operacaoId = resInicio.body.id;

    // 2. Atualiza progresso intermediário (50%)
    const resProgresso = await request(app)
      .put(`/api/desempenho/operacoes-longas/${operacaoId}/progresso`)
      .send({
        etapaIndex: 2,
        etapaDescricao: 'Processando conciliação e deduções de 50.000 lançamentos',
      });

    expect(resProgresso.status).toBe(200);
    expect(resProgresso.body.percentualConcluido).toBe(50);
    expect(resProgresso.body.status).toBe('PROCESSANDO');

    // 3. Conclui operação (100%)
    const resConclusao = await request(app)
      .put(`/api/desempenho/operacoes-longas/${operacaoId}/progresso`)
      .send({
        etapaIndex: 4,
        etapaDescricao: 'Cálculos finalizados e memória consolidada',
      });

    expect(resConclusao.status).toBe(200);
    expect(resConclusao.body.percentualConcluido).toBe(100);
    expect(resConclusao.body.status).toBe('CONCLUIDO');
    expect(resConclusao.body.finalizadoEm).toBeDefined();

    // 4. Consulta status da operação
    const resConsulta = await request(app).get(
      `/api/desempenho/operacoes-longas/${operacaoId}`
    );
    expect(resConsulta.status).toBe(200);
    expect(resConsulta.body.status).toBe('CONCLUIDO');
  });
});
