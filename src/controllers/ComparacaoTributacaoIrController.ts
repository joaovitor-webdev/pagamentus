import { Request, Response } from 'express';
import { ComparacaoTributacaoIrService } from '../services/ComparacaoTributacaoIrService';

/**
 * Controller HTTP para Comparação de Opções de Tributação IRPF (SPEC-3.18 / RF-037)
 */
export class ComparacaoTributacaoIrController {
  constructor(private readonly service: ComparacaoTributacaoIrService) {}

  public comparar = (req: Request, res: Response): void => {
    try {
      const fichaId = String(req.params.fichaId || '');
      const dados = this.service.comparar(fichaId, req.body);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
