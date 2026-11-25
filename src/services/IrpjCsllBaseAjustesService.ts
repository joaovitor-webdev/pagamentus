import * as crypto from 'crypto';
import {
  AjusteFiscalItem,
  EntradaApuracaoIrpjCsll,
  ResultadoBaseIrpjCsll,
} from '../models/IrpjCsllBaseAjustesModel';

const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para apuração de base e ajustes de IRPJ/CSLL (SPEC-3.21 / RF-042, RF-043)
 */
export class IrpjCsllBaseAjustesService {
  private historico: ResultadoBaseIrpjCsll[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private somarAjustes(itens: AjusteFiscalItem[], campo: string): number {
    let total = 0;
    for (const item of itens) {
      if (
        !item.descricao?.trim() ||
        typeof item.valor !== 'number' ||
        !Number.isFinite(item.valor) ||
        item.valor < 0
      ) {
        throw new Error(`Item inválido em ${campo}.`);
      }
      total = this.arredondar(total + item.valor);
    }
    return total;
  }

  public apurarBase(
    empresaId: string,
    entrada: EntradaApuracaoIrpjCsll
  ): ResultadoBaseIrpjCsll {
    if (!empresaId?.trim()) {
      throw new Error('empresaId é obrigatório.');
    }
    if (!REGEX_COMPETENCIA.test(entrada.competencia || '')) {
      throw new Error('competencia deve estar no formato YYYY-MM.');
    }
    if (
      entrada.regime !== 'LUCRO_REAL' &&
      entrada.regime !== 'LUCRO_PRESUMIDO'
    ) {
      throw new Error("regime deve ser 'LUCRO_REAL' ou 'LUCRO_PRESUMIDO'.");
    }
    if (
      typeof entrada.lucroContabil !== 'number' ||
      !Number.isFinite(entrada.lucroContabil)
    ) {
      throw new Error('lucroContabil deve ser um número válido.');
    }

    const totalAdicoes = this.somarAjustes(entrada.adicoes ?? [], 'adicoes');
    const totalExclusoes = this.somarAjustes(
      entrada.exclusoes ?? [],
      'exclusoes'
    );

    const saldoPrejuizoAnterior = entrada.saldoPrejuizoFiscalAnterior ?? 0;
    const limitePct = entrada.limiteCompensacaoPercentual ?? 30;
    if (saldoPrejuizoAnterior < 0 || limitePct < 0 || limitePct > 100) {
      throw new Error(
        'saldoPrejuizoFiscalAnterior e limiteCompensacaoPercentual inválidos.'
      );
    }

    const baseAntesCompensacao = this.arredondar(
      entrada.lucroContabil + totalAdicoes - totalExclusoes
    );

    let prejuizoCompensado = 0;
    if (
      entrada.regime === 'LUCRO_REAL' &&
      baseAntesCompensacao > 0 &&
      saldoPrejuizoAnterior > 0
    ) {
      const tetoCompensacao = this.arredondar(
        baseAntesCompensacao * (limitePct / 100)
      );
      prejuizoCompensado = this.arredondar(
        Math.min(saldoPrejuizoAnterior, tetoCompensacao)
      );
    }

    const saldoPrejuizoRemanescente = this.arredondar(
      saldoPrejuizoAnterior - prejuizoCompensado
    );
    const baseCalculoFinal = this.arredondar(
      Math.max(0, baseAntesCompensacao - prejuizoCompensado)
    );

    const resultado: ResultadoBaseIrpjCsll = {
      id: crypto.randomUUID(),
      empresaId: empresaId.trim(),
      competencia: entrada.competencia,
      regime: entrada.regime,
      lucroContabil: this.arredondar(entrada.lucroContabil),
      totalAdicoes,
      totalExclusoes,
      baseAntesCompensacao,
      prejuizoCompensado,
      saldoPrejuizoRemanescente,
      baseCalculoFinal,
      apuradoEm: new Date(),
    };

    this.historico.push(resultado);
    return resultado;
  }

  public listar(empresaId: string): ResultadoBaseIrpjCsll[] {
    return this.historico.filter((h) => h.empresaId === empresaId.trim());
  }

  public limpar(): void {
    this.historico = [];
  }
}
