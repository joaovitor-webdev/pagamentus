import * as crypto from 'crypto';
import {
  EntradaSimulacaoTributaria,
  ResultadoCenarioSimulado,
  ResultadoSimulacaoTributaria,
} from '../models/SimulacaoCenarioTributarioModel';

const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para simulação comparativa de cenários tributários (SPEC-3.11 / RF-028)
 */
export class SimulacaoCenarioTributarioService {
  private historico: ResultadoSimulacaoTributaria[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  /**
   * Executa simulação de cenários apresentando premissas, limitações e memória de cálculo (CA-1 a CA-3)
   */
  public simular(
    empresaId: string,
    entrada: EntradaSimulacaoTributaria
  ): ResultadoSimulacaoTributaria {
    if (!empresaId?.trim()) {
      throw new Error('O identificador da empresa é obrigatório.');
    }
    if (!REGEX_COMPETENCIA.test(entrada.competencia || '')) {
      throw new Error('competencia deve estar no formato YYYY-MM.');
    }
    if (
      typeof entrada.receitaBruta !== 'number' ||
      !Number.isFinite(entrada.receitaBruta) ||
      entrada.receitaBruta <= 0
    ) {
      throw new Error('receitaBruta deve ser maior que zero.');
    }

    const despesas = entrada.despesasDedutiveis ?? 0;
    if (
      typeof despesas !== 'number' ||
      !Number.isFinite(despesas) ||
      despesas < 0
    ) {
      throw new Error('despesasDedutiveis não pode ser negativa.');
    }

    if (!Array.isArray(entrada.cenarios) || entrada.cenarios.length === 0) {
      throw new Error('Informe ao menos um cenário para simulação.');
    }

    const receitaArr = this.arredondar(entrada.receitaBruta);
    const despesasArr = this.arredondar(despesas);

    const resultados: ResultadoCenarioSimulado[] = entrada.cenarios.map(
      (cenario) => {
        if (!cenario.nome?.trim()) {
          throw new Error('Cada cenário deve possuir um nome.');
        }
        if (
          cenario.tipoBase !== 'RECEITA_BRUTA' &&
          cenario.tipoBase !== 'LUCRO_LIQUIDO'
        ) {
          throw new Error(
            "tipoBase deve ser 'RECEITA_BRUTA' ou 'LUCRO_LIQUIDO'."
          );
        }
        if (
          typeof cenario.aliquotaEfetivaPercentual !== 'number' ||
          !Number.isFinite(cenario.aliquotaEfetivaPercentual) ||
          cenario.aliquotaEfetivaPercentual < 0 ||
          cenario.aliquotaEfetivaPercentual > 100
        ) {
          throw new Error(
            'aliquotaEfetivaPercentual deve estar entre 0 e 100.'
          );
        }

        const baseCalculo =
          cenario.tipoBase === 'RECEITA_BRUTA'
            ? receitaArr
            : this.arredondar(Math.max(0, receitaArr - despesasArr));

        const impostoEstimado = this.arredondar(
          baseCalculo * (cenario.aliquotaEfetivaPercentual / 100)
        );
        const cargaEfetiva = this.arredondar(
          (impostoEstimado / receitaArr) * 100
        );

        const premissas =
          cenario.premissas && cenario.premissas.length > 0
            ? cenario.premissas
            : [
                `Base de cálculo sobre ${cenario.tipoBase === 'RECEITA_BRUTA' ? 'receita bruta' : 'lucro líquido estimado'}`,
                `Alíquota efetiva parametrizada de ${cenario.aliquotaEfetivaPercentual.toFixed(2)}%`,
              ];

        const memoriaCalculo =
          cenario.tipoBase === 'RECEITA_BRUTA'
            ? `Base (${baseCalculo.toFixed(2)}) * Alíquota (${cenario.aliquotaEfetivaPercentual.toFixed(2)}%) = ${impostoEstimado.toFixed(2)}`
            : `Base = max(0, Receita ${receitaArr.toFixed(2)} - Despesas ${despesasArr.toFixed(2)}) = ${baseCalculo.toFixed(2)}; Imposto = ${baseCalculo.toFixed(2)} * ${cenario.aliquotaEfetivaPercentual.toFixed(2)}% = ${impostoEstimado.toFixed(2)}`;

        return {
          nome: cenario.nome.trim(),
          regime: cenario.regime,
          tipoBase: cenario.tipoBase,
          baseCalculo,
          aliquotaEfetivaPercentual: this.arredondar(
            cenario.aliquotaEfetivaPercentual
          ),
          impostoEstimado,
          cargaEfetivaSobreReceitaPercentual: cargaEfetiva,
          premissas,
          memoriaCalculo,
        };
      }
    );

    const maisEconomico = [...resultados].sort(
      (a, b) => a.impostoEstimado - b.impostoEstimado
    )[0];

    const simulacao: ResultadoSimulacaoTributaria = {
      id: crypto.randomUUID(),
      empresaId: empresaId.trim(),
      competencia: entrada.competencia,
      receitaBruta: receitaArr,
      despesasDedutiveis: despesasArr,
      cenarios: resultados,
      cenarioMaisEconomico: maisEconomico.nome,
      limitacoes: [
        'Simulação estimativa baseada em parâmetros informados (não oficial).',
        'Não substitui análise de profissional contábil nem contempla regimes especiais não parametrizados.',
      ],
      simuladoEm: new Date(),
    };

    this.historico.push(simulacao);
    return simulacao;
  }

  public listarHistorico(empresaId: string): ResultadoSimulacaoTributaria[] {
    if (!empresaId?.trim()) {
      throw new Error('O identificador da empresa é obrigatório.');
    }
    return this.historico.filter((s) => s.empresaId === empresaId.trim());
  }

  public limpar(): void {
    this.historico = [];
  }
}
