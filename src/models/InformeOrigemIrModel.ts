/**
 * Modelos de Domínio para Importação de Informes e Origem dos Dados
 * (SPEC-3.16 / RF-035, RB-005)
 */

export type OrigemDadoIr =
  | 'INFORMADO_CLIENTE'
  | 'IMPORTADO'
  | 'CALCULADO_SISTEMA'
  | 'REVISADO_PROFISSIONAL';

export type FormatoInformeIr = 'JSON' | 'CSV';

export interface RegistroInformeIr {
  id: string;
  fichaId: string;
  exercicio: number;
  fontePagadora: string;
  rendimentoTributavel: number;
  irRetido: number;
  origemInicial: OrigemDadoIr;
  origemAtual: OrigemDadoIr;
  formatoArquivo?: FormatoInformeIr;
  conteudoOriginal?: string;
  revisadoPor?: string;
  criadoEm: Date;
}
