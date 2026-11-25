/**
 * Modelos de Domínio para Portal do Cliente (SPEC-4.9 / RF-066)
 */

export type StatusSolicitacaoPortal = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export interface DocumentoPortalCliente {
  id: string;
  clienteId: string;
  titulo: string;
  categoria: string;
  nomeArquivo: string;
  enviadoEm: Date;
}

export interface SolicitacaoPortalCliente {
  id: string;
  clienteId: string;
  assunto: string;
  descricao: string;
  status: StatusSolicitacaoPortal;
  criadoEm: Date;
  atualizadoEm: Date;
}
