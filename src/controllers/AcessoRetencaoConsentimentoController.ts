import { Request, Response } from 'express';
import { AcessoRetencaoConsentimentoService } from '../services/AcessoRetencaoConsentimentoService';

/**
 * Controller HTTP para Acesso, Retenção e Consentimentos (SPEC-4.11 / RF-069, RF-070)
 */
export class AcessoRetencaoConsentimentoController {
  constructor(private readonly service: AcessoRetencaoConsentimentoService) {}

  public definirPolitica = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.definirPolitica({ clienteId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public executarAcao = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const documentoId = String(req.params.docId || '');
      const dados = this.service.executarAcaoDocumento({
        clienteId,
        documentoId,
        ...req.body,
      });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public registrarConsentimento = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.registrarConsentimento({
        clienteId,
        ...req.body,
      });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listarConsentimentos = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.listarConsentimentos(clienteId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
