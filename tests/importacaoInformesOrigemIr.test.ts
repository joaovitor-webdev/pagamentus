import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.16: Importação de informes e origem dos dados (RF-035, RB-005)', () => {
  let app: any;
  const fichaId = 'ficha-ficticia-inf-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.informeOrigemIrService.limpar();
  });

  /**
   * CA-1: Importação de informes por arquivo CSV/JSON com origem e exercício
   */
  it('CA-1: deve importar informe CSV preservando conteúdo original, origem IMPORTADO e exercício', async () => {
    const csv = 'fontePagadora;rendimentoTributavel;irRetido\nEmpresa Demo;50000;3200';
    const res = await request(app)
      .post(`/api/ir/fichas/${fichaId}/informes/importar`)
      .send({
        exercicio: 2026,
        formato: 'CSV',
        conteudo: csv,
      });

    expect(res.status).toBe(201);
    expect(res.body.dados).toHaveLength(1);
    expect(res.body.dados[0].origemAtual).toBe('IMPORTADO');
    expect(res.body.dados[0].exercicio).toBe(2026);
    expect(res.body.dados[0].conteudoOriginal).toBe(csv);
  });

  /**
   * CA-2: Digitação assistida e distinção das origens (RB-005)
   */
  it('CA-2: deve distinguir dados informados pelo cliente, importados, calculados e revisados pelo profissional', async () => {
    const resCli = await request(app)
      .post(`/api/ir/fichas/${fichaId}/informes`)
      .send({
        exercicio: 2026,
        fontePagadora: 'Autonomo Cliente',
        rendimentoTributavel: 15000,
        origemDado: 'INFORMADO_CLIENTE',
      });
    expect(resCli.status).toBe(201);

    const resRev = await request(app)
      .patch(
        `/api/ir/fichas/${fichaId}/informes/${resCli.body.dados.id}/revisar`
      )
      .send({ revisadoPor: 'Contador Responsável' });
    expect(resRev.status).toBe(200);
    expect(resRev.body.dados.origemInicial).toBe('INFORMADO_CLIENTE');
    expect(resRev.body.dados.origemAtual).toBe('REVISADO_PROFISSIONAL');

    const resFiltro = await request(app).get(
      `/api/ir/fichas/${fichaId}/informes?origem=REVISADO_PROFISSIONAL`
    );
    expect(resFiltro.status).toBe(200);
    expect(resFiltro.body.dados).toHaveLength(1);
  });

  /**
   * CA-3: Validações de formato e entrada
   */
  it('CA-3: deve recusar formato incompatível ou origem inválida (400)', async () => {
    const resFmt = await request(app)
      .post(`/api/ir/fichas/${fichaId}/informes/importar`)
      .send({ exercicio: 2026, formato: 'PDF', conteudo: 'binario' });
    expect(resFmt.status).toBe(400);

    const resOrig = await request(app)
      .post(`/api/ir/fichas/${fichaId}/informes`)
      .send({
        exercicio: 2026,
        fontePagadora: 'X',
        rendimentoTributavel: 100,
        origemDado: 'DESCONHECIDA',
      });
    expect(resOrig.status).toBe(400);
  });
});
