/**
 * Modelos de Domínio para Consistência e Regras do Exercício IRPF
 * (SPEC-3.17 / RF-036, RF-041)
 */

export interface ParametrosExercicioIr {
  exercicio: number;
  limiteDeducaoEducacaoPorPessoa: number;
  deducaoPorDependente: number;
  versaoOrientacao: string;
  regraParametrizadaNaoOficial: true;
  atualizadoEm: Date;
}

export interface InconsistenciaIr {
  codigo: string;
  severidade: 'ALTA' | 'MEDIA';
  mensagem: string;
}

export interface EntradaConsistenciaIr {
  exercicio: number;
  totalRendimentosTributaveis: number;
  totalRendimentosIsentos: number;
  totalIrRetido: number;
  despesaEducacaoDeclarada: number;
  quantidadePessoasEducacao: number;
  totalBensAnterior: number;
  totalBensAtual: number;
  totalDividasAnterior: number;
  totalDividasAtual: number;
  dependentesSemDocumento?: number;
}

export interface ResultadoConsistenciaIr {
  fichaId: string;
  exercicio: number;
  versaoOrientacaoUtilizada: string;
  consistente: boolean;
  inconsistencias: InconsistenciaIr[];
  verificadoEm: Date;
}
