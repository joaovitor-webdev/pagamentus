import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.18: Comparação de opções de tributação IRPF (RF-037)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-comp-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
  });

  /**
   * CA-1: Comparação Completa vs Simplificada com estimativas e premissas
   */
  it('CA-1: deve comparar Completa vs Simplificada e recomendar a opção mais vantajosa com premissas', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/comparar-tributacao`)
      .send({
        exercicio: 2026,
        rendimentosTributaveis: 100000,
        deducoesLegais: 25000,
        irRetido: 10000,
        percentualDescontoSimplificado: 20,
        tetoDescontoSimplificado: 16754.34,
        aliquotaEfetivaEstimada: 15,
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.opcaoRecomendada).toBe('COMPLETA');
    expect(res.body.dados.opcoes).toHaveLength(2);
    expect(res.body.dados.premissas.length).toBeGreaterThan(0);
  });

  /**
   * CA-2: Aplicação do teto do desconto simplificado
   */
  it('CA-2: deve limitar o desconto simplificado ao teto parametrizado', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/comparar-tributacao`)
      .send({
        exercicio: 2026,
        rendimentosTributaveis: 200000,
        deducoesLegais: 5000,
        irRetido: 20000,
        percentualDescontoSimplificado: 20,
        tetoDescontoSimplificado: 16754.34,
        aliquotaEfetivaEstimada: 20,
      });

    expect(res.status).toBe(200);
    const simplificada = res.body.dados.opcoes.find(
      (o: any) => o.modalidade === 'SIMPLIFICADA'
    );
    expect(simplificada.deducaoAplicada).toBe(16754.34);
    expect(res.body.dados.opcaoRecomendada).toBe('SIMPLIFICADA');
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar valores negativos ou exercício inválido (400)', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/comparar-tributacao`)
      .send({
        exercicio: 1995,
        rendimentosTributaveis: -100,
        deducoesLegais: 0,
        irRetido: 0,
        percentualDescontoSimplificado: 20,
        tetoDescontoSimplificado: 16000,
        aliquotaEfetivaEstimada: 15,
      });
    expect(res.status).toBe(400);
  });
});
