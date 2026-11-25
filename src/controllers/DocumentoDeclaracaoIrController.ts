import { Request, Response } from 'express';
import { DocumentoDeclaracaoIrService } from '../services/DocumentoDeclaracaoIrService';

/**
 * Controller HTTP para Declaração, Recibo e Comprovantes IRPF (SPEC-3.20 / RF-039)
 */
export class DocumentoDeclaracaoIrController {
  constructor(private readonly service: DocumentoDeclaracaoIrService) {}

  public armazenar = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.armazenar({ fichaId, ...req.body });
      res.status(201).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listar = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const perfil = String(req.headers['x-perfil-acesso'] || '');
      const dados = this.service.listarComAcessoRestrito(fichaId, perfil);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
