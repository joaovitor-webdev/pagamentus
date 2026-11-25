import { Request, Response } from 'express';
import { ApiDocumentadaService } from '../services/ApiDocumentadaService';

const PERFIS_AUTORIZADOS_LOGS = ['ADMINISTRADOR', 'AUDITOR', 'CONTADOR'];

export class ApiDocumentadaController {
  constructor(private readonly service: ApiDocumentadaService) {}

  public obterOpenApi = (req: Request, res: Response): void => {
    const identificador =
      (req.headers['x-cliente-integracao'] as string) ||
      req.ip ||
      'cliente-padrao';
    const rate = this.service.verificarRateLimit(identificador);
    res.setHeader('X-RateLimit-Limit', String(rate.limite));
    res.setHeader('X-RateLimit-Remaining', String(rate.restante));

    if (!rate.permitido) {
      res.setHeader('Retry-After', String(rate.janelaSegundos));
      this.service.registrarLog({
        metodo: req.method,
        rota: req.originalUrl || '/api/docs/openapi.json',
        statusCode: 429,
        identificadorCliente: identificador,
        ip: req.ip,
        detalhes: {
          motivo: 'RATE_LIMIT_EXCEDIDO',
          authorization: req.headers.authorization,
        },
      });
      res.status(429).json({
        erro: 'Limite de requisições excedido. Tente novamente em instantes.',
        limite: rate.limite,
        janelaSegundos: rate.janelaSegundos,
      });
      return;
    }

    this.service.registrarLog({
      metodo: req.method,
      rota: req.originalUrl || '/api/docs/openapi.json',
      statusCode: 200,
      identificadorCliente: identificador,
      ip: req.ip,
      detalhes: {
        authorization: req.headers.authorization,
        formato: 'openapi-json',
      },
    });

    res.status(200).json(this.service.obterContratoOpenApi());
  };

  public obterPaginaDocs = (_req: Request, res: Response): void => {
    res.status(200).type('text/html').send(this.service.obterHtmlDocumentacao());
  };

  public listarLogs = (req: Request, res: Response): void => {
    const perfil = String(req.headers['x-perfil-usuario'] || '').toUpperCase();
    if (!PERFIS_AUTORIZADOS_LOGS.includes(perfil)) {
      res.status(403).json({
        erro: 'Acesso negado: perfil sem permissão para consultar logs da API.',
        codigo: 'ACESSO_NEGADO',
      });
      return;
    }

    res.status(200).json({
      total: this.service.listarLogs().length,
      logs: this.service.listarLogs(),
    });
  };
}
