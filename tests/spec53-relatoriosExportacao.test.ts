import request from 'supertest';
import { criarApp } from '../src/app';

describe('SPEC-5.3: Relatórios em PDF, XLSX e CSV (RF-071)', () => {
  let app: any;

  beforeEach(() => {
    const instancia = criarApp();
    app = instancia.app;
  });

  it('deve exportar relatório nos formatos CSV, XLSX e PDF para perfil autorizado', async () => {
    const linhas = [{ codigo: '001', descricao: 'Receita Demo', valor: 1500 }];

    const resCsv = await request(app)
      .post('/api/relatorios/exportar')
      .set('x-perfil-acesso', 'CONTADOR')
      .send({ titulo: 'Demonstrativo Mensal', formato: 'CSV', linhas });
    expect(resCsv.status).toBe(200);
    expect(resCsv.body.dados.nomeArquivo).toBe('demonstrativo-mensal.csv');
    expect(resCsv.body.dados.conteudo).toContain('001;Receita Demo;1500.00');

    const resXlsx = await request(app)
      .post('/api/relatorios/exportar')
      .set('x-perfil-acesso', 'CONTADOR')
      .send({ titulo: 'Demonstrativo Mensal', formato: 'XLSX', linhas });
    expect(resXlsx.status).toBe(200);
    expect(resXlsx.body.dados.nomeArquivo).toBe('demonstrativo-mensal.xlsx');

    const resPdf = await request(app)
      .post('/api/relatorios/exportar')
      .set('x-perfil-acesso', 'CONTADOR')
      .send({ titulo: 'Demonstrativo Mensal', formato: 'PDF', linhas });
    expect(resPdf.status).toBe(200);
    expect(resPdf.body.dados.conteudo).toContain('%PDF-1.4');
  });

  it('deve bloquear perfil não autorizado (403) e formato inválido (400)', async () => {
    const res403 = await request(app)
      .post('/api/relatorios/exportar')
      .set('x-perfil-acesso', 'VISITANTE')
      .send({ titulo: 'Rel', formato: 'CSV', linhas: [] });
    expect(res403.status).toBe(403);

    const res400 = await request(app)
      .post('/api/relatorios/exportar')
      .set('x-perfil-acesso', 'CONTADOR')
      .send({ titulo: 'Rel', formato: 'DOCX', linhas: [] });
    expect(res400.status).toBe(400);
  });
});
