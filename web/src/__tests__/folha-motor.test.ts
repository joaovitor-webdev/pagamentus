import { describe, it, expect } from 'vitest';
import {
  calcularFolhaEmpregado,
  selecionarParametrosPorCompetencia,
  ParametrosFolha,
  ParametroLegalBanco,
} from '../lib/folha/motor';

const PARAMS_2026: ParametrosFolha = {
  salarioMinimo: 1621.0,
  aliquotaFgts: 8.0,
  tetoValeTransportePercentual: 6.0,
  faixasInss: [
    { ordem: 1, limiteInferior: 0, limiteSuperior: 1621.0, aliquota: 7.5, parcelaDeduzir: 0 },
    { ordem: 2, limiteInferior: 1621.01, limiteSuperior: 2902.84, aliquota: 9.0, parcelaDeduzir: 24.32 },
    { ordem: 3, limiteInferior: 2902.85, limiteSuperior: 4354.27, aliquota: 12.0, parcelaDeduzir: 111.4 },
    { ordem: 4, limiteInferior: 4354.28, limiteSuperior: 8475.55, aliquota: 14.0, parcelaDeduzir: 198.49 },
  ],
  faixasIrrf: [
    { ordem: 1, limiteInferior: 0, limiteSuperior: 2428.8, aliquota: 0, parcelaDeduzir: 0 },
    { ordem: 2, limiteInferior: 2428.81, limiteSuperior: 2826.65, aliquota: 7.5, parcelaDeduzir: 182.16 },
    { ordem: 3, limiteInferior: 2826.66, limiteSuperior: 3751.05, aliquota: 15.0, parcelaDeduzir: 394.16 },
    { ordem: 4, limiteInferior: 3751.06, limiteSuperior: 4664.68, aliquota: 22.5, parcelaDeduzir: 675.49 },
    { ordem: 5, limiteInferior: 4664.69, limiteSuperior: null, aliquota: 27.5, parcelaDeduzir: 908.73 },
  ],
  deducaoPorDependente: 189.59,
  descontoSimplificadoMensal: 607.2,
  isencaoIrrf2026: 5000.0,
  redutorIrrfLimiteSuperior2026: 7350.0,
  redutorIrrfValorBase2026: 978.62,
  redutorIrrfFator2026: 0.133145,
};

describe('Fase 3 - Motor Puro da Folha 2026 (Vigência + 16 Cenários)', () => {
  it('0. Seleciona tabela pela COMPETÊNCIA (2025-12 vs 2026-01)', () => {
    const registros: ParametroLegalBanco[] = [
      { vigencia_inicio: '2025-01-01', vigencia_fim: '2025-12-31', tipo: 'SALARIO_MINIMO', faixa_ordem: 1, limite_inferior: 0, limite_superior: null, aliquota: 0, parcela_deduzir: 0, valor_fixo: 1518.0 },
      { vigencia_inicio: '2026-01-01', vigencia_fim: '2026-12-31', tipo: 'SALARIO_MINIMO', faixa_ordem: 1, limite_inferior: 0, limite_superior: null, aliquota: 0, parcela_deduzir: 0, valor_fixo: 1621.0 },
    ];
    expect(selecionarParametrosPorCompetencia('2025-12', registros).salarioMinimo).toBe(1518.0);
    expect(selecionarParametrosPorCompetencia('2026-01', registros).salarioMinimo).toBe(1621.0);
    expect(() => selecionarParametrosPorCompetencia('2027-01', registros)).toThrow(
      'Cadastre os parâmetros legais de 2027'
    );
  });

  it('1. Salário mínimo 2026 (R$ 1.621,00 -> INSS 121,58, IRRF 0,00, FGTS 129,68)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 1621.0 }, PARAMS_2026);
    expect(res.inss).toBe(121.58);
    expect(res.irrf).toBe(0);
    expect(res.fgts).toBe(129.68);
    expect(res.valorLiquido).toBe(1499.42);
  });

  it('2. Limite isenção IR 2026 exato: R$ 5.000,00 (zera IRRF pela Lei 15.270/2025)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 5000.0 }, PARAMS_2026);
    expect(res.inss).toBe(501.51);
    expect(res.metodoIrrf).toBe('DESCONTO_SIMPLIFICADO');
    expect(res.impostoTabela).toBeGreaterThan(0);
    expect(res.reducaoLei15270).toBe(res.impostoTabela);
    expect(res.irrf).toBe(0);
    expect(res.valorLiquido).toBe(4498.49);
  });

  it('3. Limite inferior redução gradual: R$ 5.000,01', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 5000.01 }, PARAMS_2026);
    expect(res.reducaoLei15270).toBe(res.impostoTabela);
    expect(res.irrf).toBe(0);
  });

  it('4. Faixa de redução gradual: R$ 6.000,00', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 6000.0 }, PARAMS_2026);
    expect(res.inss).toBe(641.51);
    expect(res.baseIrrf).toBe(5358.49); // DEDUCAO_LEGAL (641.51 > 607.20)
    expect(res.impostoTabela).toBe(564.85);
    expect(res.reducaoLei15270).toBe(179.75);
    expect(res.irrf).toBe(385.1);
    expect(res.valorLiquido).toBe(4973.39);
  });

  it('5. Limite superior redução gradual: R$ 7.350,00', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 7350.0 }, PARAMS_2026);
    expect(res.inss).toBe(830.51);
    expect(res.reducaoLei15270).toBe(0);
    expect(res.irrf).toBe(res.impostoTabela);
  });

  it('6. Acima da faixa de redução: R$ 7.350,01', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 7350.01 }, PARAMS_2026);
    expect(res.reducaoLei15270).toBe(0);
    expect(res.irrf).toBe(res.impostoTabela);
  });

  it('7. Salário acima do teto INSS 2026 (R$ 12.000,00 -> INSS = 988,09)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 12000.0 }, PARAMS_2026);
    expect(res.inss).toBe(988.09);
    expect(res.fgts).toBe(960.0);
  });

  it('8. Com 2 dependentes (R$ 8.000,00)', () => {
    const semDep = calcularFolhaEmpregado({ salarioBase: 8000.0, dependentes: 0 }, PARAMS_2026);
    const comDep = calcularFolhaEmpregado({ salarioBase: 8000.0, dependentes: 2 }, PARAMS_2026);
    expect(comDep.baseIrrf).toBe(6699.31);
    expect(comDep.irrf).toBe(933.58);
    expect(comDep.irrf).toBeLessThan(semDep.irrf);
  });

  it('9. Comparação dedução legal vs simplificado (R$ 5.200,00 sem dependentes)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 5200.0, dependentes: 0 }, PARAMS_2026);
    expect(res.inss).toBe(529.51);
    expect(res.metodoIrrf).toBe('DESCONTO_SIMPLIFICADO'); // 607.20 > 529.51
    expect(res.baseIrrf).toBe(4592.8);
    expect(res.impostoTabela).toBe(357.89);
    expect(res.reducaoLei15270).toBe(286.27);
    expect(res.irrf).toBe(71.62);
  });

  it('10. Hora extra 50% e 100% (R$ 2.200,00 + 10h 50% + 5h 100%)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 2200.0, horasExtras50: 10, horasExtras100: 5 }, PARAMS_2026);
    expect(res.valorHorasExtras50).toBe(150.0);
    expect(res.valorHorasExtras100).toBe(100.0);
    expect(res.totalProventos).toBe(2450.0);
  });

  it('11. Falta com reflexo no DSR (R$ 3.000,00 com 1 dia de falta)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 3000.0, faltasDias: 1 }, PARAMS_2026);
    expect(res.descontoFaltasEDsr).toBe(200.0);
  });

  it('12. Admissão no meio do mês (15 dias em R$ 3.000,00)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 3000.0, diasTrabalhados: 15 }, PARAMS_2026);
    expect(res.salarioProporcional).toBe(1500.0);
  });

  it('13. Vale-transporte limitado a 6% (R$ 2.000,00, custo R$ 300,00)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 2000.0, optanteValeTransporte: true, custoValeTransporte: 300.0 }, PARAMS_2026);
    expect(res.descontoValeTransporte).toBe(120.0);
  });

  it('14. Afastamento com dias proporcionais (10 dias em R$ 4.500,00)', () => {
    const res = calcularFolhaEmpregado({ salarioBase: 4500.0, diasTrabalhados: 10 }, PARAMS_2026);
    expect(res.salarioProporcional).toBe(1500.0);
    expect(res.inss).toBe(112.5);
  });
});
