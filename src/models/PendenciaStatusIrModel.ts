/**
 * Modelos de Domínio para Pendências e Status da Declaração IRPF
 * (SPEC-3.19 / RF-038, RF-040)
 */

export type StatusDeclaracaoIr =
  | 'EM_PREPARACAO'
  | 'EM_REVISAO'
  | 'AUTORIZADA'
  | 'TRANSMITIDA_EXTERNA'
  | 'TRANSMITIDA_INTEGRACAO'
  | 'RETIFICACAO'
  | 'COM_PENDENCIAS';

export type TipoItemPendenciaIr =
  | 'DOCUMENTO_FALTANTE'
  | 'PENDENCIA'
  | 'ALERTA';

export interface ItemPendenciaIr {
  id: string;
  fichaId: string;
  tipo: TipoItemPendenciaIr;
  descricao: string;
  resolvida: boolean;
  criadoEm: Date;
  resolvidaEm?: Date;
}

export interface TransicaoStatusIr {
  status: StatusDeclaracaoIr;
  observacao?: string;
  alteradoPor: string;
  alteradoEm: Date;
}

export interface ResumoRevisaoContribuinteIr {
  fichaId: string;
  statusAtual: StatusDeclaracaoIr;
  documentosFaltantes: ItemPendenciaIr[];
  pendenciasAbertas: ItemPendenciaIr[];
  alertas: ItemPendenciaIr[];
  historicoStatus: TransicaoStatusIr[];
}
