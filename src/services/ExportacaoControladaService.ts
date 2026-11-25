import * as crypto from 'crypto';

/**
 * Serviço para Exportação Controlada e Saída de Dados em Formatos Abertos
 * (SPEC-5.4 / RF-073, RNF-015)
 */

export type FormatoSaidaAberta = 'JSON' | 'CSV';

export interface RegistroAuditoriaExportacao {
  id: string;
  clienteId: string;
  usuario: string;
  perfil: string;
  formato: FormatoSaidaAberta;
  motivo: string;
  quantidadeRegistros: number;
  hashSha256: string;
  exportadoEm: Date;
}

const PERFIS_AUTORIZADOS = new Set(['ADMIN', 'GESTOR', 'CONTADOR']);

export class ExportacaoControladaService {
  private historico: RegistroAuditoriaExportacao[] = [];

  public exportar(dados: {
    clienteId: string;
    usuario: string;
    perfil: string;
    formato: FormatoSaidaAberta;
    motivo: string;
    registros: Record<string, string | number | boolean>[];
  }): { conteudo: string; auditoria: RegistroAuditoriaExportacao } {
    const perfilNorm = (dados.perfil || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      const erro = new Error(
        'Acesso negado: perfil sem permissão para exportação controlada de dados.'
      ) as Error & { statusCode?: number };
      erro.statusCode = 403;
      throw erro;
    }

    if (
      !dados.clienteId?.trim() ||
      !dados.usuario?.trim() ||
      !dados.motivo?.trim()
    ) {
      throw new Error('clienteId, usuario e motivo são obrigatórios.');
    }
    if (dados.formato !== 'JSON' && dados.formato !== 'CSV') {
      throw new Error("formato deve ser aberto: 'JSON' ou 'CSV'.");
    }

    const registros = Array.isArray(dados.registros) ? dados.registros : [];
    let conteudo = '';

    if (dados.formato === 'JSON') {
      conteudo = JSON.stringify(
        {
          clienteId: dados.clienteId.trim(),
          formato: 'JSON',
          registros,
        },
        null,
        2
      );
    } else {
      const colunas = registros.length > 0 ? Object.keys(registros[0]) : [];
      const header = colunas.join(';');
      const linhas = registros.map((r) =>
        colunas.map((c) => String(r[c] ?? '')).join(';')
      );
      conteudo = header ? [header, ...linhas].join('\n') : '';
    }

    const hashSha256 = crypto
      .createHash('sha256')
      .update(conteudo)
      .digest('hex');

    const auditoria: RegistroAuditoriaExportacao = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      usuario: dados.usuario.trim(),
      perfil: perfilNorm,
      formato: dados.formato,
      motivo: dados.motivo.trim(),
      quantidadeRegistros: registros.length,
      hashSha256,
      exportadoEm: new Date(),
    };
    this.historico.push(auditoria);

    return { conteudo, auditoria };
  }

  public listarAuditoria(clienteId: string): RegistroAuditoriaExportacao[] {
    return this.historico.filter((h) => h.clienteId === clienteId.trim());
  }

  public limpar(): void {
    this.historico = [];
  }
}
