import { z } from 'zod';

export const PapelSchema = z.enum(['ADMIN', 'CONTADOR', 'RH_DP', 'FINANCEIRO', 'CLIENTE']);
export type PapelUsuario = z.infer<typeof PapelSchema>;

export type ModuloSistema =
  | 'dashboard'
  | 'cadastros'
  | 'contabil'
  | 'financeiro'
  | 'folha'
  | 'fiscal'
  | 'obrigacoes'
  | 'parametros'
  | 'auditoria';

const MATRIZ_ACESSO: Record<PapelUsuario, ModuloSistema[]> = {
  ADMIN: ['dashboard', 'cadastros', 'contabil', 'financeiro', 'folha', 'fiscal', 'obrigacoes', 'parametros', 'auditoria'],
  CONTADOR: ['dashboard', 'cadastros', 'contabil', 'fiscal', 'obrigacoes', 'parametros', 'auditoria'],
  RH_DP: ['dashboard', 'cadastros', 'folha'],
  FINANCEIRO: ['dashboard', 'financeiro'],
  CLIENTE: ['dashboard', 'folha', 'cadastros'],
};

export function podeAcessarModulo(papel: PapelUsuario, modulo: ModuloSistema): boolean {
  return MATRIZ_ACESSO[papel]?.includes(modulo) ?? false;
}

export function podeAprovarFiscal(papel: PapelUsuario): boolean {
  return papel === 'ADMIN' || papel === 'CONTADOR';
}

export function podeReabrirCompetencia(papel: PapelUsuario): boolean {
  return papel === 'ADMIN';
}

export function podeVerDadosSalariais(papel: PapelUsuario): boolean {
  return papel === 'ADMIN' || papel === 'RH_DP';
}
