import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.20: Declaração, recibo e comprovantes IRPF (RF-039)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-doc-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.documentoDeclaracaoIrService.limpar();
  });

  /**
   * CA-1: Armazenamento de declaração, recibo, cópia transmitida e comprovantes
   */
  it('CA-1: deve armazenar documentos de IR com hash SHA-256 e flag acessoRestrito', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/documentos`)
      .send({
        tipo: 'RECIBO',
        nomeArquivo: 'recibo-irpf-2026.pdf',
        conteudo: 'CONTEUDO-RECIBO-DEMO-2026',
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.tipo).toBe('RECIBO');
    expect(res.body.dados.hashSha256).toHaveLength(64);
    expect(res.body.dados.acessoRestrito).toBe(true);
  });

  /**
   * CA-2: Controle de acesso restrito
   */
  it('CA-2: deve permitir leitura para perfil autorizado e bloquear (403) para não autorizado', async () => {
    await request(app)
      .post(`/api/ir/fichas/${fichaId}/documentos`)
      .send({
        tipo: 'COPIA_TRANSMITIDA',
        nomeArquivo: 'declaracao-2026.dec',
        conteudo: 'COPIA-TRANSMITIDA-DEMO',
      });

    const resOk = await request(app)
      .get(`/api/ir/fichas/${fichaId}/documentos`)
      .set('x-perfil-acesso', 'CONTADOR');
    expect(resOk.status).toBe(200);
    expect(resOk.body.dados).toHaveLength(1);

    const resNegado = await request(app)
      .get(`/api/ir/fichas/${fichaId}/documentos`)
      .set('x-perfil-acesso', 'VISITANTE');
    expect(resNegado.status).toBe(403);
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar tipo de documento inválido ou conteúdo vazio (400)', async () => {
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/documentos`)
      .send({
        tipo: 'INVALIDO',
        nomeArquivo: 'x.pdf',
        conteudo: '',
      });
    expect(res.status).toBe(400);
  });
});
