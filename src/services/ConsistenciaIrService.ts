import {
  EntradaConsistenciaIr,
  InconsistenciaIr,
  ParametrosExercicioIr,
  ResultadoConsistenciaIr,
} from '../models/ConsistenciaIrModel';

/**
 * Serviço para parametrização por exercício e conferência de consistência IRPF
 * (SPEC-3.17 / RF-036, RF-041)
 */
export class ConsistenciaIrService {
  private parametrosPorExercicio = new Map<number, ParametrosExercicioIr>();

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  private validarNaoNegativo(valor: number, campo: string): void {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw this.criarErro(
        `${campo} deve ser um número maior ou igual a zero.`,
        400
      );
    }
  }

  /**
   * Cadastra ou atualiza parâmetros de um exercício fiscal (CA-1 / RF-041)
   */
  public cadastrarParametrosExercicio(dados: {
    exercicio: number;
    limiteDeducaoEducacaoPorPessoa: number;
    deducaoPorDependente: number;
    versaoOrientacao: string;
  }): ParametrosExercicioIr {
    if (
      !Number.isInteger(dados.exercicio) ||
      dados.exercicio < 2000 ||
      dados.exercicio > 2100
    ) {
      throw this.criarErro('exercicio deve ser um ano fiscal válido.', 400);
    }
    this.validarNaoNegativo(
      dados.limiteDeducaoEducacaoPorPessoa,
      'limiteDeducaoEducacaoPorPessoa'
    );
    this.validarNaoNegativo(
      dados.deducaoPorDependente,
      'deducaoPorDependente'
    );
    if (!dados.versaoOrientacao?.trim()) {
      throw this.criarErro('versaoOrientacao é obrigatória.', 400);
    }

    const param: ParametrosExercicioIr = {
      exercicio: dados.exercicio,
      limiteDeducaoEducacaoPorPessoa: dados.limiteDeducaoEducacaoPorPessoa,
      deducaoPorDependente: dados.deducaoPorDependente,
      versaoOrientacao: dados.versaoOrientacao.trim(),
      regraParametrizadaNaoOficial: true,
      atualizadoEm: new Date(),
    };
    this.parametrosPorExercicio.set(dados.exercicio, param);
    return param;
  }

  /**
   * Confere consistência da declaração usando exclusivamente regras do exercício (CA-1 a CA-3)
   */
  public conferirConsistencia(
    fichaId: string,
    entrada: EntradaConsistenciaIr
  ): ResultadoConsistenciaIr {
    if (!fichaId?.trim()) {
      throw this.criarErro('fichaId é obrigatório.', 400);
    }

    const regra = this.parametrosPorExercicio.get(entrada.exercicio);
    if (!regra) {
      throw this.criarErro(
        `Nenhuma regra/orientação parametrizada para o exercício ${entrada.exercicio} (RF-041).`,
        404
      );
    }

    this.validarNaoNegativo(
      entrada.totalRendimentosTributaveis,
      'totalRendimentosTributaveis'
    );
    this.validarNaoNegativo(
      entrada.totalRendimentosIsentos,
      'totalRendimentosIsentos'
    );
    this.validarNaoNegativo(entrada.totalIrRetido, 'totalIrRetido');
    this.validarNaoNegativo(
      entrada.despesaEducacaoDeclarada,
      'despesaEducacaoDeclarada'
    );
    this.validarNaoNegativo(
      entrada.quantidadePessoasEducacao,
      'quantidadePessoasEducacao'
    );
    this.validarNaoNegativo(entrada.totalBensAnterior, 'totalBensAnterior');
    this.validarNaoNegativo(entrada.totalBensAtual, 'totalBensAtual');
    this.validarNaoNegativo(
      entrada.totalDividasAnterior,
      'totalDividasAnterior'
    );
    this.validarNaoNegativo(entrada.totalDividasAtual, 'totalDividasAtual');

    const inconsistencias: InconsistenciaIr[] = [];

    if (entrada.totalIrRetido > entrada.totalRendimentosTributaveis) {
      inconsistencias.push({
        codigo: 'IR_RETIDO_MAIOR_QUE_RENDIMENTO',
        severidade: 'ALTA',
        mensagem:
          'O imposto retido informado excede o total de rendimentos tributáveis.',
      });
    }

    const aumentoPatrimonial =
      entrada.totalBensAtual - entrada.totalBensAnterior;
    const aumentoDividas = Math.max(
      0,
      entrada.totalDividasAtual - entrada.totalDividasAnterior
    );
    const recursosDisponiveis =
      entrada.totalRendimentosTributaveis +
      entrada.totalRendimentosIsentos +
      aumentoDividas;

    if (aumentoPatrimonial > recursosDisponiveis) {
      inconsistencias.push({
        codigo: 'EVOLUCAO_PATRIMONIAL_DESCOBERTA',
        severidade: 'ALTA',
        mensagem:
          'A variação patrimonial positiva supera os rendimentos e dívidas informados no exercício.',
      });
    }

    const limiteEducacaoTotal =
      regra.limiteDeducaoEducacaoPorPessoa *
      Math.max(1, entrada.quantidadePessoasEducacao);
    if (entrada.despesaEducacaoDeclarada > limiteEducacaoTotal) {
      inconsistencias.push({
        codigo: 'DEDUCAO_EDUCACAO_ACIMA_DO_LIMITE',
        severidade: 'MEDIA',
        mensagem: `Despesa com educação (${entrada.despesaEducacaoDeclarada.toFixed(2)}) excede o limite parametrizado do exercício (${limiteEducacaoTotal.toFixed(2)}).`,
      });
    }

    if ((entrada.dependentesSemDocumento ?? 0) > 0) {
      inconsistencias.push({
        codigo: 'DEPENDENTE_SEM_DOCUMENTO',
        severidade: 'ALTA',
        mensagem:
          'Existem dependentes sem documento identificador informado na declaração.',
      });
    }

    return {
      fichaId: fichaId.trim(),
      exercicio: entrada.exercicio,
      versaoOrientacaoUtilizada: regra.versaoOrientacao,
      consistente: inconsistencias.length === 0,
      inconsistencias,
      verificadoEm: new Date(),
    };
  }

  public limpar(): void {
    this.parametrosPorExercicio.clear();
  }
}
