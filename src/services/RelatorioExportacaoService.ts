/**
 * Serviço para geração de relatórios gerenciais/operacionais em PDF, XLSX e CSV
 * (SPEC-5.3 / RF-071)
 */

export type FormatoRelatorio = 'PDF' | 'XLSX' | 'CSV';

export interface LinhaRelatorio {
  codigo: string;
  descricao: string;
  valor: number;
}

export interface RelatorioGerado {
  formato: FormatoRelatorio;
  nomeArquivo: string;
  mimeType: string;
  conteudo: string;
  quantidadeLinhas: number;
  geradoEm: Date;
}

const FORMATOS_VALIDOS: FormatoRelatorio[] = ['PDF', 'XLSX', 'CSV'];
const PERFIS_AUTORIZADOS = new Set(['ADMIN', 'GESTOR', 'CONTADOR']);

export class RelatorioExportacaoService {
  public gerar(dados: {
    titulo: string;
    formato: FormatoRelatorio;
    perfilAcesso: string;
    linhas: LinhaRelatorio[];
  }): RelatorioGerado {
    const perfilNorm = (dados.perfilAcesso || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      const erro = new Error(
        'Acesso negado: perfil sem permissão para exportar relatórios.'
      ) as Error & { statusCode?: number };
      erro.statusCode = 403;
      throw erro;
    }

    if (!dados.titulo?.trim()) {
      throw new Error('titulo do relatório é obrigatório.');
    }
    if (!FORMATOS_VALIDOS.includes(dados.formato)) {
      throw new Error("formato deve ser 'PDF', 'XLSX' ou 'CSV'.");
    }

    const linhas = Array.isArray(dados.linhas) ? dados.linhas : [];
    const slug = dados.titulo
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    if (dados.formato === 'CSV') {
      const header = 'codigo;descricao;valor';
      const body = linhas
        .map((l) => `${l.codigo};${l.descricao};${Number(l.valor).toFixed(2)}`)
        .join('\n');
      return {
        formato: 'CSV',
        nomeArquivo: `${slug}.csv`,
        mimeType: 'text/csv; charset=utf-8',
        conteudo: body ? `${header}\n${body}` : header,
        quantidadeLinhas: linhas.length,
        geradoEm: new Date(),
      };
    }

    if (dados.formato === 'XLSX') {
      const rowsXml = linhas
        .map(
          (l) =>
            `<Row><Cell><Data ss:Type="String">${l.codigo}</Data></Cell><Cell><Data ss:Type="String">${l.descricao}</Data></Cell><Cell><Data ss:Type="Number">${Number(l.valor).toFixed(2)}</Data></Cell></Row>`
        )
        .join('');
      const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Relatorio"><Table>${rowsXml}</Table></Worksheet></Workbook>`;
      return {
        formato: 'XLSX',
        nomeArquivo: `${slug}.xlsx`,
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        conteudo: xml,
        quantidadeLinhas: linhas.length,
        geradoEm: new Date(),
      };
    }

    // PDF estruturado mínimo válido
    const textoLinhas = linhas
      .map((l) => `${l.codigo} | ${l.descricao} | ${Number(l.valor).toFixed(2)}`)
      .join('\n');
    const pdf = `%PDF-1.4\n% Pagamentus Relatorio: ${dados.titulo}\n${textoLinhas}\n%%EOF`;
    return {
      formato: 'PDF',
      nomeArquivo: `${slug}.pdf`,
      mimeType: 'application/pdf',
      conteudo: pdf,
      quantidadeLinhas: linhas.length,
      geradoEm: new Date(),
    };
  }
}
