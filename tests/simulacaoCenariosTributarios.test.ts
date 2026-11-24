import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.11: Simulação de cenários tributários (RF-028)', () => {
  let app: any;
  const empresaFicticiaId = 'empresa-ficticia-sim-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.simulacaoCenarioTributarioService.limpar();
  });

  /**
   * CA-1: Simulação comparativa com premissas, limitações e memória de cálculo
   */
  it('CA-1: deve simular múltiplos cenários retornando premissas, limitações, memória e cenário mais econômico', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/simulacoes`)
      .send({
        competencia: '2026-08',
        receitaBruta: 100000,
        despesasDedutiveis: 70000,
        cenarios: [
          {
            nome: 'Simples Nacional Demo',
            regime: 'SIMPLES_NACIONAL',
            tipoBase: 'RECEITA_BRUTA',
            aliquotaEfetivaPercentual: 11,
            premissas: ['Enquadramento no Anexo III'],
          },
          {
            nome: 'Lucro Real Demo',
            regime: 'LUCRO_REAL',
            tipoBase: 'LUCRO_LIQUIDO',
            aliquotaEfetivaPercentual: 24,
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.cenarios).toHaveLength(2);
    expect(res.body.dados.cenarios[0].impostoEstimado).toBe(11000);
    expect(res.body.dados.cenarios[1].impostoEstimado).toBe(7200);
    expect(res.body.dados.cenarioMaisEconomico).toBe('Lucro Real Demo');
    expect(res.body.dados.limitacoes.length).toBeGreaterThan(0);
    expect(res.body.dados.cenarios[1].memoriaCalculo).toContain('30000.00');
  });

  /**
   * CA-2: Histórico de simulações
   */
  it('CA-2: deve registrar e listar histórico de simulações da empresa', async () => {
    await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/simulacoes`)
      .send({
        competencia: '2026-08',
        receitaBruta: 50000,
        cenarios: [
          {
            nome: 'Presumido Demo',
            regime: 'LUCRO_PRESUMIDO',
            tipoBase: 'RECEITA_BRUTA',
            aliquotaEfetivaPercentual: 13.33,
          },
        ],
      });

    const resHist = await request(app).get(
      `/api/empresas/${empresaFicticiaId}/fiscal/simulacoes`
    );
    expect(resHist.status).toBe(200);
    expect(resHist.body.dados).toHaveLength(1);
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar receita inválida ou lista de cenários vazia', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/simulacoes`)
      .send({
        competencia: '2026-08',
        receitaBruta: 0,
        cenarios: [],
      });

    expect(res.status).toBe(400);
  });
});
