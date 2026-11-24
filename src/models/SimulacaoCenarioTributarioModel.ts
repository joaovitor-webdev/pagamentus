import { EnquadramentoTributario } from './RegimeTributarioEmpresaModel';

/**
 * Modelos de Domínio para Simulação de Cenários Tributários (SPEC-3.11 / RF-028)
 */

export type TipoBaseSimulacao = 'RECEITA_BRUTA' | 'LUCRO_LIQUIDO';

export interface CenarioSimulacaoEntrada {
  nome: string;
  regime: EnquadramentoTributario;
  tipoBase: TipoBaseSimulacao;
  aliquotaEfetivaPercentual: number;
  premissas?: string[];
}

export interface EntradaSimulacaoTributaria {
  competencia: string; // YYYY-MM
  receitaBruta: number;
  despesasDedutiveis?: number;
  cenarios: CenarioSimulacaoEntrada[];
}

export interface ResultadoCenarioSimulado {
  nome: string;
  regime: EnquadramentoTributario;
  tipoBase: TipoBaseSimulacao;
  baseCalculo: number;
  aliquotaEfetivaPercentual: number;
  impostoEstimado: number;
  cargaEfetivaSobreReceitaPercentual: number;
  premissas: string[];
  memoriaCalculo: string;
}

export interface ResultadoSimulacaoTributaria {
  id: string;
  empresaId: string;
  competencia: string;
  receitaBruta: number;
  despesasDedutiveis: number;
  cenarios: ResultadoCenarioSimulado[];
  cenarioMaisEconomico: string;
  limitacoes: string[];
  simuladoEm: Date;
}
