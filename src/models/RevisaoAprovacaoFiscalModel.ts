/**
 * Modelos de Domínio para Revisão e Aprovação Profissional (SPEC-3.12 / RF-029, RB-003)
 */

export type TipoProcessoFiscal = 'APURACAO' | 'OBRIGACAO' | 'DECLARACAO';

export type StatusAprovacaoFiscal =
  | 'EM_REVISAO'
  | 'APROVADA'
  | 'REJEITADA'
  | 'FINALIZADA';

export type DecisaoRevisaoFiscal = 'APROVAR' | 'REJEITAR';

export interface RegistroRevisaoFiscal {
  profissionalId: string;
  perfil: string;
  registroProfissional: string;
  decisao: DecisaoRevisaoFiscal;
  parecer: string;
  revisadoEm: Date;
}

export interface ProcessoAprovacaoFiscal {
  id: string;
  empresaId: string;
  tipo: TipoProcessoFiscal;
  competencia: string; // YYYY-MM
  referencia: string;
  status: StatusAprovacaoFiscal;
  revisoes: RegistroRevisaoFiscal[];
  finalizadoEm?: Date;
  criadoEm: Date;
}
