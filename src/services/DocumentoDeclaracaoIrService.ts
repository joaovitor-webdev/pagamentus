import * as crypto from 'crypto';
import {
  DocumentoDeclaracaoIr,
  TipoDocumentoIr,
} from '../models/DocumentoDeclaracaoIrModel';

const TIPOS_VALIDOS: TipoDocumentoIr[] = [
  'DECLARACAO',
  'RECIBO',
  'COPIA_TRANSMITIDA',
  'COMPROVANTE_CLIENTE',
];

const PERFIS_AUTORIZADOS = new Set(['CONTADOR', 'TITULAR_CLIENTE', 'AUDITOR']);

/**
 * Serviço para armazenamento com acesso restrito de documentos IRPF
 * (SPEC-3.20 / RF-039)
 */
export class DocumentoDeclaracaoIrService {
  private documentos: DocumentoDeclaracaoIr[] = [];

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  public armazenar(dados: {
    fichaId: string;
    tipo: TipoDocumentoIr;
    nomeArquivo: string;
    conteudo: string;
  }): DocumentoDeclaracaoIr {
    if (
      !dados.fichaId?.trim() ||
      !dados.nomeArquivo?.trim() ||
      !dados.conteudo?.trim()
    ) {
      throw this.criarErro(
        'fichaId, nomeArquivo e conteudo são obrigatórios.',
        400
      );
    }
    if (!TIPOS_VALIDOS.includes(dados.tipo)) {
      throw this.criarErro('Tipo de documento IR inválido.', 400);
    }

    const hashSha256 = crypto
      .createHash('sha256')
      .update(dados.conteudo)
      .digest('hex');

    const doc: DocumentoDeclaracaoIr = {
      id: crypto.randomUUID(),
      fichaId: dados.fichaId.trim(),
      tipo: dados.tipo,
      nomeArquivo: dados.nomeArquivo.trim(),
      conteudo: dados.conteudo,
      hashSha256,
      acessoRestrito: true,
      armazenadoEm: new Date(),
    };
    this.documentos.push(doc);
    return doc;
  }

  public listarComAcessoRestrito(
    fichaId: string,
    perfilAcesso: string
  ): DocumentoDeclaracaoIr[] {
    const perfilNorm = (perfilAcesso || '').trim().toUpperCase();
    if (!PERFIS_AUTORIZADOS.has(perfilNorm)) {
      throw this.criarErro(
        'Acesso negado: perfil não autorizado a visualizar documentos restritos de IRPF (RF-039).',
        403
      );
    }
    return this.documentos.filter((d) => d.fichaId === fichaId.trim());
  }

  public limpar(): void {
    this.documentos = [];
  }
}
