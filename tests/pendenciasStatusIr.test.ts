import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.19: Pendências e status IRPF (RF-038, RF-040)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-pend-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.pendenciaStatusIrService.limpar();
  });

  /**
   * CA-1: Documentos faltantes, pendências, alertas e resumo para revisão
   */
  it('CA-1: deve listar documentos faltantes, pendências e alertas no resumo para revisão', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/pendencias`)
      .send({
        tipo: 'DOCUMENTO_FALTANTE',
        descricao: 'Informe bancário 2026',
      });
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/pendencias`)
      .send({
        tipo: 'ALERTA',
        descricao: 'Verificar despesas médicas sem recibo',
      });

    const res = await request(app).get(
      `/api/ir/fichas/${fichaId}/resumo-revisao`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados.documentosFaltantes).toHaveLength(1);
    expect(res.body.dados.alertas).toHaveLength(1);
  });

  /**
   * CA-2: Acompanhamento de status e histórico de transições
   */
  it('CA-2: deve atualizar status da declaração e manter histórico completo', async () => {
    await request(app)
      .patch(`/api/ir/fichas/${fichaId}/status`)
      .send({
        status: 'EM_REVISAO',
        alteradoPor: 'Contador',
      });
    await request(app)
      .patch(`/api/ir/fichas/${fichaId}/status`)
      .send({
        status: 'TRANSMITIDA_EXTERNA',
        alteradoPor: 'Contador',
        observacao: 'Transmitida via PGD',
      });

    const res = await request(app).get(
      `/api/ir/fichas/${fichaId}/resumo-revisao`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados.statusAtual).toBe('TRANSMITIDA_EXTERNA');
    expect(res.body.dados.historicoStatus).toHaveLength(2);
  });

  /**
   * CA-3: Resolução de pendência e validações
   */
  it('CA-3: deve resolver pendência e recusar status inválido (400)', async () => {
    const resCriar = await request(app)
      .post(`/api/ir/fichas/${fichaId}/pendencias`)
      .send({
        tipo: 'PENDENCIA',
        descricao: 'Confirmar endereço atualizado',
      });

    const resRes = await request(app).patch(
      `/api/ir/fichas/${fichaId}/pendencias/${resCriar.body.dados.id}/resolver`
    );
    expect(resRes.status).toBe(200);
    expect(resRes.body.dados.resolvida).toBe(true);

    const resInv = await request(app)
      .patch(`/api/ir/fichas/${fichaId}/status`)
      .send({ status: 'INEXISTENTE', alteradoPor: 'X' });
    expect(resInv.status).toBe(400);
  });
});
