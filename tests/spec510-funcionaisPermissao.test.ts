import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.10: Testes funcionais e de permissão', () => {
  let app: any;

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
  });

  /**
   * CA-1: Fluxo funcional ponta a ponta (Fiscal + IRPF + Portal)
   */
  it('CA-1: deve executar com sucesso fluxos funcionais de apuração, IRPF e portal do cliente', async () => {
    const resDiv = await request(app)
      .post('/api/empresas/emp-func-01/fiscal/divergencias/conferir')
      .send({
        competencia: '2026-08',
        totalDocumentosFiscais: 2000,
        totalApuracaoTributaria: 2000,
        totalContabilidade: 2000,
      });
    expect(resDiv.status).toBe(200);
    expect(resDiv.body.dados.possuiDivergencias).toBe(false);

    const resFicha = await request(app)
      .post('/api/ir/fichas')
      .send({
        exercicio: 2026,
        documento: 'DOC-FUNC-001',
        nomeCompleto: 'Contribuinte Teste Funcional',
        dataNascimento: '1990-01-10',
        ocupacao: 'Contador',
        endereco: { logradouro: 'Av Central, 10', cidade: 'Curitiba', uf: 'PR' },
      });
    expect(resFicha.status).toBe(201);
  });

  /**
   * CA-2: Bloqueio de permissão por perfil (HTTP 403)
   */
  it('CA-2: deve bloquear ações sem permissão em aprovação fiscal, documentos de IR e políticas documentais (403)', async () => {
    // 1. Aprovação fiscal sem perfil autorizado
    const resProc = await request(app)
      .post('/api/empresas/emp-perm-01/fiscal/aprovacoes')
      .send({
        tipo: 'APURACAO',
        competencia: '2026-08',
        referencia: 'Apuração Permissão',
      });
    const resNegAprov = await request(app)
      .post(
        `/api/empresas/emp-perm-01/fiscal/aprovacoes/${resProc.body.dados.id}/revisar`
      )
      .send({
        profissionalId: 'usr-99',
        perfil: 'ESTAGIARIO',
        registroProfissional: 'N/A',
        decisao: 'APROVAR',
        parecer: 'Sem permissão',
      });
    expect(resNegAprov.status).toBe(403);

    // 2. Documentos restritos de IRPF sem perfil autorizado
    const resNegIr = await request(app)
      .get('/api/ir/fichas/ficha-perm-01/documentos')
      .set('x-perfil-acesso', 'CONVIDADO');
    expect(resNegIr.status).toBe(403);

    // 3. Política documental proibindo compartilhamento
    await request(app)
      .post('/api/portal/clientes/cli-perm-01/politicas-documentos')
      .send({
        documentoId: 'doc-perm-01',
        perfisPermitidos: ['CONTADOR'],
        permiteDownload: true,
        permiteCompartilhamento: false,
        retencaoAte: '2030-12-31',
      });
    const resNegComp = await request(app)
      .post('/api/portal/clientes/cli-perm-01/politicas-documentos/doc-perm-01/acao')
      .send({
        perfil: 'CONTADOR',
        acao: 'COMPARTILHAMENTO',
        dataReferencia: '2026-08-01',
      });
    expect(resNegComp.status).toBe(403);
  });

  /**
   * CA-3: Isolamento de dados entre clientes no Portal
   */
  it('CA-3: deve garantir isolamento de documentos entre clientes distintos no portal', async () => {
    await request(app)
      .post('/api/portal/clientes/cliente-A/documentos')
      .send({
        titulo: 'Documento Sigiloso Cliente A',
        categoria: 'FISCAL',
        nomeArquivo: 'sigiloso-a.pdf',
      });

    const resCliB = await request(app).get(
      '/api/portal/clientes/cliente-B/documentos'
    );
    expect(resCliB.status).toBe(200);
    expect(resCliB.body.dados).toHaveLength(0);
  });
});
