import { createHash, randomUUID } from 'crypto';

export interface RegistroImportacaoBase {
  idExterno?: string;
  identificador: string;
  dados: Record<string, unknown>;
}

export interface ItemValidado {
  indice: number;
  identificador: string;
  valido: boolean;
  duplicado: boolean;
  erros: string[];
  avisos: string[];
  dados: Record<string, unknown>;
}

export interface PreVisualizacaoImportacao {
  loteId: string;
  nomeArquivo: string;
  formato: 'JSON' | 'CSV';
  hashArquivoOriginal: string;
  totalRegistros: number;
  totalValidos: number;
  totalInvalidos: number;
  totalDuplicados: number;
  itens: ItemValidado[];
}

export interface ProcessamentoLoteResultado {
  loteId: string;
  status: 'PROCESSADO_COM_SUCESSO' | 'PROCESSADO_PARCIALMENTE' | 'REJEITADO';
  totalProcessados: number;
  totalIgnorados: number;
  erros: string[];
  processadoEm: string;
  hashArquivoOriginal: string;
}

export class ImportacaoExportacaoValidadaService {
  private readonly lotesOriginais = new Map<
    string,
    {
      nomeArquivo: string;
      conteudoOriginal: string;
      hashSha256: string;
      recebidoEm: string;
      preVisualizacao: PreVisualizacaoImportacao;
    }
  >();

  private readonly registrosArmazenados = new Map<string, Record<string, unknown>>();
  private readonly resultadosProcessamento = new Map<string, ProcessamentoLoteResultado>();

  public gerarHash(conteudo: string): string {
    return createHash('sha256').update(conteudo, 'utf8').digest('hex');
  }

  public preVisualizarLote(entrada: {
    nomeArquivo: string;
    formato: 'JSON' | 'CSV';
    conteudo: string;
    registros: RegistroImportacaoBase[];
  }): PreVisualizacaoImportacao {
    const loteId = randomUUID();
    const hashArquivoOriginal = this.gerarHash(entrada.conteudo);

    const vistosNesteLote = new Set<string>();
    const itensValidados: ItemValidado[] = [];

    let totalValidos = 0;
    let totalInvalidos = 0;
    let totalDuplicados = 0;

    entrada.registros.forEach((reg, index) => {
      const erros: string[] = [];
      const avisos: string[] = [];
      let duplicado = false;

      if (!reg.identificador || reg.identificador.trim() === '') {
        erros.push('Campo obrigatório "identificador" ausente ou em branco.');
      }

      if (!reg.dados || typeof reg.dados !== 'object') {
        erros.push('Estrutura de dados inválida para o registro.');
      }

      const idChave = (reg.identificador || '').trim().toLowerCase();

      if (idChave && (this.registrosArmazenados.has(idChave) || vistosNesteLote.has(idChave))) {
        duplicado = true;
        totalDuplicados += 1;
        erros.push(`Registro duplicado com identificador "${reg.identificador}".`);
      } else if (idChave) {
        vistosNesteLote.add(idChave);
      }

      const valido = erros.length === 0;
      if (valido) {
        totalValidos += 1;
      } else {
        totalInvalidos += 1;
      }

      itensValidados.push({
        indice: index + 1,
        identificador: reg.identificador || `REG-${index + 1}`,
        valido,
        duplicado,
        erros,
        avisos,
        dados: reg.dados ?? {},
      });
    });

    const preVisualizacao: PreVisualizacaoImportacao = {
      loteId,
      nomeArquivo: entrada.nomeArquivo,
      formato: entrada.formato,
      hashArquivoOriginal,
      totalRegistros: entrada.registros.length,
      totalValidos,
      totalInvalidos,
      totalDuplicados,
      itens: itensValidados,
    };

    // RB-006: Arquivos importados devem ser validados e deduplicados, preservando o original
    this.lotesOriginais.set(loteId, {
      nomeArquivo: entrada.nomeArquivo,
      conteudoOriginal: entrada.conteudo,
      hashSha256: hashArquivoOriginal,
      recebidoEm: new Date().toISOString(),
      preVisualizacao,
    });

    return preVisualizacao;
  }

  public confirmarImportacao(loteId: string, descartarInvalidos = true): ProcessamentoLoteResultado {
    const lote = this.lotesOriginais.get(loteId);
    if (!lote) {
      throw new Error(`Lote com identificador "${loteId}" não encontrado.`);
    }

    const { itens, hashArquivoOriginal } = lote.preVisualizacao;
    let processados = 0;
    let ignorados = 0;
    const errosLote: string[] = [];

    for (const item of itens) {
      if (item.valido && !item.duplicado) {
        const chave = item.identificador.trim().toLowerCase();
        this.registrosArmazenados.set(chave, item.dados);
        processados += 1;
      } else {
        ignorados += 1;
        if (!descartarInvalidos && item.erros.length > 0) {
          errosLote.push(`Item ${item.indice} (${item.identificador}): ${item.erros.join(', ')}`);
        }
      }
    }

    let status: ProcessamentoLoteResultado['status'] = 'PROCESSADO_COM_SUCESSO';
    if (processados === 0 && itens.length > 0) {
      status = 'REJEITADO';
    } else if (ignorados > 0) {
      status = 'PROCESSADO_PARCIALMENTE';
    }

    const resultado: ProcessamentoLoteResultado = {
      loteId,
      status,
      totalProcessados: processados,
      totalIgnorados: ignorados,
      erros: errosLote,
      processadoEm: new Date().toISOString(),
      hashArquivoOriginal,
    };

    this.resultadosProcessamento.set(loteId, resultado);
    return resultado;
  }

  public obterOriginalPreservado(loteId: string) {
    const lote = this.lotesOriginais.get(loteId);
    if (!lote) return null;
    return {
      loteId,
      nomeArquivo: lote.nomeArquivo,
      conteudoOriginal: lote.conteudoOriginal,
      hashSha256: lote.hashSha256,
      recebidoEm: lote.recebidoEm,
    };
  }

  public obterResultadoProcessamento(loteId: string): ProcessamentoLoteResultado | null {
    return this.resultadosProcessamento.get(loteId) ?? null;
  }

  public exportarDadosValidados(filtro?: { prefixoIdentificador?: string }): {
    total: number;
    dados: Array<{ identificador: string; dados: Record<string, unknown> }>;
  } {
    const dados: Array<{ identificador: string; dados: Record<string, unknown> }> = [];
    for (const [id, reg] of this.registrosArmazenados.entries()) {
      if (!filtro?.prefixoIdentificador || id.startsWith(filtro.prefixoIdentificador.toLowerCase())) {
        dados.push({ identificador: id, dados: reg });
      }
    }
    return { total: dados.length, dados };
  }
}
