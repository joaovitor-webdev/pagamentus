import { randomUUID } from 'crypto';

export interface OperacaoLongaProgresso {
  id: string;
  tipo: 'CALCULO_TRIBUTARIO_COMPLEXO' | 'RELATORIO_CONSOLIDADO' | 'FECHAMENTO_EXERCICIO';
  status: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'FALHA';
  percentualConcluido: number;
  etapaAtual: string;
  totalEtapas: number;
  iniciadoEm: string;
  finalizadoEm?: string;
  resultado?: Record<string, unknown>;
}

export interface MetricasDesempenhoCarga {
  cenario: string;
  totalRequisicoes: number;
  duracaoTotalMs: number;
  mediaMs: number;
  minimoMs: number;
  maximoMs: number;
  percentil95Ms: number;
  percentil99Ms: number;
  taxaSucessoPercentual: number;
  metaSlaAtingida: boolean; // se p95 <= 3000ms (3 segundos) conforme RNF-006
}

export class DesempenhoCargaService {
  private readonly operacoesLongas = new Map<string, OperacaoLongaProgresso>();

  public iniciarOperacaoLonga(
    tipo: OperacaoLongaProgresso['tipo'],
    totalEtapas = 4
  ): OperacaoLongaProgresso {
    const id = randomUUID();
    const op: OperacaoLongaProgresso = {
      id,
      tipo,
      status: 'PROCESSANDO',
      percentualConcluido: 0,
      etapaAtual: 'Iniciando processamento e leitura dos dados',
      totalEtapas,
      iniciadoEm: new Date().toISOString(),
    };
    this.operacoesLongas.set(id, op);
    return op;
  }

  public atualizarProgresso(
    id: string,
    etapaIndex: number,
    etapaDescricao: string
  ): OperacaoLongaProgresso {
    const op = this.operacoesLongas.get(id);
    if (!op) {
      throw new Error(`Operação com ID "${id}" não encontrada.`);
    }

    op.etapaAtual = etapaDescricao;
    op.percentualConcluido = Math.min(100, Math.round((etapaIndex / op.totalEtapas) * 100));

    if (op.percentualConcluido >= 100) {
      op.status = 'CONCLUIDO';
      op.finalizadoEm = new Date().toISOString();
      op.resultado = { mensagem: 'Operação concluída com sucesso sob conformidade com RNF-006' };
    }

    return op;
  }

  public consultarProgresso(id: string): OperacaoLongaProgresso | null {
    return this.operacoesLongas.get(id) ?? null;
  }

  public calcularMetricasCarga(
    temposMs: number[],
    cenario = 'Carga acordada em telas e rotas comuns'
  ): MetricasDesempenhoCarga {
    if (temposMs.length === 0) {
      return {
        cenario,
        totalRequisicoes: 0,
        duracaoTotalMs: 0,
        mediaMs: 0,
        minimoMs: 0,
        maximoMs: 0,
        percentil95Ms: 0,
        percentil99Ms: 0,
        taxaSucessoPercentual: 100,
        metaSlaAtingida: true,
      };
    }

    const ordenados = [...temposMs].sort((a, b) => a - b);
    const total = ordenados.length;
    const duracaoTotal = ordenados.reduce((acc, t) => acc + t, 0);
    const media = Math.round(duracaoTotal / total);
    const minimo = ordenados[0];
    const maximo = ordenados[total - 1];

    const idxP95 = Math.min(total - 1, Math.floor(total * 0.95));
    const idxP99 = Math.min(total - 1, Math.floor(total * 0.99));
    const percentil95Ms = ordenados[idxP95];
    const percentil99Ms = ordenados[idxP99];

    // Meta RNF-006: 95% das operações em até 3000ms (3 segundos)
    const metaSlaAtingida = percentil95Ms <= 3000;

    return {
      cenario,
      totalRequisicoes: total,
      duracaoTotalMs: duracaoTotal,
      mediaMs: media,
      minimoMs: minimo,
      maximoMs: maximo,
      percentil95Ms,
      percentil99Ms,
      taxaSucessoPercentual: 100,
      metaSlaAtingida,
    };
  }
}
