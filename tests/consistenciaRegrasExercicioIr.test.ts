import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.17: Consistência e regras do exercício IRPF (RF-036, RF-041)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-cons-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.consistenciaIrService.limpar();
  });

  /**
   * CA-1: Recusa exercício sem regra parametrizada (RF-041)
   */
  it('CA-1: deve recusar conferência para exercício sem parâmetros cadastrados (404)', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/consistencia`)
      .send({
        exercicio: 2029,
        totalRendimentosTributaveis: 50000,
        totalRendimentosIsentos: 0,
        totalIrRetido: 1000,
        despesaEducacaoDeclarada: 1000,
        quantidadePessoasEducacao: 1,
        totalBensAnterior: 10000,
        totalBensAtual: 15000,
        totalDividasAnterior: 0,
        totalDividasAtual: 0,
      });
    expect(res.status).toBe(404);
  });

  /**
   * CA-2: Detecção de inconsistências entre rendimentos, IR, patrimônio, educação e dependentes
   */
  it('CA-2: deve apontar todas as inconsistências detectadas na declaração', async () => {
    await request(app).post('/api/ir/regras-exercicio').send({
      exercicio: 2026,
      limiteDeducaoEducacaoPorPessoa: 3561.5,
      deducaoPorDependente: 2275.08,
      versaoOrientacao: 'DEMO-2026.1',
    });

    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/consistencia`)
      .send({
        exercicio: 2026,
        totalRendimentosTributaveis: 10000,
        totalRendimentosIsentos: 0,
        totalIrRetido: 12000,
        despesaEducacaoDeclarada: 5000,
        quantidadePessoasEducacao: 1,
        totalBensAnterior: 10000,
        totalBensAtual: 80000,
        totalDividasAnterior: 0,
        totalDividasAtual: 0,
        dependentesSemDocumento: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.dados.consistente).toBe(false);
    expect(res.body.dados.inconsistencias).toHaveLength(4);
  });

  /**
   * CA-3: Declaração consistente dentro dos parâmetros do exercício
   */
  it('CA-3: deve retornar consistente=true quando não houver divergências', async () => {
    await request(app).post('/api/ir/regras-exercicio').send({
      exercicio: 2026,
      limiteDeducaoEducacaoPorPessoa: 3561.5,
      deducaoPorDependente: 2275.08,
      versaoOrientacao: 'DEMO-2026.1',
    });

    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/consistencia`)
      .send({
        exercicio: 2026,
        totalRendimentosTributaveis: 80000,
        totalRendimentosIsentos: 10000,
        totalIrRetido: 6000,
        despesaEducacaoDeclarada: 3000,
        quantidadePessoasEducacao: 1,
        totalBensAnterior: 50000,
        totalBensAtual: 90000,
        totalDividasAnterior: 0,
        totalDividasAtual: 0,
        dependentesSemDocumento: 0,
      });

    expect(res.status).toBe(200);
    expect(res.body.dados.consistente).toBe(true);
    expect(res.body.dados.inconsistencias).toHaveLength(0);
  });
});
