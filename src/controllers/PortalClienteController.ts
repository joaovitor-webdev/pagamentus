import { Request, Response } from 'express';
import { PortalClienteService } from '../services/PortalClienteService';

/**
 * Controller HTTP para Portal do Cliente (SPEC-4.9 / RF-066)
 */
export class PortalClienteController {
  constructor(private readonly service: PortalClienteService) {}

  public enviarDocumento = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.enviarDocumento({ clienteId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public listarDocumentos = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.listarDocumentos(clienteId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public abrirSolicitacao = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.abrirSolicitacao({ clienteId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };

  public atualizarStatusSolicitacao = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const solicitacaoId = String(req.params.solicitacaoId || '');
      const dados = this.service.atualizarStatusSolicitacao(
        clienteId,
        solicitacaoId,
        req.body?.status
      );
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listarSolicitacoes = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.listarSolicitacoes(clienteId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
