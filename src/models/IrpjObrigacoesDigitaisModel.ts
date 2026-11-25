/**
 * Modelos de Domínio para Memória de Apuração IRPJ e Obrigações Digitais
 * (SPEC-3.22 / RF-044, RF-045)
 */

export type TipoObrigacaoDigitalIrpj = 'ECF' | 'ECD' | 'DCTF';

export interface MemoriaApuracaoIrpj {
  id: string;
  empresaId: string;
  competencia: string; // YYYY-MM
  tributo: 'IRPJ' | 'CSLL';
  baseCalculo: number;
  aliquotaPercentual: number;
  valorApurado: number;
  valorContabilizado: number;
  diferencaContabil: number;
  conciliado: boolean;
  documentosSuporte: string[];
  criadoEm: Date;
}

export interface PacoteObrigacaoDigitalIrpj {
  id: string;
  empresaId: string;
  obrigacao: TipoObrigacaoDigitalIrpj;
  exercicio: number;
  leiauteVersao: string;
  quantidadeRegistros: number;
  registros: Array<{
    bloco: string;
    competencia: string;
    tributo: string;
    baseCalculo: number;
    valorApurado: number;
    conciliado: boolean;
  }>;
  avisoPreparacao: string;
  geradoEm: Date;
}
