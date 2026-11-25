import {
  EntradaComparacaoIr,
  EstimativaOpcaoIr,
  ModalidadeTributacaoIr,
  ResultadoComparacaoIr,
} from '../models/ComparacaoTributacaoIrModel';

/**
 * Serviço para comparação entre tributação Completa e Simplificada IRPF
 * (SPEC-3.18 / RF-037)
 */
export class ComparacaoTributacaoIrService {
  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private validarNaoNegativo(valor: number, campo: string): void {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) {
      throw new Error(`${campo} deve ser um número maior ou igual a zero.`);
    }
  }

  private calcularOpcao(
    modalidade: ModalidadeTributacaoIr,
    rendimentos: number,
    deducao: number,
    irRetido: number,
    aliquota: number
  ): EstimativaOpcaoIr {
    const base = this.arredondar(Math.max(0, rendimentos - deducao));
    const imposto = this.arredondar(base * (aliquota / 100));
    const saldoAPagar = this.arredondar(Math.max(0, imposto - irRetido));
    const saldoARestituir = this.arredondar(Math.max(0, irRetido - imposto));

    return {
      modalidade,
      deducaoAplicada: this.arredondar(deducao),
      baseCalculoEstimada: base,
      impostoDevidoEstimado: imposto,
      saldoAPagar,
      saldoARestituir,
    };
  }

  public comparar(
    fichaId: string,
    entrada: EntradaComparacaoIr
  ): ResultadoComparacaoIr {
    if (!fichaId?.trim()) {
      throw new Error('fichaId é obrigatório.');
    }
    if (
      !Number.isInteger(entrada.exercicio) ||
      entrada.exercicio < 2000 ||
      entrada.exercicio > 2100
    ) {
      throw new Error('exercicio deve ser um ano fiscal válido.');
    }

    this.validarNaoNegativo(
      entrada.rendimentosTributaveis,
      'rendimentosTributaveis'
    );
    this.validarNaoNegativo(entrada.deducoesLegais, 'deducoesLegais');
    this.validarNaoNegativo(entrada.irRetido, 'irRetido');
    this.validarNaoNegativo(
      entrada.percentualDescontoSimplificado,
      'percentualDescontoSimplificado'
    );
    this.validarNaoNegativo(
      entrada.tetoDescontoSimplificado,
      'tetoDescontoSimplificado'
    );
    this.validarNaoNegativo(
      entrada.aliquotaEfetivaEstimada,
      'aliquotaEfetivaEstimada'
    );

    const descontoSimplificado = Math.min(
      this.arredondar(
        entrada.rendimentosTributaveis *
          (entrada.percentualDescontoSimplificado / 100)
      ),
      this.arredondar(entrada.tetoDescontoSimplificado)
    );

    const completa = this.calcularOpcao(
      'COMPLETA',
      entrada.rendimentosTributaveis,
      entrada.deducoesLegais,
      entrada.irRetido,
      entrada.aliquotaEfetivaEstimada
    );

    const simplificada = this.calcularOpcao(
      'SIMPLIFICADA',
      entrada.rendimentosTributaveis,
      descontoSimplificado,
      entrada.irRetido,
      entrada.aliquotaEfetivaEstimada
    );

    const opcaoRecomendada: ModalidadeTributacaoIr =
      completa.impostoDevidoEstimado <= simplificada.impostoDevidoEstimado
        ? 'COMPLETA'
        : 'SIMPLIFICADA';

    const economiaEstimada = this.arredondar(
      Math.abs(
        completa.impostoDevidoEstimado - simplificada.impostoDevidoEstimado
      )
    );

    return {
      fichaId: fichaId.trim(),
      exercicio: entrada.exercicio,
      opcoes: [completa, simplificada],
      opcaoRecomendada,
      economiaEstimada,
      premissas: [
        `Desconto simplificado de ${entrada.percentualDescontoSimplificado}% limitado ao teto parametrizado de ${entrada.tetoDescontoSimplificado.toFixed(2)}.`,
        `Alíquota efetiva parametrizada de ${entrada.aliquotaEfetivaEstimada}% sobre a base de cálculo estimada.`,
      ],
      avisoEstimativa:
        'Comparação estimativa baseada em parâmetros de demonstração do exercício (não substitui o PGD oficial da RFB).',
    };
  }
}
