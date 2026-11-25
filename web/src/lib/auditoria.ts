export function mascararDadosSensiveis(
  dados: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!dados) return null;

  const chavesSensiveis = ['cpf', 'salario', 'salario_base', 'senha', 'password', 'token'];
  const resultado: Record<string, unknown> = {};

  for (const [chave, valor] of Object.entries(dados)) {
    const normalizada = chave.toLowerCase();
    if (chavesSensiveis.some((s) => normalizada.includes(s))) {
      resultado[chave] = '[REDACTED_LGPD]';
    } else if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      resultado[chave] = mascararDadosSensiveis(valor as Record<string, unknown>);
    } else {
      resultado[chave] = valor;
    }
  }

  return resultado;
}

export interface RegistroAuditoriaInput {
  usuarioId: string;
  escritorioId: string;
  empresaId?: string | null;
  modulo: string;
  acao: string;
  entidade: string;
  entidadeId?: string;
  antes?: Record<string, unknown> | null;
  depois?: Record<string, unknown> | null;
}

export function montarPayloadAuditoria(input: RegistroAuditoriaInput) {
  return {
    usuario_id: input.usuarioId,
    escritorio_id: input.escritorioId,
    empresa_id: input.empresaId ?? null,
    modulo: input.modulo,
    acao: input.acao,
    entidade: input.entidade,
    entidade_id: input.entidadeId ?? null,
    antes: mascararDadosSensiveis(input.antes),
    depois: mascararDadosSensiveis(input.depois),
  };
}
