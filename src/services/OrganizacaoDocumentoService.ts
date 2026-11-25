import * as crypto from 'crypto';
import { DocumentoOrganizado } from '../models/OrganizacaoDocumentoModel';

const REGEX_COMPETENCIA = /^\d{4}-\d{2}$/;

/**
 * Serviço para organização documental, busca, checklist, comentários e correções
 * (SPEC-4.10 / RF-067, RF-068)
 */
export class OrganizacaoDocumentoService {
  private documentos: DocumentoOrganizado[] = [];

  private criarErro(mensagem: string, statusCode: number): Error {
    const erro = new Error(mensagem) as Error & { statusCode?: number };
    erro.statusCode = statusCode;
    return erro;
  }

  private buscarDoc(clienteId: string, docId: string): DocumentoOrganizado {
    const doc = this.documentos.find(
      (d) => d.clienteId === clienteId.trim() && d.id === docId.trim()
    );
    if (!doc) {
      throw this.criarErro('Documento não encontrado.', 404);
    }
    return doc;
  }

  public cadastrar(dados: {
    clienteId: string;
    exercicio: number;
    competencia: string;
    tipo: string;
    processo: string;
    titulo: string;
    checklist?: Array<{ item: string; conferido: boolean }>;
  }): DocumentoOrganizado {
    if (
      !dados.clienteId?.trim() ||
      !dados.tipo?.trim() ||
      !dados.processo?.trim() ||
      !dados.titulo?.trim()
    ) {
      throw this.criarErro(
        'clienteId, tipo, processo e titulo são obrigatórios.',
        400
      );
    }
    if (
      !Number.isInteger(dados.exercicio) ||
      dados.exercicio < 2000 ||
      dados.exercicio > 2100
    ) {
      throw this.criarErro('exercicio inválido.', 400);
    }
    if (!REGEX_COMPETENCIA.test(dados.competencia || '')) {
      throw this.criarErro('competencia deve estar no formato YYYY-MM.', 400);
    }

    const doc: DocumentoOrganizado = {
      id: crypto.randomUUID(),
      clienteId: dados.clienteId.trim(),
      exercicio: dados.exercicio,
      competencia: dados.competencia,
      tipo: dados.tipo.trim().toUpperCase(),
      processo: dados.processo.trim().toUpperCase(),
      titulo: dados.titulo.trim(),
      checklist: (dados.checklist ?? []).map((c) => ({
        item: c.item.trim(),
        conferido: Boolean(c.conferido),
      })),
      comentarios: [],
      status: 'ENVIADO',
      criadoEm: new Date(),
    };
    this.documentos.push(doc);
    return doc;
  }

  public buscar(
    clienteId: string,
    filtros: {
      exercicio?: number;
      competencia?: string;
      tipo?: string;
      processo?: string;
      q?: string;
    }
  ): DocumentoOrganizado[] {
    const termo = filtros.q?.trim().toLowerCase();
    return this.documentos.filter(
      (d) =>
        d.clienteId === clienteId.trim() &&
        (!filtros.exercicio || d.exercicio === filtros.exercicio) &&
        (!filtros.competencia || d.competencia === filtros.competencia) &&
        (!filtros.tipo || d.tipo === filtros.tipo.trim().toUpperCase()) &&
        (!filtros.processo ||
          d.processo === filtros.processo.trim().toUpperCase()) &&
        (!termo || d.titulo.toLowerCase().includes(termo))
    );
  }

  public adicionarComentario(
    clienteId: string,
    docId: string,
    autor: string,
    mensagem: string
  ): DocumentoOrganizado {
    if (!autor?.trim() || !mensagem?.trim()) {
      throw this.criarErro('autor e mensagem são obrigatórios.', 400);
    }
    const doc = this.buscarDoc(clienteId, docId);
    doc.comentarios.push({
      autor: autor.trim(),
      mensagem: mensagem.trim(),
      criadoEm: new Date(),
    });
    return doc;
  }

  public solicitarCorrecao(
    clienteId: string,
    docId: string,
    autor: string,
    motivo: string
  ): DocumentoOrganizado {
    if (!autor?.trim() || !motivo?.trim()) {
      throw this.criarErro('autor e motivo são obrigatórios.', 400);
    }
    const doc = this.buscarDoc(clienteId, docId);
    doc.status = 'CORRECAO_SOLICITADA';
    doc.comentarios.push({
      autor: autor.trim(),
      mensagem: `[CORREÇÃO SOLICITADA] ${motivo.trim()}`,
      criadoEm: new Date(),
    });
    return doc;
  }

  public confirmarRecebimento(
    clienteId: string,
    docId: string,
    confirmadoPor: string
  ): DocumentoOrganizado {
    if (!confirmadoPor?.trim()) {
      throw this.criarErro('confirmadoPor é obrigatório.', 400);
    }
    const doc = this.buscarDoc(clienteId, docId);
    doc.status = 'RECEBIDO';
    doc.confirmadoPor = confirmadoPor.trim();
    doc.confirmadoEm = new Date();
    return doc;
  }

  public limpar(): void {
    this.documentos = [];
  }
}
