import { Request, Response } from 'express';
import { ImportacaoExportacaoValidadaService } from '../services/ImportacaoExportacaoValidadaService';

const PERFIS_AUTORIZADOS = ['ADMINISTRADOR', 'CONTADOR', 'OPERADOR'];

export class ImportacaoExportacaoValidadaController {
  constructor(private readonly service: ImportacaoExportacaoValidadaService) {}

  private validarPermissao(req: Request, res: Response): boolean {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_AUTORIZADOS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para operações de importação e exportação.',
        codigo: 'ACESSO_NEGADO',
      });
      return false;
    }
    return true;
  }

  public preVisualizar = (req: Request, res: Response): void => {
    if (!this.validarPermissao(req, res)) return;

    const { nomeArquivo, formato, conteudo, registros } = req.body;
    if (!nomeArquivo || !formato || !conteudo || !Array.isArray(registros)) {
      res.status(400).json({
        erro: 'Parâmetros inválidos. É necessário informar nomeArquivo, formato, conteudo e registros em array.',
        codigo: 'PARAMETROS_INVALIDOS',
      });
      return;
    }

    try {
      const resultado = this.service.preVisualizarLote({
        nomeArquivo,
        formato,
        conteudo,
        registros,
      });
      res.status(200).json(resultado);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao processar validação.';
      res.status(400).json({ erro: mensagem });
    }
  };

  public confirmar = (req: Request, res: Response): void => {
    if (!this.validarPermissao(req, res)) return;

    const { loteId, descartarInvalidos } = req.body;
    if (!loteId) {
      res.status(400).json({
        erro: 'loteId é obrigatório para confirmar a importação.',
        codigo: 'LOTE_OBRIGATORIO',
      });
      return;
    }

    try {
      const resultado = this.service.confirmarImportacao(loteId, descartarInvalidos ?? true);
      res.status(200).json(resultado);
    } catch (err: unknown) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao confirmar importação.';
      res.status(404).json({ erro: mensagem });
    }
  };

  public obterOriginal = (req: Request, res: Response): void => {
    if (!this.validarPermissao(req, res)) return;

    const loteId = String(req.params.loteId || '');
    const original = this.service.obterOriginalPreservado(loteId);
    if (!original) {
      res.status(404).json({ erro: 'Arquivo original não encontrado para o lote informado.' });
      return;
    }
    res.status(200).json(original);
  };

  public exportar = (req: Request, res: Response): void => {
    if (!this.validarPermissao(req, res)) return;

    const prefixo = req.query.prefixo as string | undefined;
    const resultado = this.service.exportarDadosValidados({ prefixoIdentificador: prefixo });
    res.status(200).json(resultado);
  };
}
