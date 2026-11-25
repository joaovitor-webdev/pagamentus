import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-4.7: Tarefas e painel de obrigações (RF-062, RF-065)', () => {
  let app: any;
  const empresaId = 'empresa-ficticia-obr-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.tarefaObrigacaoService.limpar();
  });

  /**
   * CA-1: Criação de tarefa com responsável, prazo, prioridade, status, checklist e anexos
   */
  it('CA-1: deve criar tarefa completa com checklist e anexos', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'Fechamento DCTFWeb 05/2026',
        responsavel: 'Analista Fiscal Demo',
        prazo: '2026-06-15',
        prioridade: 'ALTA',
        status: 'EM_PREPARACAO',
        checklist: [
          { descricao: 'Conferir folha', concluido: true },
          { descricao: 'Validar retenções', concluido: false },
        ],
        anexos: ['resumo-folha.pdf'],
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.prioridade).toBe('ALTA');
    expect(res.body.dados.checklist).toHaveLength(2);
    expect(res.body.dados.anexos).toHaveLength(1);
  });

  /**
   * CA-2: Painel consolidado de obrigações e identificação de atrasadas
   */
  it('CA-2: deve exibir painel agrupado com pendentes, em preparação, em revisão, entregues e atrasadas', async () => {
    await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'EFD-Reinf',
        responsavel: 'Ana',
        prazo: '2026-06-10',
        prioridade: 'CRITICA',
        status: 'PENDENTE',
      });
    await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'PGDAS-D',
        responsavel: 'Bruno',
        prazo: '2026-06-20',
        prioridade: 'MEDIA',
        status: 'EM_REVISAO',
      });
    await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'FGTS Digital',
        responsavel: 'Carla',
        prazo: '2026-06-05',
        prioridade: 'ALTA',
        status: 'ENTREGUE',
      });

    const res = await request(app).get(
      `/api/empresas/${empresaId}/obrigacoes/painel?referencia=2026-06-15`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados.resumo.pendentes).toBe(1);
    expect(res.body.dados.resumo.emRevisao).toBe(1);
    expect(res.body.dados.resumo.entregues).toBe(1);
    expect(res.body.dados.resumo.atrasadas).toBe(1); // EFD-Reinf (2026-06-10 < 2026-06-15)
  });

  /**
   * CA-3: Atualização de status e validações
   */
  it('CA-3: deve atualizar status para ENTREGUE e recusar prioridade inválida (400)', async () => {
    const resCriar = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'SPED Fiscal',
        responsavel: 'Ana',
        prazo: '2026-06-10',
        prioridade: 'ALTA',
      });

    const resUpd = await request(app)
      .patch(
        `/api/empresas/${empresaId}/obrigacoes/tarefas/${resCriar.body.dados.id}/status`
      )
      .send({ status: 'ENTREGUE' });
    expect(resUpd.status).toBe(200);
    expect(resUpd.body.dados.status).toBe('ENTREGUE');

    const resInv = await request(app)
      .post(`/api/empresas/${empresaId}/obrigacoes/tarefas`)
      .send({
        titulo: 'Erro',
        responsavel: 'Ana',
        prazo: '2026-06-10',
        prioridade: 'URGENTISSIMA',
      });
    expect(resInv.status).toBe(400);
  });
});
