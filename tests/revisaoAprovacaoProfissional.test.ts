import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.12: Revisão e aprovação profissional (RF-029, RB-003)', () => {
  let app: any;
  const empresaFicticiaId = 'empresa-ficticia-aprov-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.revisaoAprovacaoFiscalService.limpar();
  });

  /**
   * CA-1: Aprovação por profissional autorizado e finalização
   */
  it('CA-1: deve permitir aprovação por profissional autorizado e posterior finalização', async () => {
    const resCriar = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes`)
      .send({
        tipo: 'APURACAO',
        competencia: '2026-09',
        referencia: 'Apuração PIS/COFINS 09/2026',
      });
    expect(resCriar.status).toBe(201);
    const processoId = resCriar.body.dados.id;

    const resAprovar = await request(app)
      .post(
        `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/revisar`
      )
      .send({
        profissionalId: 'prof-001',
        perfil: 'CONTADOR',
        registroProfissional: 'CRC-SP-000000/O-0',
        decisao: 'APROVAR',
        parecer: 'Memória conferida e aprovada.',
      });
    expect(resAprovar.status).toBe(200);
    expect(resAprovar.body.dados.status).toBe('APROVADA');
    expect(resAprovar.body.dados.revisoes).toHaveLength(1);

    const resFinalizar = await request(app).post(
      `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/finalizar`
    );
    expect(resFinalizar.status).toBe(200);
    expect(resFinalizar.body.dados.status).toBe('FINALIZADA');
  });

  /**
   * CA-2: Bloqueio de finalização sem aprovação prévia
   */
  it('CA-2: deve bloquear finalização sem revisão e aprovação prévia', async () => {
    const resCriar = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes`)
      .send({
        tipo: 'DECLARACAO',
        competencia: '2026-09',
        referencia: 'DCTF Demo 09/2026',
      });
    const processoId = resCriar.body.dados.id;

    const resFinalizar = await request(app).post(
      `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/finalizar`
    );
    expect(resFinalizar.status).toBe(400);
  });

  /**
   * CA-3: Bloqueio de usuário não autorizado e fluxo de rejeição
   */
  it('CA-3: deve bloquear perfil não autorizado (403) e impedir finalização quando rejeitado', async () => {
    const resCriar = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes`)
      .send({
        tipo: 'OBRIGACAO',
        competencia: '2026-09',
        referencia: 'EFD Demo 09/2026',
      });
    const processoId = resCriar.body.dados.id;

    const resNaoAut = await request(app)
      .post(
        `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/revisar`
      )
      .send({
        profissionalId: 'usr-002',
        perfil: 'ASSISTENTE',
        registroProfissional: 'N/A',
        decisao: 'APROVAR',
        parecer: 'Tentativa sem permissão.',
      });
    expect(resNaoAut.status).toBe(403);

    const resRejeitar = await request(app)
      .post(
        `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/revisar`
      )
      .send({
        profissionalId: 'prof-001',
        perfil: 'RESPONSAVEL_FISCAL',
        registroProfissional: 'CRC-SP-000000/O-0',
        decisao: 'REJEITAR',
        parecer: 'Divergência encontrada na base.',
      });
    expect(resRejeitar.status).toBe(200);
    expect(resRejeitar.body.dados.status).toBe('REJEITADA');

    const resFinalizarRejeitada = await request(app).post(
      `/api/empresas/${empresaFicticiaId}/fiscal/aprovacoes/${processoId}/finalizar`
    );
    expect(resFinalizarRejeitada.status).toBe(400);
  });
});
