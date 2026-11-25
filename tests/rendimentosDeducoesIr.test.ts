import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.14: Rendimentos e deduções IRPF (RF-031, RF-033)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.rendimentoDeducaoIrService.limpar();
  });

  /**
   * CA-1: Coleta de rendimentos por categoria
   */
  it('CA-1: deve registrar rendimentos em diferentes categorias e consolidar totais', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/rendimentos`)
      .send({
        categoria: 'TRIBUTAVEL',
        fontePagadora: 'Empresa Demo SA',
        descricao: 'Salários 2026',
        valor: 60000,
        irRetido: 4500,
      });

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/rendimentos`)
      .send({
        categoria: 'ISENTO_NAO_TRIBUTAVEL',
        fontePagadora: 'Banco Demo',
        descricao: 'Rendimentos poupança',
        valor: 1200,
      });

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/rendimentos`)
      .send({
        categoria: 'EXTERIOR',
        fontePagadora: 'Cliente Exterior LLC',
        descricao: 'Serviços no exterior',
        valor: 8000,
      });

    const res = await request(app).get(
      `/api/ir/fichas/${fichaId}/rendimentos-deducoes`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados.totaisRendimentosPorCategoria.TRIBUTAVEL).toBe(60000);
    expect(
      res.body.dados.totaisRendimentosPorCategoria.ISENTO_NAO_TRIBUTAVEL
    ).toBe(1200);
    expect(res.body.dados.totaisRendimentosPorCategoria.EXTERIOR).toBe(8000);
    expect(res.body.dados.totalIrRetido).toBe(4500);
  });

  /**
   * CA-2: Registro de pagamentos e despesas dedutíveis
   */
  it('CA-2: deve registrar despesas dedutíveis e consolidar o total dedutível', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/deducoes`)
      .send({
        categoria: 'MEDICA',
        beneficiario: 'Clinica Demo',
        descricao: 'Consultas médicas',
        valor: 2500,
      });

    await request(app)
      .post(`/api/ir/fichas/${fichaId}/deducoes`)
      .send({
        categoria: 'EDUCACAO',
        beneficiario: 'Faculdade Demo',
        descricao: 'Mensalidades graduação',
        valor: 3500,
      });

    const res = await request(app).get(
      `/api/ir/fichas/${fichaId}/rendimentos-deducoes`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados.deducoes).toHaveLength(2);
    expect(res.body.dados.totalDeducoesAplicaveis).toBe(6000);
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar categoria inválida ou valor <= 0', async () => {
    const resRend = await request(app)
      .post(`/api/ir/fichas/${fichaId}/rendimentos`)
      .send({
        categoria: 'INVALIDA',
        fontePagadora: 'X',
        descricao: 'Y',
        valor: 100,
      });
    expect(resRend.status).toBe(400);

    const resDed = await request(app)
      .post(`/api/ir/fichas/${fichaId}/deducoes`)
      .send({
        categoria: 'MEDICA',
        beneficiario: 'Clinica',
        descricao: 'Consulta',
        valor: 0,
      });
    expect(resDed.status).toBe(400);
  });
});
