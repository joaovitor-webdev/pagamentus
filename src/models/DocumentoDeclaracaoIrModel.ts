/**
 * Modelos de Domínio para Declaração, Recibo e Comprovantes IRPF
 * (SPEC-3.20 / RF-039)
 */

export type TipoDocumentoIr =
  | 'DECLARACAO'
  | 'RECIBO'
  | 'COPIA_TRANSMITIDA'
  | 'COMPROVANTE_CLIENTE';

export interface DocumentoDeclaracaoIr {
  id: string;
  fichaId: string;
  tipo: TipoDocumentoIr;
  nomeArquivo: string;
  conteudo: string;
  hashSha256: string;
  acessoRestrito: true;
  armazenadoEm: Date;
}
