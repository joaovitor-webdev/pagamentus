import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-4.10: Organização, checklist e correções (RF-067, RF-068)', () => {
  let app: any;
  const clienteId = 'cliente-ficticio-org-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.organizacaoDocumentoService.limpar();
  });

  /**
   * CA-1: Organização por cliente, exercício, competência, tipo e processo com busca e filtros
   */
  it('CA-1: deve organizar documentos e filtrar por exercício, competência, tipo, processo e texto', async () => {
    await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos-organizados`)
      .send({
        exercicio: 2026,
        competencia: '2026-05',
        tipo: 'EXTRATO',
        processo: 'CONTABILIDADE',
        titulo: 'Extrato Banco Demo Maio',
        checklist: [{ item: 'PDF legível', conferido: true }],
      });

    await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos-organizados`)
      .send({
        exercicio: 2026,
        competencia: '2026-06',
        tipo: 'FOLHA',
        processo: 'DP',
        titulo: 'Folha de Pagamento Junho',
      });

    const res = await request(app).get(
      `/api/portal/clientes/${clienteId}/documentos-organizados?exercicio=2026&tipo=EXTRATO&q=Maio`
    );
    expect(res.status).toBe(200);
    expect(res.body.dados).toHaveLength(1);
    expect(res.body.dados[0].processo).toBe('CONTABILIDADE');
  });

  /**
   * CA-2: Comentários, pedido de correção e confirmação de recebimento
   */
  it('CA-2: deve registrar comentário, solicitar correção e confirmar recebimento', async () => {
    const resCriar = await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos-organizados`)
      .send({
        exercicio: 2026,
        competencia: '2026-06',
        tipo: 'NOTA_FISCAL',
        processo: 'FISCAL',
        titulo: 'Lote NF Junho',
      });
    const docId = resCriar.body.dados.id;

    const resCorr = await request(app)
      .patch(
        `/api/portal/clientes/${clienteId}/documentos-organizados/${docId}/solicitar-correcao`
      )
      .send({ autor: 'Analista', motivo: 'Falta XML da NF 105' });
    expect(resCorr.status).toBe(200);
    expect(resCorr.body.dados.status).toBe('CORRECAO_SOLICITADA');

    const resConf = await request(app)
      .patch(
        `/api/portal/clientes/${clienteId}/documentos-organizados/${docId}/confirmar-recebimento`
      )
      .send({ confirmadoPor: 'Analista' });
    expect(resConf.status).toBe(200);
    expect(resConf.body.dados.status).toBe('RECEBIDO');
  });

  /**
   * CA-3: Validações
   */
  it('CA-3: deve recusar campos ausentes (400) e documento inexistente (404)', async () => {
    const resInv = await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos-organizados`)
      .send({ exercicio: 2026, competencia: '2026/06', tipo: '', processo: '' });
    expect(resInv.status).toBe(400);

    const res404 = await request(app)
      .patch(
        `/api/portal/clientes/${clienteId}/documentos-organizados/inexistente/confirmar-recebimento`
      )
      .send({ confirmadoPor: 'Analista' });
    expect(res404.status).toBe(404);
  });
});
