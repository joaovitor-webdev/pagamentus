import {
  PainelIndicadoresConsolidado,
  RegistroIndicadorBase,
} from '../models/PainelIndicadoresModel';

const PERFIS_AUTORIZADOS = new Set(['ADMIN', 'GESTOR', 'CONTADOR']);

/**
 * Serviço de leitura consolidada para Painéis de Indicadores (SPEC-5.2 / RF-072)
 */
export class PainelIndicadoresService {
  private registros: RegistroIndicadorBase[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  public registrarBaseIndicadores(dados: RegistroIndicadorBase): RegistroIndicadorBase {
    if (!dados.empresaId?.trim() || !/^\d{4}-\d{2}$/.test(dados.periodo || '')) {
      throw new Error('empresaId e periodo (YYYY-MM) são obrigatórios.');
    }
    const item: RegistroIndicadorBase = {
      ...dados,
      empresaId: dados.empresaId.trim(),
    };
    this.registros.push(item);
    return item;
  }

  public obterPainel(
    empresaId: string,
    perfilAcesso: string,
    periodo?: string
  ): PainelIndicadoresConsolidado {
    const perfilNorm = (perfilAcesso || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      const erro = new Error(
        'Acesso negado: perfil sem permissão para visualizar painéis de indicadores.'
      ) as Error & { statusCode?: number };
      erro.statusCode = 403;
      throw erro;
    }

    const filtrados = this.registros.filter(
      (r) =>
        r.empresaId === empresaId.trim() &&
        (!periodo || r.periodo === periodo.trim())
    );

    if (filtrados.length === 0) {
      return {
        empresaId: empresaId.trim(),
        periodo,
        estadoVazio: true,
        mensagem:
          'Nenhum dado disponível para os filtros informados (estado vazio sem valores inventados).',
        indicadores: {
          tarefas: { concluidas: 0, pendentes: 0 },
          faturamento: { total: 0, unidade: 'BRL' },
          inadimplencia: { total: 0, unidade: 'BRL' },
          obrigacoes: { entregues: 0, atrasadas: 0 },
          fechamentos: { concluidos: 0, pendentes: 0 },
          produtividade: { taxaConclusaoTarefasPercentual: 0 },
        },
        avisoDemonstracao: 'Indicadores consolidados a partir de dados cadastrados.',
      };
    }

    const tarefasConcluidas = filtrados.reduce(
      (a, r) => a + r.tarefasConcluidas,
      0
    );
    const tarefasPendentes = filtrados.reduce(
      (a, r) => a + r.tarefasPendentes,
      0
    );
    const totalTarefas = tarefasConcluidas + tarefasPendentes;
    const taxaConclusao =
      totalTarefas > 0
        ? this.arredondar((tarefasConcluidas / totalTarefas) * 100)
        : 0;

    return {
      empresaId: empresaId.trim(),
      periodo,
      estadoVazio: false,
      indicadores: {
        tarefas: { concluidas: tarefasConcluidas, pendentes: tarefasPendentes },
        faturamento: {
          total: this.arredondar(
            filtrados.reduce((a, r) => a + r.faturamento, 0)
          ),
          unidade: 'BRL',
        },
        inadimplencia: {
          total: this.arredondar(
            filtrados.reduce((a, r) => a + r.inadimplencia, 0)
          ),
          unidade: 'BRL',
        },
        obrigacoes: {
          entregues: filtrados.reduce((a, r) => a + r.obrigacoesEntregues, 0),
          atrasadas: filtrados.reduce((a, r) => a + r.obrigacoesAtrasadas, 0),
        },
        fechamentos: {
          concluidos: filtrados.reduce(
            (a, r) => a + r.fechamentosConcluidos,
            0
          ),
          pendentes: filtrados.reduce((a, r) => a + r.fechamentosPendentes, 0),
        },
        produtividade: {
          taxaConclusaoTarefasPercentual: taxaConclusao,
        },
      },
      avisoDemonstracao: 'Indicadores consolidados a partir de dados cadastrados.',
    };
  }

  public limpar(): void {
    this.registros = [];
  }
}
