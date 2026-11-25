import * as crypto from 'crypto';
import {
  ItemChecklistTarefa,
  PainelObrigacoes,
  PrioridadeTarefa,
  StatusObrigacao,
  TarefaObrigacao,
} from '../models/TarefaObrigacaoModel';

const PRIORIDADES_VALIDAS: PrioridadeTarefa[] = [
  'BAIXA',
  'MEDIA',
  'ALTA',
  'CRITICA',
];
const STATUS_VALIDOS: StatusObrigacao[] = [
  'PENDENTE',
  'EM_PREPARACAO',
  'EM_REVISAO',
  'ENTREGUE',
];
const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Serviço para Tarefas e Painel de Obrigações (SPEC-4.7 / RF-062, RF-065)
 */
export class TarefaObrigacaoService {
  private tarefas: TarefaObrigacao[] = [];

  public criarTarefa(dados: {
    empresaId: string;
    titulo: string;
    responsavel: string;
    prazo: string;
    prioridade: PrioridadeTarefa;
    status?: StatusObrigacao;
    checklist?: ItemChecklistTarefa[];
    anexos?: string[];
  }): TarefaObrigacao {
    if (
      !dados.empresaId?.trim() ||
      !dados.titulo?.trim() ||
      !dados.responsavel?.trim()
    ) {
      throw new Error('empresaId, titulo e responsavel são obrigatórios.');
    }
    if (!REGEX_DATA.test(dados.prazo || '')) {
      throw new Error('prazo deve estar no formato YYYY-MM-DD.');
    }
    if (!PRIORIDADES_VALIDAS.includes(dados.prioridade)) {
      throw new Error('prioridade inválida.');
    }
    const status: StatusObrigacao = dados.status ?? 'PENDENTE';
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error('status inválido.');
    }

    const tarefa: TarefaObrigacao = {
      id: crypto.randomUUID(),
      empresaId: dados.empresaId.trim(),
      titulo: dados.titulo.trim(),
      responsavel: dados.responsavel.trim(),
      prazo: dados.prazo,
      prioridade: dados.prioridade,
      status,
      checklist: (dados.checklist ?? []).map((c) => ({
        descricao: c.descricao.trim(),
        concluido: Boolean(c.concluido),
      })),
      anexos: (dados.anexos ?? []).map((a) => a.trim()).filter(Boolean),
      criadoEm: new Date(),
    };

    this.tarefas.push(tarefa);
    return tarefa;
  }

  public atualizarStatus(
    empresaId: string,
    tarefaId: string,
    status: StatusObrigacao
  ): TarefaObrigacao {
    if (!STATUS_VALIDOS.includes(status)) {
      throw new Error('status inválido.');
    }
    const tarefa = this.tarefas.find(
      (t) => t.empresaId === empresaId.trim() && t.id === tarefaId.trim()
    );
    if (!tarefa) {
      const erro = new Error('Tarefa não encontrada.') as Error & {
        statusCode?: number;
      };
      erro.statusCode = 404;
      throw erro;
    }
    tarefa.status = status;
    return tarefa;
  }

  public obterPainel(
    empresaId: string,
    dataReferencia: string
  ): PainelObrigacoes {
    if (!empresaId?.trim()) {
      throw new Error('empresaId é obrigatório.');
    }
    if (!REGEX_DATA.test(dataReferencia || '')) {
      throw new Error('referencia deve estar no formato YYYY-MM-DD.');
    }

    const lista = this.tarefas.filter((t) => t.empresaId === empresaId.trim());
    const pendentes = lista.filter((t) => t.status === 'PENDENTE');
    const emPreparacao = lista.filter((t) => t.status === 'EM_PREPARACAO');
    const emRevisao = lista.filter((t) => t.status === 'EM_REVISAO');
    const entregues = lista.filter((t) => t.status === 'ENTREGUE');
    const atrasadas = lista.filter(
      (t) => t.status !== 'ENTREGUE' && t.prazo < dataReferencia
    );

    return {
      empresaId: empresaId.trim(),
      dataReferencia,
      resumo: {
        pendentes: pendentes.length,
        emPreparacao: emPreparacao.length,
        emRevisao: emRevisao.length,
        entregues: entregues.length,
        atrasadas: atrasadas.length,
      },
      pendentes,
      emPreparacao,
      emRevisao,
      entregues,
      atrasadas,
    };
  }

  public limpar(): void {
    this.tarefas = [];
  }
}
