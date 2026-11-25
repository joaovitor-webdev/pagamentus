import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-4.11: Acesso, retenção e consentimentos (RF-069, RF-070)', () => {
  let app: any;
  const clienteId = 'cliente-ficticio-pol-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.acessoRetencaoConsentimentoService.limpar();
  });

  /**
   * CA-1: Controle de acesso, download, compartilhamento e prazo de retenção/descarte
   */
  it('CA-1: deve controlar acesso/compartilhamento e bloquear descarte antes da retenção', async () => {
    await request(app)
      .post(`/api/portal/clientes/${clienteId}/politicas-documentos`)
      .send({
        documentoId: 'doc-001',
        perfisPermitidos: ['CONTADOR'],
        permiteDownload: true,
        permiteCompartilhamento: false,
        retencaoAte: '2030-12-31',
      });

    const resComp = await request(app)
      .post(`/api/portal/clientes/${clienteId}/politicas-documentos/doc-001/acao`)
      .send({
        perfil: 'CONTADOR',
        acao: 'COMPARTILHAMENTO',
        dataReferencia: '2026-06-01',
      });
    expect(resComp.status).toBe(403);

    const resDescAntes = await request(app)
      .post(`/api/portal/clientes/${clienteId}/politicas-documentos/doc-001/acao`)
      .send({
        perfil: 'CONTADOR',
        acao: 'DESCARTE',
        dataReferencia: '2026-06-01',
      });
    expect(resDescAntes.status).toBe(400);

    const resDescDepois = await request(app)
      .post(`/api/portal/clientes/${clienteId}/politicas-documentos/doc-001/acao`)
      .send({
        perfil: 'CONTADOR',
        acao: 'DESCARTE',
        dataReferencia: '2031-01-05',
      });
    expect(resDescDepois.status).toBe(200);
    expect(resDescDepois.body.dados.politica.descartado).toBe(true);
  });

  /**
   * CA-2: Registro de consentimentos, autorizações e procurações com aviso jurídico
   */
  it('CA-2: deve registrar procuração com aviso de que não substitui análise jurídica', async () => {
    const res = await request(app)
      .post(`/api/portal/clientes/${clienteId}/consentimentos`)
      .send({
        tipo: 'PROCURACAO',
        outorgante: 'Empresa Ficticia Ltda',
        finalidade: 'Representação operacional junto ao escritório',
        validoAte: '2027-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.tipo).toBe('PROCURACAO');
    expect(res.body.dados.avisoJuridico).toContain('RF-070');
  });

  /**
   * CA-3: Validações
   */
  it('CA-3: deve recusar tipo de termo inválido (400)', async () => {
    const res = await request(app)
      .post(`/api/portal/clientes/${clienteId}/consentimentos`)
      .send({
        tipo: 'INVALIDO',
        outorgante: 'X',
        finalidade: 'Y',
      });
    expect(res.status).toBe(400);
  });
});
