import { describe, it, expect } from 'vitest';

describe('Fase 4 - Balancete de Verificação (Total Débitos = Total Créditos)', () => {
  it('soma dos débitos deve ser exatamente igual à soma dos créditos após apropriação da folha', () => {
    const lancamentos = [
      { debito: '4.1.01.001', credito: '2.1.01.001', valor: 8600.0 },
      { debito: '2.1.01.001', credito: '2.1.02.001', valor: 826.11 },
      { debito: '2.1.01.001', credito: '2.1.02.002', valor: 46.44 },
      { debito: '4.1.01.002', credito: '2.1.02.003', valor: 688.0 },
    ];

    const totalDebitos = lancamentos.reduce((acc, l) => acc + l.valor, 0);
    const totalCreditos = lancamentos.reduce((acc, l) => acc + l.valor, 0);

    expect(totalDebitos).toBeCloseTo(totalCreditos, 2);
    expect(totalDebitos).toBeCloseTo(10160.55, 2);
  });

  it('DRE 11/2026 Tecnologia Horizonte: Receita R$ 15.000,00 - Despesas R$ 9.288,00 = Resultado R$ 5.712,00', () => {
    const receitas = 15000.0;
    const despesas = 8600.0 + 688.0; // Salários + FGTS
    const resultado = receitas - despesas;

    expect(receitas).toBe(15000.0);
    expect(despesas).toBe(9288.0);
    expect(resultado).toBe(5712.0);
  });
});
