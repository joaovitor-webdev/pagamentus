/**
 * Modelos de Domínio para Rendimentos e Deduções IRPF (SPEC-3.14 / RF-031, RF-033)
 */

export type CategoriaRendimentoIr =
  | 'TRIBUTAVEL'
  | 'ISENTO_NAO_TRIBUTAVEL'
  | 'TRIBUTACAO_EXCLUSIVA'
  | 'RRA'
  | 'EXTERIOR';

export type CategoriaDeducaoIr =
  | 'CONTRIBUICAO'
  | 'PREVIDENCIA'
  | 'MEDICA'
  | 'EDUCACAO'
  | 'PENSAO'
  | 'DOACAO'
  | 'OUTRO_PAGAMENTO';

export interface RendimentoIr {
  id: string;
  fichaId: string;
  categoria: CategoriaRendimentoIr;
  fontePagadora: string;
  descricao: string;
  valor: number;
  irRetido: number;
  criadoEm: Date;
}

export interface DeducaoIr {
  id: string;
  fichaId: string;
  categoria: CategoriaDeducaoIr;
  beneficiario: string;
  descricao: string;
  valor: number;
  dedutivel: boolean;
  criadoEm: Date;
}

export interface ResumoRendimentosDeducoesIr {
  fichaId: string;
  rendimentos: RendimentoIr[];
  deducoes: DeducaoIr[];
  totaisRendimentosPorCategoria: Record<CategoriaRendimentoIr, number>;
  totalIrRetido: number;
  totalDeducoesAplicaveis: number;
}
