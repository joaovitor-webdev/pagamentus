import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-4.8: Alertas de vencimento e atraso (RF-063, RB-009)', () => {
  let app: any;
  const empresaId = 'empresa-ficticia-alerta-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.alertaVencimentoService.limpar();
  });

  /**
   * CA-1 e CA-2: Alertas de vencimento/atraso com registro de entrega e aviso RB-009
   */
  it('CA-1 e CA-2: deve emitir alertas de vencimento e atraso com registro de entrega e aviso RB-009', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/alertas/processar`)
      .send({
        dataReferencia: '2026-06-15',
        diasAntecedencia: 5,
        canais: ['EMAIL', 'SISTEMA'],
        obrigacoes: [
          {
            titulo: 'DCTFWeb',
            responsavel: 'Ana',
            prazo: '2026-06-18', // vence em 3 dias -> VENCIMENTO_PROXIMO
          },
          {
            titulo: 'FGTS Digital',
            responsavel: 'Bruno',
            prazo: '2026-06-10', // atrasado -> ATRASO
          },
          {
            titulo: 'ECF',
            responsavel: 'Carla',
            prazo: '2026-07-31', // fora da janela
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.dados).toHaveLength(4); // 2 obrigações x 2 canais
    expect(res.body.dados[0].statusEntrega).toBe('ENTREGUE');
    expect(res.body.dados[0].avisoResponsabilidade).toContain('RB-009');
  });

  /**
   * CA-3: Validações e consulta de histórico
   */
  it('CA-3: deve recusar canal inválido (400) e listar histórico de alertas', async () => {
    const resInv = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/alertas/processar`)
      .send({
        dataReferencia: '2026-06-15',
        diasAntecedencia: 3,
        canais: ['SMS_INVALIDO'],
        obrigacoes: [],
      });
    expect(resInv.status).toBe(400);

    const resHist = await request(app).get(
      `/api/empresas/${empresaId}/obrigacoes/alertas`
    );
    expect(resHist.status).toBe(200);
    expect(Array.isArray(resHist.body.dados)).toBe(true);
  });
});
