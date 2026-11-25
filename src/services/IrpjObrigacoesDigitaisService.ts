import * as crypto from 'crypto';
import {
  MemoriaApuracaoIrpj,
  PacoteObrigacaoDigitalIrpj,
  TipoObrigacaoDigitalIrpj,
} from '../models/IrpjObrigacoesDigitaisModel';

const OBRIGACOES_VALIDAS: TipoObrigacaoDigitalIrpj[] = ['ECF', 'ECD', 'DCTF'];
const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para Memória de Apuração IRPJ/CSLL e Preparação de Obrigações Digitais
 * (SPEC-3.22 / RF-044, RF-045)
 */
export class IrpjObrigacoesDigitaisService {
  private memorias: MemoriaApuracaoIrpj[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  public registrarMemoria(dados: {
    empresaId: string;
    competencia: string;
    tributo: 'IRPJ' | 'CSLL';
    baseCalculo: number;
    aliquotaPercentual: number;
    valorContabilizado: number;
    documentosSuporte?: string[];
  }): MemoriaApuracaoIrpj {
    if (!dados.empresaId?.trim()) {
      throw new Error('empresaId é obrigatório.');
    }
    if (!REGEX_COMPETENCIA.test(dados.competencia || '')) {
      throw new Error('competencia deve estar no formato YYYY-MM.');
    }
    if (dados.tributo !== 'IRPJ' && dados.tributo !== 'CSLL') {
      throw new Error("tributo deve ser 'IRPJ' ou 'CSLL'.");
    }
    if (
      typeof dados.baseCalculo !== 'number' ||
      dados.baseCalculo < 0 ||
      typeof dados.aliquotaPercentual !== 'number' ||
      dados.aliquotaPercentual < 0 ||
      typeof dados.valorContabilizado !== 'number' ||
      dados.valorContabilizado < 0
    ) {
      throw new Error(
        'baseCalculo, aliquotaPercentual e valorContabilizado devem ser >= 0.'
      );
    }

    const valorApurado = this.arredondar(
      dados.baseCalculo * (dados.aliquotaPercentual / 100)
    );
    const valorContabilizado = this.arredondar(dados.valorContabilizado);
    const diferencaContabil = this.arredondar(
      Math.abs(valorApurado - valorContabilizado)
    );

    const memoria: MemoriaApuracaoIrpj = {
      id: crypto.randomUUID(),
      empresaId: dados.empresaId.trim(),
      competencia: dados.competencia,
      tributo: dados.tributo,
      baseCalculo: this.arredondar(dados.baseCalculo),
      aliquotaPercentual: this.arredondar(dados.aliquotaPercentual),
      valorApurado,
      valorContabilizado,
      diferencaContabil,
      conciliado: diferencaContabil === 0,
      documentosSuporte: (dados.documentosSuporte ?? [])
        .map((d) => d.trim())
        .filter(Boolean),
      criadoEm: new Date(),
    };

    this.memorias.push(memoria);
    return memoria;
  }

  public listarMemorias(empresaId: string): MemoriaApuracaoIrpj[] {
    return this.memorias.filter((m) => m.empresaId === empresaId.trim());
  }

  public prepararObrigacaoDigital(dados: {
    empresaId: string;
    obrigacao: TipoObrigacaoDigitalIrpj;
    exercicio: number;
    leiauteVersao: string;
  }): PacoteObrigacaoDigitalIrpj {
    if (!dados.empresaId?.trim() || !dados.leiauteVersao?.trim()) {
      throw new Error('empresaId e leiauteVersao são obrigatórios.');
    }
    if (!OBRIGACOES_VALIDAS.includes(dados.obrigacao)) {
      throw new Error("obrigacao deve ser 'ECF', 'ECD' ou 'DCTF'.");
    }
    if (
      !Number.isInteger(dados.exercicio) ||
      dados.exercicio < 2000 ||
      dados.exercicio > 2100
    ) {
      throw new Error('exercicio inválido.');
    }

    const prefixoAno = `${dados.exercicio}-`;
    const memoriasAno = this.memorias.filter(
      (m) =>
        m.empresaId === dados.empresaId.trim() &&
        m.competencia.startsWith(prefixoAno)
    );

    const bloco =
      dados.obrigacao === 'ECF'
        ? 'BLOCO_N'
        : dados.obrigacao === 'ECD'
          ? 'BLOCO_I'
          : 'REG_DCTF';

    const registros = memoriasAno.map((m) => ({
      bloco,
      competencia: m.competencia,
      tributo: m.tributo,
      baseCalculo: m.baseCalculo,
      valorApurado: m.valorApurado,
      conciliado: m.conciliado,
    }));

    return {
      id: crypto.randomUUID(),
      empresaId: dados.empresaId.trim(),
      obrigacao: dados.obrigacao,
      exercicio: dados.exercicio,
      leiauteVersao: dados.leiauteVersao.trim(),
      quantidadeRegistros: registros.length,
      registros,
      avisoPreparacao:
        'Pacote estruturado de preparação para conferência (não transmite automaticamente ao ambiente oficial).',
      geradoEm: new Date(),
    };
  }

  public limpar(): void {
    this.memorias = [];
  }
}
