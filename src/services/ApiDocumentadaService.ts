import { randomUUID } from 'crypto';

export interface RegistroLogApi {
  id: string;
  metodo: string;
  rota: string;
  statusCode: number;
  identificadorCliente: string;
  ip?: string;
  detalhesSanitizados: Record<string, unknown>;
  registradoEm: string;
}

export interface ResultadoRateLimit {
  permitido: boolean;
  limite: number;
  restante: number;
  janelaSegundos: number;
}

const CAMPOS_SENSIVEIS = [
  'authorization',
  'token',
  'secret',
  'senha',
  'password',
  'apikey',
  'x-api-key',
  'credencial',
];

export class ApiDocumentadaService {
  private readonly logs: RegistroLogApi[] = [];
  private readonly contadoresRateLimit = new Map<
    string,
    { contagem: number; inicioJanelaMs: number }
  >();
  private readonly limitePorJanela: number;
  private readonly janelaMs: number;

  constructor(limitePorJanela = 60, janelaSegundos = 60) {
    this.limitePorJanela = limitePorJanela;
    this.janelaMs = janelaSegundos * 1000;
  }

  public obterPoliticaRateLimit(): {
    limitePorJanela: number;
    janelaSegundos: number;
    statusExcedido: number;
    cabecalhos: string[];
  } {
    return {
      limitePorJanela: this.limitePorJanela,
      janelaSegundos: Math.round(this.janelaMs / 1000),
      statusExcedido: 429,
      cabecalhos: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'Retry-After',
      ],
    };
  }

  public verificarRateLimit(identificadorCliente: string): ResultadoRateLimit {
    const agora = Date.now();
    const chave = identificadorCliente || 'anonimo';
    const registro = this.contadoresRateLimit.get(chave);

    if (!registro || agora - registro.inicioJanelaMs >= this.janelaMs) {
      this.contadoresRateLimit.set(chave, {
        contagem: 1,
        inicioJanelaMs: agora,
      });
      return {
        permitido: true,
        limite: this.limitePorJanela,
        restante: Math.max(0, this.limitePorJanela - 1),
        janelaSegundos: Math.round(this.janelaMs / 1000),
      };
    }

    if (registro.contagem >= this.limitePorJanela) {
      return {
        permitido: false,
        limite: this.limitePorJanela,
        restante: 0,
        janelaSegundos: Math.round(this.janelaMs / 1000),
      };
    }

    registro.contagem += 1;
    return {
      permitido: true,
      limite: this.limitePorJanela,
      restante: Math.max(0, this.limitePorJanela - registro.contagem),
      janelaSegundos: Math.round(this.janelaMs / 1000),
    };
  }

  public sanitizarDados(
    dados: Record<string, unknown>
  ): Record<string, unknown> {
    const resultado: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(dados)) {
      const chaveNormalizada = chave.toLowerCase();
      const ehSensivel = CAMPOS_SENSIVEIS.some((s) =>
        chaveNormalizada.includes(s)
      );
      if (ehSensivel) {
        resultado[chave] = '[REDACTED]';
      } else if (
        valor &&
        typeof valor === 'object' &&
        !Array.isArray(valor)
      ) {
        resultado[chave] = this.sanitizarDados(
          valor as Record<string, unknown>
        );
      } else {
        resultado[chave] = valor;
      }
    }
    return resultado;
  }

  public registrarLog(entrada: {
    metodo: string;
    rota: string;
    statusCode: number;
    identificadorCliente: string;
    ip?: string;
    detalhes?: Record<string, unknown>;
  }): RegistroLogApi {
    const registro: RegistroLogApi = {
      id: randomUUID(),
      metodo: entrada.metodo,
      rota: entrada.rota,
      statusCode: entrada.statusCode,
      identificadorCliente: entrada.identificadorCliente,
      ip: entrada.ip,
      detalhesSanitizados: this.sanitizarDados(entrada.detalhes ?? {}),
      registradoEm: new Date().toISOString(),
    };
    this.logs.push(registro);
    return registro;
  }

  public listarLogs(): RegistroLogApi[] {
    return [...this.logs];
  }

  public obterContratoOpenApi(): Record<string, unknown> {
    const politica = this.obterPoliticaRateLimit();
    return {
      openapi: '3.0.3',
      info: {
        title: 'Pagamentus API',
        version: '1.0.0',
        description:
          'API documentada para integrações autorizadas com o Pagamentus (RF-077). Versionamento semântico (MAJOR.MINOR.PATCH) com compatibilidade retroativa dentro da mesma versão major.',
      },
      servers: [{ url: '/api', description: 'Servidor principal da API' }],
      'x-versioning-policy': {
        strategy: 'SemVer',
        currentVersion: '1.0.0',
        deprecationNoticeDays: 90,
      },
      'x-rate-limit-policy': politica,
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description:
              'Token JWT emitido pelo módulo de autenticação (SPEC-1.2). Nunca expor credenciais reais em exemplos ou logs.',
          },
          PerfilHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'x-perfil-usuario',
            description:
              'Perfil autorizado do usuário para controle de acesso baseado em papéis (RBAC).',
          },
        },
        schemas: {
          ErroPadronizado: {
            type: 'object',
            properties: {
              erro: {
                type: 'string',
                example: 'Acesso negado para o perfil informado.',
              },
              codigo: { type: 'string', example: 'ACESSO_NEGADO' },
            },
          },
          RateLimitErro: {
            type: 'object',
            properties: {
              erro: {
                type: 'string',
                example:
                  'Limite de requisições excedido. Tente novamente em instantes.',
              },
              limite: { type: 'integer', example: 60 },
              janelaSegundos: { type: 'integer', example: 60 },
            },
          },
        },
      },
      security: [{ BearerAuth: [] }],
      paths: {
        '/docs/openapi.json': {
          get: {
            summary: 'Obter contrato OpenAPI 3.0.3 da API Pagamentus',
            tags: ['Documentação'],
            responses: {
              '200': {
                description: 'Contrato OpenAPI em formato JSON',
              },
              '429': {
                description: 'Limite de uso excedido',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/RateLimitErro' },
                  },
                },
              },
            },
          },
        },
        '/indicadores': {
          get: {
            summary: 'Consultar painel consolidado de indicadores (SPEC-5.2)',
            tags: ['Indicadores'],
            parameters: [
              {
                name: 'dataInicio',
                in: 'query',
                required: false,
                schema: { type: 'string', example: '2026-01-01' },
              },
              {
                name: 'dataFim',
                in: 'query',
                required: false,
                schema: { type: 'string', example: '2026-01-31' },
              },
            ],
            responses: {
              '200': { description: 'Indicadores consolidados do período' },
              '403': {
                description: 'Perfil sem permissão',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ErroPadronizado' },
                  },
                },
              },
            },
          },
        },
        '/relatorios/exportar': {
          post: {
            summary:
              'Exportar relatório em formato PDF, XLSX ou CSV (SPEC-5.3)',
            tags: ['Relatórios'],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  example: {
                    tipoRelatorio: 'FINANCEIRO',
                    formato: 'CSV',
                    registros: [
                      { cliente: 'Empresa Exemplo Ltda', valor: 1500.0 },
                    ],
                  },
                },
              },
            },
            responses: {
              '200': { description: 'Relatório exportado com sucesso' },
              '400': { description: 'Parâmetros inválidos' },
              '403': { description: 'Perfil sem permissão' },
            },
          },
        },
        '/auditoria/relatorios': {
          get: {
            summary:
              'Emitir relatório de auditoria filtrado por módulo, usuário, ação e período (SPEC-5.5)',
            tags: ['Auditoria'],
            responses: {
              '200': { description: 'Relatório de auditoria emitido' },
              '403': { description: 'Perfil sem permissão' },
            },
          },
        },
      },
    };
  }

  public obterHtmlDocumentacao(): string {
    const politica = this.obterPoliticaRateLimit();
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Pagamentus API — Documentação OpenAPI</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; color: #1f2937; }
    code { background: #f3f4f6; padding: 0.15rem 0.35rem; border-radius: 4px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; }
  </style>
</head>
<body>
  <h1>Pagamentus API v1.0.0</h1>
  <p>API documentada para integrações autorizadas (SPEC-5.6 / RF-077).</p>
  <div class="card">
    <h2>Contrato OpenAPI 3.0.3</h2>
    <p>Baixe ou integre o contrato em JSON: <a href="/api/docs/openapi.json"><code>GET /api/docs/openapi.json</code></a></p>
  </div>
  <div class="card">
    <h2>Autenticação e Limites de Uso</h2>
    <ul>
      <li>Autenticação via <code>Authorization: Bearer &lt;token&gt;</code> e controle RBAC.</li>
      <li>Rate limiting: <strong>${politica.limitePorJanela} requisições</strong> a cada <strong>${politica.janelaSegundos}s</strong> (HTTP <code>429</code> quando excedido).</li>
      <li>Logs de segurança sanitizados (sem exposição de tokens ou segredos).</li>
    </ul>
  </div>
</body>
</html>`;
  }
}
