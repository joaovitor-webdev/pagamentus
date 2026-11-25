/**
 * Modelos de Domínio para Acesso, Retenção e Consentimentos (SPEC-4.11 / RF-069, RF-070)
 */

export type AcaoDocumentoPolitica = 'DOWNLOAD' | 'COMPARTILHAMENTO' | 'DESCARTE';

export type TipoTermoCliente = 'CONSENTIMENTO' | 'AUTORIZACAO' | 'PROCURACAO';

export interface PoliticaDocumentoCliente {
  id: string;
  clienteId: string;
  documentoId: string;
  perfisPermitidos: string[];
  permiteDownload: boolean;
  permiteCompartilhamento: boolean;
  retencaoAte: string; // YYYY-MM-DD
  descartado: boolean;
  descartadoEm?: Date;
}

export interface RegistroConsentimentoCliente {
  id: string;
  clienteId: string;
  tipo: TipoTermoCliente;
  outorgante: string;
  finalidade: string;
  validoAte?: string; // YYYY-MM-DD
  status: 'ATIVO' | 'REVOGADO';
  avisoJuridico: string;
  registradoEm: Date;
}
