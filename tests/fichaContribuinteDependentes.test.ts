import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-3.13: Ficha do contribuinte e dependentes (RF-030, RF-034)', () => {
  let app: any;

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
    instancia.fichaContribuinteIrService.limpar();
  });

  /**
   * CA-1: Criação da ficha completa do contribuinte
   */
  it('CA-1: deve criar ficha do contribuinte com dados pessoais, ocupação, endereço, dados bancários, alimentandos e dependentes', async () => {
    const res = await request(app)
      .post('/api/ir/fichas')
      .send({
        exercicio: 2026,
        documento: 'DOC-TITULAR-001',
        nomeCompleto: 'Contribuinte Ficticio Um',
        dataNascimento: '1988-04-12',
        ocupacao: 'Analista de Sistemas',
        endereco: {
          logradouro: 'Rua Exemplo, 100',
          cidade: 'Sao Paulo',
          uf: 'SP',
        },
        dadosBancarios: {
          banco: '001',
          agencia: '1234',
          conta: '56789-0',
          tipoConta: 'CORRENTE',
        },
        dependentes: [
          {
            documento: 'DOC-DEP-001',
            nome: 'Dependente Ficticio Um',
            parentesco: 'FILHO',
            dataNascimento: '2016-05-10',
          },
        ],
        alimentandos: [
          {
            documento: 'DOC-ALIM-001',
            nome: 'Alimentando Ficticio Um',
            dataNascimento: '2014-03-20',
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.sucesso).toBe(true);
    expect(res.body.dados.dependentes).toHaveLength(1);
    expect(res.body.dados.alimentandos).toHaveLength(1);
    expect(res.body.dados.dadosBancarios.banco).toBe('001');
  });

  /**
   * CA-2: Bloqueio de duplicidade de dependente no mesmo exercício
   */
  it('CA-2: deve bloquear inclusão duplicada de dependente no mesmo exercício (409)', async () => {
    const resFicha1 = await request(app)
      .post('/api/ir/fichas')
      .send({
        exercicio: 2026,
        documento: 'DOC-TITULAR-001',
        nomeCompleto: 'Contribuinte Um',
        dataNascimento: '1985-01-01',
        ocupacao: 'Engenheiro',
        endereco: { logradouro: 'Rua A, 1', cidade: 'Recife', uf: 'PE' },
        dependentes: [
          {
            documento: 'DOC-DEP-DUP',
            nome: 'Dependente Compartilhado',
            parentesco: 'FILHO',
            dataNascimento: '2015-02-02',
          },
        ],
      });
    expect(resFicha1.status).toBe(201);

    const resFicha2 = await request(app)
      .post('/api/ir/fichas')
      .send({
        exercicio: 2026,
        documento: 'DOC-TITULAR-002',
        nomeCompleto: 'Contribuinte Dois',
        dataNascimento: '1986-02-02',
        ocupacao: 'Professora',
        endereco: { logradouro: 'Rua B, 2', cidade: 'Recife', uf: 'PE' },
      });
    expect(resFicha2.status).toBe(201);

    const resDup = await request(app)
      .post(`/api/ir/fichas/${resFicha2.body.dados.id}/dependentes`)
      .send({
        documento: 'DOC-DEP-DUP',
        nome: 'Dependente Compartilhado',
        parentesco: 'FILHO',
        dataNascimento: '2015-02-02',
      });
    expect(resDup.status).toBe(409);
  });

  /**
   * CA-3: Validações e consulta de ficha inexistente
   */
  it('CA-3: deve recusar dados inválidos (400) e ficha inexistente (404)', async () => {
    const resInv = await request(app)
      .post('/api/ir/fichas')
      .send({ exercicio: 1990, documento: '', nomeCompleto: '' });
    expect(resInv.status).toBe(400);

    const resNotFound = await request(app).get('/api/ir/fichas/inexistente');
    expect(resNotFound.status).toBe(404);
  });
});
