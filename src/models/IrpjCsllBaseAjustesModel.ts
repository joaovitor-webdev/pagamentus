/**
 * Modelos de Domínio para IRPJ/CSLL: Base e Ajustes (SPEC-3.21 / RF-042, RF-043)
 */

export type RegimeIrpjCsll = 'LUCRO_REAL' | 'LUCRO_PRESUMIDO';

export interface AjusteFiscalItem {
  descricao: string;
  valor: number;
}

export interface EntradaApuracaoIrpjCsll {
  competencia: string; // YYYY-MM
  regime: RegimeIrpjCsll;
  lucroContabil: number;
  adicoes?: AjusteFiscalItem[];
  exclusoes?: AjusteFiscalItem[];
  saldoPrejuizoFiscalAnterior?: number;
  limiteCompensacaoPercentual?: number; // ex.: 30
}

export interface ResultadoBaseIrpjCsll {
  id: string;
  empresaId: string;
  competencia: string;
  regime: RegimeIrpjCsll;
  lucroContabil: number;
  totalAdicoes: number;
  totalExclusoes: number;
  baseAntesCompensacao: number;
  prejuizoCompensado: number;
  saldoPrejuizoRemanescente: number;
  baseCalculoFinal: number;
  apuradoEm: Date;
}
