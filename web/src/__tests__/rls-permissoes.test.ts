import { describe, it, expect } from 'vitest';
import {
  podeAcessarModulo,
  podeAprovarFiscal,
  podeReabrirCompetencia,
  podeVerDadosSalariais,
} from '../lib/permissoes';
import { montarPayloadAuditoria } from '../lib/auditoria';

describe('Fase 1 - Matriz de Permissões RBAC e Auditoria LGPD', () => {
  it('RH_DP não acessa módulo contábil nem financeiro, mas acessa folha', () => {
    expect(podeAcessarModulo('RH_DP', 'folha')).toBe(true);
    expect(podeAcessarModulo('RH_DP', 'contabil')).toBe(false);
    expect(podeAcessarModulo('RH_DP', 'financeiro')).toBe(false);
    expect(podeAcessarModulo('RH_DP', 'auditoria')).toBe(false);
  });

  it('CLIENTE acessa apenas dashboard, folha (holerites) e cadastros próprios', () => {
    expect(podeAcessarModulo('CLIENTE', 'dashboard')).toBe(true);
    expect(podeAcessarModulo('CLIENTE', 'folha')).toBe(true);
    expect(podeAcessarModulo('CLIENTE', 'contabil')).toBe(false);
    expect(podeAcessarModulo('CLIENTE', 'fiscal')).toBe(false);
    expect(podeVerDadosSalariais('CLIENTE')).toBe(false);
  });

  it('Apenas ADMIN pode reabrir competência; ADMIN e CONTADOR aprovam fiscal', () => {
    expect(podeReabrirCompetencia('ADMIN')).toBe(true);
    expect(podeReabrirCompetencia('CONTADOR')).toBe(false);
    expect(podeReabrirCompetencia('RH_DP')).toBe(false);

    expect(podeAprovarFiscal('ADMIN')).toBe(true);
    expect(podeAprovarFiscal('CONTADOR')).toBe(true);
    expect(podeAprovarFiscal('FINANCEIRO')).toBe(false);
  });

  it('registrarAuditoria mascara CPF, salário e senha conforme LGPD', () => {
    const payload = montarPayloadAuditoria({
      usuarioId: 'user-1',
      escritorioId: 'esc-1',
      empresaId: 'emp-1',
      modulo: 'FOLHA',
      acao: 'UPDATE',
      entidade: 'empregados',
      entidadeId: 'emp-123',
      antes: { nome: 'Lucas', cpf: '222.333.444-55', salario_base: 5200 },
      depois: { nome: 'Lucas', cpf: '222.333.444-55', salario_base: 5800 },
    });

    expect(payload.antes?.cpf).toBe('[REDACTED_LGPD]');
    expect(payload.antes?.salario_base).toBe('[REDACTED_LGPD]');
    expect(payload.depois?.salario_base).toBe('[REDACTED_LGPD]');
    expect(payload.depois?.nome).toBe('Lucas');
  });
});
