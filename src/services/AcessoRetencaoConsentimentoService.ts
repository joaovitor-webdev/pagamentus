import * as crypto from 'crypto';
import {
  AcaoDocumentoPolitica,
  PoliticaDocumentoCliente,
  RegistroConsentimentoCliente,
  TipoTermoCliente,
} from '../models/AcessoRetencaoConsentimentoModel';

const REGEX_DATA = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS_TERMO: TipoTermoCliente[] = [
  'CONSENTIMENTO',
  'AUTORIZACAO',
  'PROCURACAO',
];
const AVISO_JURIDICO =
  'Registro operacional (RF-070): não substitui análise jurídica formal.';

/**
 * Serviço para controle de acesso, retenção, descarte e consentimentos
 * (SPEC-4.11 / RF-069, RF-070)
 */
export class AcessoRetencaoConsentimentoService {
  private politicas: PoliticaDocumentoCliente[] = [];
  private consentimentos: RegistroConsentimentoCliente[] = [];

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  public definirPolitica(dados: {
    clienteId: string;
    documentoId: string;
    perfisPermitidos: string[];
    permiteDownload: boolean;
    permiteCompartilhamento: boolean;
    retencaoAte: string;
  }): PoliticaDocumentoCliente {
    if (!dados.clienteId?.trim() || !dados.documentoId?.trim()) {
      throw this.criarErro('clienteId e documentoId são obrigatórios.', 400);
    }
    if (!REGEX_DATA.test(dados.retencaoAte || '')) {
      throw this.criarErro('retencaoAte deve estar no formato YYYY-MM-DD.', 400);
    }
    if (
      !Array.isArray(dados.perfisPermitidos) ||
      dados.perfisPermitidos.length === 0
    ) {
      throw this.criarErro('Informe ao menos um perfil permitido.', 400);
    }

    const pol: PoliticaDocumentoCliente = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      documentoId: dados.documentoId.trim(),
      perfisPermitidos: dados.perfisPermitidos.map((p) =>
        p.trim().toUpperCase()
      ),
      permiteDownload: Boolean(dados.permiteDownload),
      permiteCompartilhamento: Boolean(dados.permiteCompartilhamento),
      retencaoAte: dados.retencaoAte,
      descartado: false,
    };
    this.politicas.push(pol);
    return pol;
  }

  public executarAcaoDocumento(dados: {
    clienteId: string;
    documentoId: string;
    perfil: string;
    acao: AcaoDocumentoPolitica;
    dataReferencia: string;
  }): { permitido: true; acao: AcaoDocumentoPolitica; politica: PoliticaDocumentoCliente } {
    const pol = this.politicas.find(
      (p) =>
        p.clienteId === dados.clienteId.trim() &&
        p.documentoId === dados.documentoId.trim()
    );
    if (!pol) {
      throw this.criarErro('Política do documento não encontrada.', 404);
    }
    if (pol.descartado) {
      throw this.criarErro('Documento já foi descartado.', 400);
    }

    const perfilNorm = (dados.perfil || '').trim().toUpperCase();
    if (!pol.perfisPermitidos.includes(perfilNorm)) {
      throw this.criarErro(
        'Perfil não autorizado pela política do documento (RF-069).',
        403
      );
    }

    if (dados.acao === 'DOWNLOAD' && !pol.permiteDownload) {
      throw this.criarErro('Download não permitido pela política.', 403);
    }
    if (dados.acao === 'COMPARTILHAMENTO' && !pol.permiteCompartilhamento) {
      throw this.criarErro(
        'Compartilhamento não permitido pela política.',
        403
      );
    }
    if (dados.acao === 'DESCARTE') {
      if (!REGEX_DATA.test(dados.dataReferencia || '')) {
        throw this.criarErro('dataReferencia inválida.', 400);
      }
      if (dados.dataReferencia <= pol.retencaoAte) {
        throw this.criarErro(
          `Descarte bloqueado: prazo de retenção vigente até ${pol.retencaoAte}.`,
          400
        );
      }
      pol.descartado = true;
      pol.descartadoEm = new Date();
    }

    return { permitido: true, acao: dados.acao, politica: pol };
  }

  public registrarConsentimento(dados: {
    clienteId: string;
    tipo: TipoTermoCliente;
    outorgante: string;
    finalidade: string;
    validoAte?: string;
  }): RegistroConsentimentoCliente {
    if (
      !dados.clienteId?.trim() ||
      !dados.outorgante?.trim() ||
      !dados.finalidade?.trim()
    ) {
      throw this.criarErro(
        'clienteId, outorgante e finalidade são obrigatórios.',
        400
      );
    }
    if (!TIPOS_TERMO.includes(dados.tipo)) {
      throw this.criarErro(
        "tipo deve ser 'CONSENTIMENTO', 'AUTORIZACAO' ou 'PROCURACAO'.",
        400
      );
    }

    const reg: RegistroConsentimentoCliente = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      tipo: dados.tipo,
      outorgante: dados.outorgante.trim(),
      finalidade: dados.finalidade.trim(),
      validoAte: dados.validoAte,
      status: 'ATIVO',
      avisoJuridico: AVISO_JURIDICO,
      registradoEm: new Date(),
    };
    this.consentimentos.push(reg);
    return reg;
  }

  public listarConsentimentos(
    clienteId: string
  ): RegistroConsentimentoCliente[] {
    return this.consentimentos.filter((c) => c.clienteId === clienteId.trim());
  }

  public limpar(): void {
    this.politicas = [];
    this.consentimentos = [];
  }
}
