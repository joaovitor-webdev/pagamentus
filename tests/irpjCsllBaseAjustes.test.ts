import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.21: IRPJ/CSLL - Base e ajustes (RF-042, RF-043)', () => {
  let app: any;
  const empresaId = 'empresa-ficticia-irpj-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.irpjCsllBaseAjustesService.limpar();
  });

  /**
   * CA-1: Controle de adições, exclusões e base ajustada
   */
  it('CA-1: deve calcular base ajustada com adições e exclusões no Lucro Real', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/base`)
      .send({
        competencia: '2026-03',
        regime: 'LUCRO_REAL',
        lucroContabil: 100000,
        adicoes: [{ descricao: 'Despesa indedutível demo', valor: 15000 }],
        exclusoes: [{ descricao: 'Receita não tributável demo', valor: 5000 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.totalAdicoes).toBe(15000);
    expect(res.body.dados.totalExclusoes).toBe(5000);
    expect(res.body.dados.baseAntesCompensacao).toBe(110000);
    expect(res.body.dados.baseCalculoFinal).toBe(110000);
  });

  /**
   * CA-2: Compensação de prejuízo fiscal respeitando o limite parametrizado (30%)
   */
  it('CA-2: deve limitar compensação de prejuízo fiscal ao percentual parametrizado e atualizar saldo', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/base`)
      .send({
        competencia: '2026-06',
        regime: 'LUCRO_REAL',
        lucroContabil: 100000,
        saldoPrejuizoFiscalAnterior: 50000,
        limiteCompensacaoPercentual: 30,
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.prejuizoCompensado).toBe(30000);
    expect(res.body.dados.saldoPrejuizoRemanescente).toBe(20000);
    expect(res.body.dados.baseCalculoFinal).toBe(70000);
  });

  /**
   * CA-3: Validações e histórico
   */
  it('CA-3: deve recusar regime inválido (400) e listar histórico da empresa', async () => {
    const resInv = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/base`)
      .send({
        competencia: '2026-06',
        regime: 'SIMPLES_NACIONAL',
        lucroContabil: 10000,
      });
    expect(resInv.status).toBe(400);

    await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/base`)
      .send({
        competencia: '2026-06',
        regime: 'LUCRO_PRESUMIDO',
        lucroContabil: 20000,
      });

    const resHist = await request(app).get(
      `/api/empresas/${empresaId}/irpj-csll/base`
    );
    expect(resHist.status).toBe(200);
    expect(resHist.body.dados).toHaveLength(1);
  });
});
