import * as crypto from 'crypto';
import {
  DocumentoPortalCliente,
  SolicitacaoPortalCliente,
  StatusSolicitacaoPortal,
} from '../models/PortalClienteModel';

const STATUS_VALIDOS: StatusSolicitacaoPortal[] = [
  'ABERTA',
  'EM_ANDAMENTO',
  'CONCLUIDA',
];

/**
 * Serviço para Portal do Cliente (SPEC-4.9 / RF-066)
 */
export class PortalClienteService {
  private documentos: DocumentoPortalCliente[] = [];
  private solicitacoes: SolicitacaoPortalCliente[] = [];

  public enviarDocumento(dados: {
    clienteId: string;
    titulo: string;
    categoria: string;
    nomeArquivo: string;
  }): DocumentoPortalCliente {
    if (
      !dados.clienteId?.trim() ||
      !dados.titulo?.trim() ||
      !dados.categoria?.trim() ||
      !dados.nomeArquivo?.trim()
    ) {
      throw new Error(
        'clienteId, titulo, categoria e nomeArquivo são obrigatórios.'
      );
    }

    const doc: DocumentoPortalCliente = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      titulo: dados.titulo.trim(),
      categoria: dados.categoria.trim(),
      nomeArquivo: dados.nomeArquivo.trim(),
      enviadoEm: new Date(),
    };
    this.documentos.push(doc);
    return doc;
  }

  public listarDocumentos(clienteId: string): DocumentoPortalCliente[] {
    return this.documentos.filter((d) => d.clienteId === clienteId.trim());
  }

  public abrirSolicitacao(dados: {
    clienteId: string;
    assunto: string;
    descricao: string;
  }): SolicitacaoPortalCliente {
    if (
      !dados.clienteId?.trim() ||
      !dados.assunto?.trim() ||
      !dados.descricao?.trim()
    ) {
      throw new Error('clienteId, assunto e descricao são obrigatórios.');
    }

    const agora = new Date();
    const sol: SolicitacaoPortalCliente = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      assunto: dados.assunto.trim(),
      descricao: dados.descricao.trim(),
      status: 'ABERTA',
      criadoEm: agora,
      atualizadoEm: agora,
    };
    this.solicitacoes.push(sol);
    return sol;
  }

  public atualizarStatusSolicitacao(
    clienteId: string,
    solicitacaoId: string,
    status: StatusSolicitacaoPortal
  ): SolicitacaoPortalCliente {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error('Status da solicitação inválido.');
    }
    const sol = this.solicitacoes.find(
      (s) => s.clienteId === clienteId.trim() && s.id === solicitacaoId.trim()
    );
    if (!sol) {
      const erro = new Error('Solicitação não encontrada.') as Error & {
        statusCode?: number;
      };
      erro.statusCode = 404;
      throw erro;
    }
    sol.status = status;
    sol.atualizadoEm = new Date();
    return sol;
  }

  public listarSolicitacoes(clienteId: string): SolicitacaoPortalCliente[] {
    return this.solicitacoes.filter((s) => s.clienteId === clienteId.trim());
  }

  public limpar(): void {
    this.documentos = [];
    this.solicitacoes = [];
  }
}
