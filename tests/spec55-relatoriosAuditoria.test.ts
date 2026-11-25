import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.5: Relatórios de auditoria (RF-074)', () => {
  let app: any;
  const empresaId = 'emp-aud-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.relatorioAuditoriaService.limpar();
  });

  it('deve emitir relatório de auditoria filtrado por módulo, usuário e período', async () => {
    await request(app)
      .post(`/api/empresas/${empresaId}/auditoria/eventos`)
      .send({
        modulo: 'FISCAL',
        acao: 'APROVAR_APURACAO',
        usuario: 'contador.01',
        dataEvento: '2026-06-15',
      });
    await request(app)
      .post(`/api/empresas/${empresaId}/auditoria/eventos`)
      .send({
        modulo: 'CONTABIL',
        acao: 'FECHAR_PERIODO',
        usuario: 'gestor.01',
        dataEvento: '2026-07-01',
      });

    const res = await request(app)
      .get(
        `/api/empresas/${empresaId}/auditoria/relatorio?modulo=FISCAL&dataInicio=2026-06-01&dataFim=2026-06-30`
      )
      .set('x-perfil-acesso', 'AUDITOR');

    expect(res.status).toBe(200);
    expect(res.body.dados.totalEventos).toBe(1);
    expect(res.body.dados.eventos[0].acao).toBe('APROVAR_APURACAO');
  });

  it('deve bloquear perfil não autorizado (403)', async () => {
    const res = await request(app)
      .get(`/api/empresas/${empresaId}/auditoria/relatorio`)
      .set('x-perfil-acesso', 'CLIENTE');
    expect(res.status).toBe(403);
  });
});
