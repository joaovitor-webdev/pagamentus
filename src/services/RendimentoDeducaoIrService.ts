import * as crypto from 'crypto';
import {
  CategoriaDeducaoIr,
  CategoriaRendimentoIr,
  DeducaoIr,
  RendimentoIr,
  ResumoRendimentosDeducoesIr,
} from '../models/RendimentoDeducaoIrModel';

const CATEGORIAS_RENDIMENTO: CategoriaRendimentoIr[] = [
  'TRIBUTAVEL',
  'ISENTO_NAO_TRIBUTAVEL',
  'TRIBUTACAO_EXCLUSIVA',
  'RRA',
  'EXTERIOR',
];

const CATEGORIAS_DEDUCAO: CategoriaDeducaoIr[] = [
  'CONTRIBUICAO',
  'PREVIDENCIA',
  'MEDICA',
  'EDUCACAO',
  'PENSAO',
  'DOACAO',
  'OUTRO_PAGAMENTO',
];

/**
 * Serviço para Rendimentos e Deduções IRPF (SPEC-3.14 / RF-031, RF-033)
 */
export class RendimentoDeducaoIrService {
  private rendimentos: RendimentoIr[] = [];
  private deducoes: DeducaoIr[] = [];

  private arredondar(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  public registrarRendimento(dados: {
    fichaId: string;
    categoria: CategoriaRendimentoIr;
    fontePagadora: string;
    descricao: string;
    valor: number;
    irRetido?: number;
  }): RendimentoIr {
    if (
      !dados.fichaId?.trim() ||
      !dados.fontePagadora?.trim() ||
      !dados.descricao?.trim()
    ) {
      throw new Error('fichaId, fontePagadora e descricao são obrigatórios.');
    }
    if (!CATEGORIAS_RENDIMENTO.includes(dados.categoria)) {
      throw new Error('Categoria de rendimento inválida.');
    }
    if (
      typeof dados.valor !== 'number' ||
      !Number.isFinite(dados.valor) ||
      dados.valor <= 0
    ) {
      throw new Error('valor do rendimento deve ser maior que zero.');
    }
    const irRetido = dados.irRetido ?? 0;
    if (typeof irRetido !== 'number' || !Number.isFinite(irRetido) || irRetido < 0) {
      throw new Error('irRetido não pode ser negativo.');
    }

    const item: RendimentoIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      categoria: dados.categoria,
      fontePagadora: dados.fontePagadora.trim(),
      descricao: dados.descricao.trim(),
      valor: this.arredondar(dados.valor),
      irRetido: this.arredondar(irRetido),
      criadoEm: new Date(),
    };
    this.rendimentos.push(item);
    return item;
  }

  public registrarDeducao(dados: {
    fichaId: string;
    categoria: CategoriaDeducaoIr;
    beneficiario: string;
    descricao: string;
    valor: number;
    dedutivel?: boolean;
  }): DeducaoIr {
    if (
      !dados.fichaId?.trim() ||
      !dados.beneficiario?.trim() ||
      !dados.descricao?.trim()
    ) {
      throw new Error('fichaId, beneficiario e descricao são obrigatórios.');
    }
    if (!CATEGORIAS_DEDUCAO.includes(dados.categoria)) {
      throw new Error('Categoria de dedução/pagamento inválida.');
    }
    if (
      typeof dados.valor !== 'number' ||
      !Number.isFinite(dados.valor) ||
      dados.valor <= 0
    ) {
      throw new Error('valor da despesa/dedução deve ser maior que zero.');
    }

    const item: DeducaoIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      categoria: dados.categoria,
      beneficiario: dados.beneficiario.trim(),
      descricao: dados.descricao.trim(),
      valor: this.arredondar(dados.valor),
      dedutivel: dados.dedutivel ?? dados.categoria !== 'OUTRO_PAGAMENTO',
      criadoEm: new Date(),
    };
    this.deducoes.push(item);
    return item;
  }

  public obterResumo(fichaId: string): ResumoRendimentosDeducoesIr {
    if (!fichaId?.trim()) {
      throw new Error('fichaId é obrigatório.');
    }
    const id = fichaId.trim();
    const rends = this.rendimentos.filter((r) => r.fichaId === id);
    const deds = this.deducoes.filter((d) => d.fichaId === id);

    const totaisRendimentosPorCategoria: Record<CategoriaRendimentoIr, number> = {
      TRIBUTAVEL: 0,
      ISENTO_NAO_TRIBUTAVEL: 0,
      TRIBUTACAO_EXCLUSIVA: 0,
      RRA: 0,
      EXTERIOR: 0,
    };

    let totalIrRetido = 0;
    for (const r of rends) {
      totaisRendimentosPorCategoria[r.categoria] = this.arredondar(
        totaisRendimentosPorCategoria[r.categoria] + r.valor
      );
      totalIrRetido = this.arredondar(totalIrRetido + r.irRetido);
    }

    const totalDeducoesAplicaveis = this.arredondar(
      deds.filter((d) => d.dedutivel).reduce((acc, d) => acc + d.valor, 0)
    );

    return {
      fichaId: id,
      rendimentos: rends,
      deducoes: deds,
      totaisRendimentosPorCategoria,
      totalIrRetido,
      totalDeducoesAplicaveis,
    };
  }

  public limpar(): void {
    this.rendimentos = [];
    this.deducoes = [];
  }
}
