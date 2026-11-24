import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.10: Divergências fiscais e contábeis (RF-024)', () => {
  let app: any;
  const empresaFicticiaId = 'empresa-ficticia-div-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.divergenciaFiscalContabilService.limpar();
  });

  /**
   * CA-1: Detecção de divergências entre documentos fiscais, apuração e contabilidade
   */
  it('CA-1: deve alertar divergências entre documentos fiscais, apuração e contabilidade', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/divergencias/conferir`)
      .send({
        competencia: '2026-06',
        totalDocumentosFiscais: 10000,
        totalApuracaoTributaria: 9850,
        totalContabilidade: 10000,
      });

    expect(res.status).toBe(200);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.possuiDivergencias).toBe(true);
    expect(res.body.dados.alertas).toHaveLength(2);
    expect(res.body.dados.alertas[0].tipo).toBe('DOCUMENTO_X_APURACAO');
    expect(res.body.dados.alertas[0].diferenca).toBe(150);
    expect(res.body.dados.alertas[0].severidade).toBe('ALTA');
    expect(res.body.dados.alertas[1].tipo).toBe('APURACAO_X_CONTABILIDADE');
  });

  /**
   * CA-2: Cenário conciliado dentro da tolerância
   */
  it('CA-2: deve retornar sem alertas quando os totais estiverem conciliados dentro da tolerância', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/divergencias/conferir`)
      .send({
        competencia: '2026-06',
        totalDocumentosFiscais: 5000.01,
        totalApuracaoTributaria: 5000.0,
        totalContabilidade: 5000.0,
        tolerancia: 0.05,
      });

    expect(res.status).toBe(200);
    expect(res.body.dados.possuiDivergencias).toBe(false);
    expect(res.body.dados.alertas).toHaveLength(0);
  });

  /**
   * CA-3: Histórico de conferências e validações de entrada
   */
  it('CA-3: deve registrar histórico e recusar parâmetros inválidos', async () => {
    await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/divergencias/conferir`)
      .send({
        competencia: '2026-07',
        totalDocumentosFiscais: 1000,
        totalApuracaoTributaria: 1000,
        totalContabilidade: 1000,
      });

    const resHist = await request(app).get(
      `/api/empresas/${empresaFicticiaId}/fiscal/divergencias`
    );
    expect(resHist.status).toBe(200);
    expect(resHist.body.dados).toHaveLength(1);

    const resErro = await request(app)
      .post(`/api/empresas/${empresaFicticiaId}/fiscal/divergencias/conferir`)
      .send({
        competencia: '2026/07',
        totalDocumentosFiscais: -10,
        totalApuracaoTributaria: 1000,
        totalContabilidade: 1000,
      });
    expect(resErro.status).toBe(400);
  });
});
