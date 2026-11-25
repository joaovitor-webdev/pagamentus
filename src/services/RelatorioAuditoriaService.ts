import * as crypto from 'crypto';

/**
 * Serviço para Relatórios de Auditoria (SPEC-5.5 / RF-074)
 */

export interface EventoAuditoriaSistema {
  id: string;
  empresaId: string;
  modulo: string;
  acao: string;
  usuario: string;
  dataEvento: string; // YYYY-MM-DD
  detalhe?: string;
}

const PERFIS_AUTORIZADOS = new Set(['ADMIN', 'AUDITOR', 'GESTOR']);

export class RelatorioAuditoriaService {
  private eventos: EventoAuditoriaSistema[] = [];

  public registrarEvento(dados: {
    empresaId: string;
    modulo: string;
    acao: string;
    usuario: string;
    dataEvento: string;
    detalhe?: string;
  }): EventoAuditoriaSistema {
    if (
      !dados.empresaId?.trim() ||
      !dados.modulo?.trim() ||
      !dados.acao?.trim() ||
      !dados.usuario?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dados.dataEvento || '')
    ) {
      throw new Error(
        'empresaId, modulo, acao, usuario e dataEvento (YYYY-MM-DD) são obrigatórios.'
      );
    }

    const ev: EventoAuditoriaSistema = {
      id: crypto.randomUUID(),
      empresaId: dados.empresaId.trim(),
      modulo: dados.modulo.trim().toUpperCase(),
      acao: dados.acao.trim().toUpperCase(),
      usuario: dados.usuario.trim(),
      dataEvento: dados.dataEvento,
      detalhe: dados.detalhe?.trim(),
    };
    this.eventos.push(ev);
    return ev;
  }

  public gerarRelatorio(dados: {
    empresaId: string;
    perfilAcesso: string;
    usuario?: string;
    modulo?: string;
    acao?: string;
    dataInicio?: string;
    dataFim?: string;
  }): {
    empresaId: string;
    totalEventos: number;
    eventos: EventoAuditoriaSistema[];
    geradoEm: Date;
  } {
    const perfilNorm = (dados.perfilAcesso || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      const erro = new Error(
        'Acesso negado: perfil sem permissão para emitir relatórios de auditoria.'
      ) as Error & { statusCode?: number };
      erro.statusCode = 403;
      throw erro;
    }

    const filtrados = this.eventos.filter(
      (e) =>
        e.empresaId === dados.empresaId.trim() &&
        (!dados.usuario || e.usuario === dados.usuario.trim()) &&
        (!dados.modulo || e.modulo === dados.modulo.trim().toUpperCase()) &&
        (!dados.acao || e.acao === dados.acao.trim().toUpperCase()) &&
        (!dados.dataInicio || e.dataEvento >= dados.dataInicio) &&
        (!dados.dataFim || e.dataEvento <= dados.dataFim)
    );

    return {
      empresaId: dados.empresaId.trim(),
      totalEventos: filtrados.length,
      eventos: filtrados,
      geradoEm: new Date(),
    };
  }

  public limpar(): void {
    this.eventos = [];
  }
}
