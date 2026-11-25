import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.22: IRPJ - Memória de apuração e obrigações digitais (RF-044, RF-045)', () => {
  let app: any;
  const empresaId = 'empresa-ficticia-ecf-001';

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.irpjObrigacoesDigitaisService.limpar();
  });

  /**
   * CA-1: Memória de apuração, conciliação contábil e documentação de suporte
   */
  it('CA-1: deve registrar memória de apuração verificando conciliação contábil e documentos de suporte', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/memorias`)
      .send({
        competencia: '2026-03',
        tributo: 'IRPJ',
        baseCalculo: 100000,
        aliquotaPercentual: 15,
        valorContabilizado: 15000,
        documentosSuporte: ['BALANCETE-2026-03.pdf', 'LALUR-2026-03.pdf'],
      });

    expect(res.status).toBe(201);
    expect(res.body.dados.valorApurado).toBe(15000);
    expect(res.body.dados.conciliado).toBe(true);
    expect(res.body.dados.documentosSuporte).toHaveLength(2);
  });

  /**
   * CA-2: Preparação de pacote para obrigação digital respeitando versão de leiaute
   */
  it('CA-2: deve preparar dados estruturados da ECF respeitando a versão de leiaute informada', async () => {
    await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/memorias`)
      .send({
        competencia: '2026-06',
        tributo: 'CSLL',
        baseCalculo: 50000,
        aliquotaPercentual: 9,
        valorContabilizado: 4500,
      });

    const res = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/obrigacoes-digitais`)
      .send({
        obrigacao: 'ECF',
        exercicio: 2026,
        leiauteVersao: '0010',
      });

    expect(res.status).toBe(200);
    expect(res.body.dados.obrigacao).toBe('ECF');
    expect(res.body.dados.leiauteVersao).toBe('0010');
    expect(res.body.dados.quantidadeRegistros).toBe(1);
    expect(res.body.dados.registros[0].bloco).toBe('BLOCO_N');
  });

  /**
   * CA-3: Validações de entrada
   */
  it('CA-3: deve recusar obrigação inválida ou leiauteVersao ausente (400)', async () => {
    const res = await request(app)
      .post(`/api/empresas/${empresaId}/irpj-csll/obrigacoes-digitais`)
      .send({
        obrigacao: 'INVALIDA',
        exercicio: 2026,
        leiauteVersao: '',
      });
    expect(res.status).toBe(400);
  });
});
