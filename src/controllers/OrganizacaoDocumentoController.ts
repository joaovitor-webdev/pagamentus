import { Request, Response } from 'express';
import { OrganizacaoDocumentoService } from '../services/OrganizacaoDocumentoService';

/**
 * Controller HTTP para Organização Documental, Checklist e Correções
 * (SPEC-4.10 / RF-067, RF-068)
 */
export class OrganizacaoDocumentoController {
  constructor(private readonly service: OrganizacaoDocumentoService) {}

  public cadastrar = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.cadastrar({ clienteId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public buscar = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.buscar(clienteId, {
        exercicio: req.query.exercicio ? Number(req.query.exercicio) : undefined,
        competencia: req.query.competencia
          ? String(req.query.competencia)
          : undefined,
        tipo: req.query.tipo ? String(req.query.tipo) : undefined,
        processo: req.query.processo ? String(req.query.processo) : undefined,
        q: req.query.q ? String(req.query.q) : undefined,
      });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public adicionarComentario = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const docId = String(req.params.docId || '');
      const dados = this.service.adicionarComentario(
        clienteId,
        docId,
        String(req.body?.autor || ''),
        String(req.body?.mensagem || '')
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public solicitarCorrecao = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const docId = String(req.params.docId || '');
      const dados = this.service.solicitarCorrecao(
        clienteId,
        docId,
        String(req.body?.autor || ''),
        String(req.body?.motivo || '')
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public confirmarRecebimento = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const docId = String(req.params.docId || '');
      const dados = this.service.confirmarRecebimento(
        clienteId,
        docId,
        String(req.body?.confirmadoPor || '')
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
