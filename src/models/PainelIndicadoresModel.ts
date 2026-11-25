/**
 * Modelos de Domínio para Painéis de Indicadores (SPEC-5.2 / RF-072)
 */

export interface RegistroIndicadorBase {
  empresaId: string;
  periodo: string; // YYYY-MM
  faturamento: number;
  inadimplencia: number;
  fechamentosConcluidos: number;
  fechamentosPendentes: number;
  tarefasConcluidas: number;
  tarefasPendentes: number;
  obrigacoesEntregues: number;
  obrigacoesAtrasadas: number;
}

export interface PainelIndicadoresConsolidado {
  empresaId: string;
  periodo?: string;
  estadoVazio: boolean;
  mensagem?: string;
  indicadores: {
    tarefas: { concluidas: number; pendentes: number };
    faturamento: { total: number; unidade: 'BRL' };
    inadimplencia: { total: number; unidade: 'BRL' };
    obrigacoes: { entregues: number; atrasadas: number };
    fechamentos: { concluidos: number; pendentes: number };
    produtividade: { taxaConclusaoTarefasPercentual: number };
  };
  avisoDemonstracao: string;
}
