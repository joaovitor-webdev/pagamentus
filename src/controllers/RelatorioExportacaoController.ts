import { Request, Response } from 'express';
import { RelatorioExportacaoService } from '../services/RelatorioExportacaoService';

/**
 * Controller HTTP para Relatórios em PDF, XLSX e CSV (SPEC-5.3 / RF-071)
 */
export class RelatorioExportacaoController {
  constructor(private readonly service: RelatorioExportacaoService) {}

  public gerar = (req: Request, res: Response): void => {
    try {
      const perfilAcesso = String(req.headers['x-perfil-acesso'] || '');
      const dados = this.service.gerar({ ...req.body, perfilAcesso });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };
}
