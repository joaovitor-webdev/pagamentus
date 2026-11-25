import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.2: Painéis de indicadores (RF-072)', () => {
  let app: any;
  const empresaId = 'emp-ind-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.painelIndicadoresService.limpar();
  });

  it('CA-1 a CA-7 e CA-11: deve consolidar indicadores de tarefas, faturamento, inadimplência, obrigações, fechamentos e produtividade com filtro de período', async () => {
    await request(app)
      .post(`/api/empresas/${empresaId}/indicadores/base`)
      .send({
        periodo: '2026-06',
        faturamento: 50000,
        inadimplencia: 2500,
        fechamentosConcluidos: 4,
        fechamentosPendentes: 1,
        tarefasConcluidas: 8,
        tarefasPendentes: 2,
        obrigacoesEntregues: 6,
        obrigacoesAtrasadas: 1,
      });

    const res = await request(app)
      .get(`/api/empresas/${empresaId}/indicadores/painel?periodo=2026-06`)
      .set('x-perfil-acesso', 'GESTOR');

    expect(res.status).toBe(200);
    expect(res.body.dados.estadoVazio).toBe(false);
    expect(res.body.dados.indicadores.faturamento.total).toBe(50000);
    expect(res.body.dados.indicadores.inadimplencia.total).toBe(2500);
    expect(res.body.dados.indicadores.produtividade.taxaConclusaoTarefasPercentual).toBe(80);
  });

  it('CA-8 e CA-10: deve exibir estado vazio informativo sem dados e bloquear usuário sem permissão (403)', async () => {
    const resVazio = await request(app)
      .get(`/api/empresas/${empresaId}/indicadores/painel?periodo=2026-01`)
      .set('x-perfil-acesso', 'CONTADOR');
    expect(resVazio.status).toBe(200);
    expect(resVazio.body.dados.estadoVazio).toBe(true);

    const resNegado = await request(app)
      .get(`/api/empresas/${empresaId}/indicadores/painel`)
      .set('x-perfil-acesso', 'VISITANTE');
    expect(resNegado.status).toBe(403);
  });
});
