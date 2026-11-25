/**
 * Modelos de Domínio para Bens, Direitos e Dívidas IRPF (SPEC-3.15 / RF-032)
 */

export type CategoriaBemIr =
  | 'IMOVEL'
  | 'VEICULO'
  | 'PARTICIPACAO_SOCIETARIA'
  | 'APLICACAO_FINANCEIRA'
  | 'CRIPTOATIVO'
  | 'OUTRO_BEM';

export interface BemDireitoIr {
  id: string;
  fichaId: string;
  categoria: CategoriaBemIr;
  descricao: string;
  situacaoAnterior: number;
  situacaoAtual: number;
  criadoEm: Date;
}

export interface DividaOnusIr {
  id: string;
  fichaId: string;
  credor: string;
  descricao: string;
  saldoAnterior: number;
  saldoAtual: number;
  valorPagoNoExercicio: number;
  criadoEm: Date;
}

export interface ResumoPatrimonialIr {
  fichaId: string;
  bens: BemDireitoIr[];
  dividas: DividaOnusIr[];
  totalBensAnterior: number;
  totalBensAtual: number;
  variacaoPatrimonial: number;
  totalDividasAtual: number;
  patrimonioLiquidoAtual: number;
}
