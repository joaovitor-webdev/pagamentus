/**
 * Modelos de Domínio para Divergências Fiscais e Contábeis (SPEC-3.10 / RF-024)
 */

export type TipoDivergenciaFiscal =
  | 'DOCUMENTO_X_APURACAO'
  | 'APURACAO_X_CONTABILIDADE'
  | 'DOCUMENTO_X_CONTABILIDADE';

export type SeveridadeDivergencia = 'MEDIA' | 'ALTA';

export interface AlertaDivergenciaFiscal {
  tipo: TipoDivergenciaFiscal;
  severidade: SeveridadeDivergencia;
  valorOrigem: number;
  valorComparado: number;
  diferenca: number;
  mensagem: string;
}

export interface EntradaConferenciaDivergencia {
  competencia: string; // YYYY-MM
  totalDocumentosFiscais: number;
  totalApuracaoTributaria: number;
  totalContabilidade: number;
  tolerancia?: number;
}

export interface ResultadoConferenciaDivergencia {
  id: string;
  empresaId: string;
  competencia: string;
  totalDocumentosFiscais: number;
  totalApuracaoTributaria: number;
  totalContabilidade: number;
  toleranciaAplicada: number;
  possuiDivergencias: boolean;
  alertas: AlertaDivergenciaFiscal[];
  verificadoEm: Date;
}
