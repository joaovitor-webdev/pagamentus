/**
 * Modelos de Domínio para Organização Documental, Checklist e Correções
 * (SPEC-4.10 / RF-067, RF-068)
 */

export type StatusRecebimentoDoc =
  | 'ENVIADO'
  | 'CORRECAO_SOLICITADA'
  | 'RECEBIDO';

export interface ComentarioDocumento {
  autor: string;
  mensagem: string;
  criadoEm: Date;
}

export interface DocumentoOrganizado {
  id: string;
  clienteId: string;
  exercicio: number;
  competencia: string; // YYYY-MM
  tipo: string;
  processo: string;
  titulo: string;
  checklist: Array<{ item: string; conferido: boolean }>;
  comentarios: ComentarioDocumento[];
  status: StatusRecebimentoDoc;
  confirmadoPor?: string;
  confirmadoEm?: Date;
  criadoEm: Date;
}
