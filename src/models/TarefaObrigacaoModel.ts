/**
 * Modelos de Domínio para Tarefas e Painel de Obrigações (SPEC-4.7 / RF-062, RF-065)
 */

export type PrioridadeTarefa = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type StatusObrigacao =
  | 'PENDENTE'
  | 'EM_PREPARACAO'
  | 'EM_REVISAO'
  | 'ENTREGUE';

export interface ItemChecklistTarefa {
  descricao: string;
  concluido: boolean;
}

export interface TarefaObrigacao {
  id: string;
  empresaId: string;
  titulo: string;
  responsavel: string;
  prazo: string; // YYYY-MM-DD
  prioridade: PrioridadeTarefa;
  status: StatusObrigacao;
  checklist: ItemChecklistTarefa[];
  anexos: string[];
  criadoEm: Date;
}

export interface PainelObrigacoes {
  empresaId: string;
  dataReferencia: string;
  resumo: {
    pendentes: number;
    emPreparacao: number;
    emRevisao: number;
    entregues: number;
    atrasadas: number;
  };
  pendentes: TarefaObrigacao[];
  emPreparacao: TarefaObrigacao[];
  emRevisao: TarefaObrigacao[];
  entregues: TarefaObrigacao[];
  atrasadas: TarefaObrigacao[];
}
