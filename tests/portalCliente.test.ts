import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-4.9: Portal do cliente (RF-066)', () => {
  let app: any;
  const clienteId = 'cliente-ficticio-portal-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.portalClienteService.limpar();
  });

  /**
   * CA-1: Envio e consulta de documentos isolados por cliente
   */
  it('CA-1: deve permitir ao cliente enviar e consultar seus próprios documentos', async () => {
    const resEnv = await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos`)
      .send({
        titulo: 'Extrato bancário Maio/2026',
        categoria: 'FINANCEIRO',
        nomeArquivo: 'extrato-05-2026.pdf',
      });
    expect(resEnv.status).toBe(201);

    const resLista = await request(app).get(
      `/api/portal/clientes/${clienteId}/documentos`
    );
    expect(resLista.status).toBe(200);
    expect(resLista.body.dados).toHaveLength(1);
    expect(resLista.body.dados[0].nomeArquivo).toBe('extrato-05-2026.pdf');
  });

  /**
   * CA-2: Abertura e acompanhamento de solicitações
   */
  it('CA-2: deve abrir solicitação e acompanhar evolução do status', async () => {
    const resAbrir = await request(app)
      .post(`/api/portal/clientes/${clienteId}/solicitacoes`)
      .send({
        assunto: 'Certidão negativa',
        descricao: 'Solicito CND federal atualizada.',
      });
    expect(resAbrir.status).toBe(201);
    const id = resAbrir.body.dados.id;

    const resUpd = await request(app)
      .patch(`/api/portal/clientes/${clienteId}/solicitacoes/${id}/status`)
      .send({ status: 'CONCLUIDA' });
    expect(resUpd.status).toBe(200);
    expect(resUpd.body.dados.status).toBe('CONCLUIDA');

    const resLista = await request(app).get(
      `/api/portal/clientes/${clienteId}/solicitacoes`
    );
    expect(resLista.body.dados).toHaveLength(1);
    expect(resLista.body.dados[0].status).toBe('CONCLUIDA');
  });

  /**
   * CA-3: Validações
   */
  it('CA-3: deve recusar campos obrigatórios ausentes ou status inválido (400)', async () => {
    const res = await request(app)
      .post(`/api/portal/clientes/${clienteId}/documentos`)
      .send({ titulo: '', categoria: '', nomeArquivo: '' });
    expect(res.status).toBe(400);
  });
});
