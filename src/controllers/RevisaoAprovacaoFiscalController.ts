import { Request, Response } from 'express';
import { RevisaoAprovacaoFiscalService } from '../services/RevisaoAprovacaoFiscalService';

/**
 * Controller HTTP para Revisão e Aprovação Profissional (SPEC-3.12 / RF-029, RB-003)
 */
export class RevisaoAprovacaoFiscalController {
  constructor(private readonly service: RevisaoAprovacaoFiscalService) {}

  public criarProcesso = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.criarProcesso({ empresaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public revisar = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const processoId = String(req.params.processoId || '');
      const dados = this.service.revisar(empresaId, processoId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public finalizar = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const processoId = String(req.params.processoId || '');
      const dados = this.service.finalizar(empresaId, processoId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listar = (req: Request, res: Response): void => {
    try {
      const empresaId = String(req.params.empresaId || '');
      const dados = this.service.listar(empresaId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
