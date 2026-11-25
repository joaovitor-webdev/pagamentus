/**
 * Modelos de Domínio para Comparação de Opções de Tributação IRPF
 * (SPEC-3.18 / RF-037)
 */

export type ModalidadeTributacaoIr = 'COMPLETA' | 'SIMPLIFICADA';

export interface EntradaComparacaoIr {
  exercicio: number;
  rendimentosTributaveis: number;
  deducoesLegais: number;
  irRetido: number;
  percentualDescontoSimplificado: number; // ex.: 20
  tetoDescontoSimplificado: number; // ex.: 16754.34
  aliquotaEfetivaEstimada: number; // ex.: 15
}

export interface EstimativaOpcaoIr {
  modalidade: ModalidadeTributacaoIr;
  deducaoAplicada: number;
  baseCalculoEstimada: number;
  impostoDevidoEstimado: number;
  saldoAPagar: number;
  saldoARestituir: number;
}

export interface ResultadoComparacaoIr {
  fichaId: string;
  exercicio: number;
  opcoes: EstimativaOpcaoIr[];
  opcaoRecomendada: ModalidadeTributacaoIr;
  economiaEstimada: number;
  premissas: string[];
  avisoEstimativa: string;
}
