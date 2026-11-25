import { Request, Response } from 'express';
import { ExportacaoControladaService } from '../services/ExportacaoControladaService';

/**
 * Controller HTTP para Exportação Controlada e Saída de Dados (SPEC-5.4 / RF-073, RNF-015)
 */
export class ExportacaoControladaController {
  constructor(private readonly service: ExportacaoControladaService) {}

  public exportar = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const perfil = String(req.headers['x-perfil-acesso'] || '');
      const dados = this.service.exportar({
        clienteId,
        perfil,
        ...req.body,
      });
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res
        .status(erro.statusCode || 400)
        .json({ sucesso: false, erro: erro.message });
    }
  };

  public listarAuditoria = (req: Request, res: Response): void => {
    try {
      const clienteId = String(req.params.clienteId || '');
      const dados = this.service.listarAuditoria(clienteId);
      res.status(200).json({ sucesso: true, dados });
    } catch (erro: any) {
      res.status(400).json({ sucesso: false, erro: erro.message });
    }
  };
}
