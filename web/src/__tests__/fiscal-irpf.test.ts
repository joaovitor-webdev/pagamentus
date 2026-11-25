import { describe, it, expect } from 'vitest';
import {
  calcularSimplesNacional,
  calcularLucroPresumido,
  calcularComparadorIRPF,
  FaixaSimples,
  ParamPresumido,
  FaixaIRPFAnual,
} from '../lib/fiscal/motor';

const FAIXAS_SIMPLES: FaixaSimples[] = [
  { anexo: 'II', faixa: 1, rbt12_min: 0, rbt12_max: 180000, aliquota_nominal: 0.045, parcela_deduzir: 0 },
  { anexo: 'III', faixa: 1, rbt12_min: 0, rbt12_max: 180000, aliquota_nominal: 0.06, parcela_deduzir: 0 },
  { anexo: 'III', faixa: 2, rbt12_min: 180000.01, rbt12_max: 360000, aliquota_nominal: 0.112, parcela_deduzir: 9360 },
  { anexo: 'IV', faixa: 1, rbt12_min: 0, rbt12_max: 180000, aliquota_nominal: 0.045, parcela_deduzir: 0 },
  { anexo: 'V', faixa: 1, rbt12_min: 0, rbt12_max: 180000, aliquota_nominal: 0.155, parcela_deduzir: 0 },
  { anexo: 'V', faixa: 2, rbt12_min: 180000.01, rbt12_max: 360000, aliquota_nominal: 0.18, parcela_deduzir: 4500 },
];

const PARAMS_PRESUMIDO: ParamPresumido = {
  presuncao_irpj: 0.32,
  presuncao_csll: 0.32,
  aliquota_irpj: 0.15,
  adicional_irpj: 0.1,
  limite_adicional_trimestral: 60000,
  aliquota_csll: 0.09,
  aliquota_pis: 0.0065,
  aliquota_cofins: 0.03,
  aliquota_iss_padrao: 0.05,
  cbs_teste_2026: 0.009,
  ibs_teste_2026: 0.001,
};

const TABELA_IRPF_2025: FaixaIRPFAnual[] = [
  { ano_calendario: 2025, faixa: 1, base_min: 0, base_max: 27110.4, aliquota: 0, parcela_deduzir: 0, deducao_dependente_anual: 2275.08, limite_educacao_anual: 3561.5, limite_previdencia_pct: 0.12, desconto_simplificado_pct: 0.2, limite_desconto_simplificado_anual: 16754.34 },
  { ano_calendario: 2025, faixa: 2, base_min: 27110.41, base_max: 33919.8, aliquota: 0.075, parcela_deduzir: 2033.28, deducao_dependente_anual: 2275.08, limite_educacao_anual: 3561.5, limite_previdencia_pct: 0.12, desconto_simplificado_pct: 0.2, limite_desconto_simplificado_anual: 16754.34 },
  { ano_calendario: 2025, faixa: 3, base_min: 33919.81, base_max: 45012.6, aliquota: 0.15, parcela_deduzir: 4577.27, deducao_dependente_anual: 2275.08, limite_educacao_anual: 3561.5, limite_previdencia_pct: 0.12, desconto_simplificado_pct: 0.2, limite_desconto_simplificado_anual: 16754.34 },
  { ano_calendario: 2025, faixa: 4, base_min: 45012.61, base_max: 55976.16, aliquota: 0.225, parcela_deduzir: 7953.21, deducao_dependente_anual: 2275.08, limite_educacao_anual: 3561.5, limite_previdencia_pct: 0.12, desconto_simplificado_pct: 0.2, limite_desconto_simplificado_anual: 16754.34 },
  { ano_calendario: 2025, faixa: 5, base_min: 55976.17, base_max: null, aliquota: 0.275, parcela_deduzir: 10752.02, deducao_dependente_anual: 2275.08, limite_educacao_anual: 3561.5, limite_previdencia_pct: 0.12, desconto_simplificado_pct: 0.2, limite_desconto_simplificado_anual: 16754.34 },
];

const TABELA_IRPF_2026: FaixaIRPFAnual[] = [
  {
    ano_calendario: 2026,
    faixa: 1,
    base_min: 0,
    base_max: 29145.6,
    aliquota: 0,
    parcela_deduzir: 0,
    deducao_dependente_anual: 2275.08,
    limite_educacao_anual: 3561.5,
    limite_previdencia_pct: 0.12,
    desconto_simplificado_pct: 0.2,
    limite_desconto_simplificado_anual: 17640,
    reducao_limite_isencao: 60000,
    reducao_limite_faixa: 88200,
    reducao_maxima: 2694.15,
    reducao_constante: 8429.73,
    reducao_fator: 0.095575,
  },
  {
    faixa: 2,
    base_min: 29145.61,
    base_max: 33919.8,
    aliquota: 0.075,
    parcela_deduzir: 2185.92,
    deducao_dependente_anual: 2275.08,
    limite_educacao_anual: 3561.5,
    limite_previdencia_pct: 0.12,
    desconto_simplificado_pct: 0.2,
    limite_desconto_simplificado_anual: 17640,
  },
  {
    faixa: 3,
    base_min: 33919.81,
    base_max: 45012.6,
    aliquota: 0.15,
    parcela_deduzir: 4729.91,
    deducao_dependente_anual: 2275.08,
    limite_educacao_anual: 3561.5,
    limite_previdencia_pct: 0.12,
    desconto_simplificado_pct: 0.2,
    limite_desconto_simplificado_anual: 17640,
  },
  {
    faixa: 4,
    base_min: 45012.61,
    base_max: 55976.16,
    aliquota: 0.225,
    parcela_deduzir: 8105.85,
    deducao_dependente_anual: 2275.08,
    limite_educacao_anual: 3561.5,
    limite_previdencia_pct: 0.12,
    desconto_simplificado_pct: 0.2,
    limite_desconto_simplificado_anual: 17640,
  },
  {
    faixa: 5,
    base_min: 55976.17,
    base_max: null,
    aliquota: 0.275,
    parcela_deduzir: 10904.66,
    deducao_dependente_anual: 2275.08,
    limite_educacao_anual: 3561.5,
    limite_previdencia_pct: 0.12,
    desconto_simplificado_pct: 0.2,
    limite_desconto_simplificado_anual: 17640,
  },
];

describe('Motor Fiscal e IRPF 2026', () => {
  it('(a) Presumido serviços, receita trimestral R$ 45.000,00 (15.000/mês), sem adicional', () => {
    const res = calcularLucroPresumido({
      receitaMensal: 15000,
      receitaTrimestral: 45000,
      params: PARAMS_PRESUMIDO,
    });
    expect(res.mensal.iss).toBe(750);
    expect(res.mensal.pis).toBe(97.5);
    expect(res.mensal.cofins).toBe(450);
    expect(res.trimestral.baseIrpj).toBe(14400);
    expect(res.trimestral.irpjAdicional).toBe(0);
    expect(res.trimestral.irpjTotal).toBe(2160);
    expect(res.trimestral.csll).toBe(1296);
  });

  it('(b) Presumido com receita trimestral que ultrapassa o limite do adicional (R$ 250.000,00 -> base 80.000,00)', () => {
    const res = calcularLucroPresumido({
      receitaMensal: 83333.33,
      receitaTrimestral: 250000,
      params: PARAMS_PRESUMIDO,
    });
    expect(res.trimestral.baseIrpj).toBe(80000);
    expect(res.trimestral.irpjBasico).toBe(12000);
    expect(res.trimestral.irpjAdicional).toBe(2000);
    expect(res.trimestral.irpjTotal).toBe(14000);
  });

  it('(c) Simples Anexo III com RBT12 de R$ 180.000,00 e receita mês R$ 15.000,00', () => {
    const res = calcularSimplesNacional({
      rbt12: 180000,
      receitaMes: 15000,
      faixas: FAIXAS_SIMPLES,
      anexoPadrao: 'III',
    });
    expect(res.anexoAplicado).toBe('III');
    expect(res.aliquotaEfetiva).toBe(0.06);
    expect(res.das).toBe(900);
  });

  it('(d) Fator R abaixo (<28% -> Anexo V) e acima (>=28% -> Anexo III)', () => {
    const abaixo = calcularSimplesNacional({
      rbt12: 180000,
      receitaMes: 15000,
      folha12m: 36000, // 20%
      sujeitoFatorR: true,
      faixas: FAIXAS_SIMPLES,
    });
    expect(abaixo.anexoAplicado).toBe('V');
    expect(abaixo.das).toBe(2325);

    const acima = calcularSimplesNacional({
      rbt12: 180000,
      receitaMes: 15000,
      folha12m: 54000, // 30%
      sujeitoFatorR: true,
      faixas: FAIXAS_SIMPLES,
    });
    expect(acima.anexoAplicado).toBe('III');
    expect(acima.das).toBe(900);
  });

  it('(e) IRPF com vantagem do simplificado vs vantagem do completo', () => {
    const vantSimplificado = calcularComparadorIRPF({
      rendimentosTributaveis: 80000,
      inss: 5000,
      dependentes: 0,
      saude: 0,
      educacao: 0,
      previdenciaPrivada: 0,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2026,
    });
    expect(vantSimplificado.maisVantajoso).toBe('SIMPLIFICADO');
    expect(vantSimplificado.simplificado.desconto).toBe(16000);

    const vantCompleto = calcularComparadorIRPF({
      rendimentosTributaveis: 120000,
      inss: 10000,
      dependentes: 2,
      saude: 12000,
      educacao: 10000,
      previdenciaPrivada: 10000,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2026,
    });
    expect(vantCompleto.maisVantajoso).toBe('COMPLETO');
  });

  it('(f) LC 224/2025: serviços 1.500.000 sem acréscimo vs 2.000.000 com acréscimo só sobre excedente de 1.250.000', () => {
    const semAcrescimo = calcularLucroPresumido({
      receitaMensal: 500000,
      receitaTrimestral: 1500000,
      params: PARAMS_PRESUMIDO,
      aplicarLc224: false,
    });
    expect(semAcrescimo.trimestral.baseIrpj).toBe(480000);

    const comAcrescimo = calcularLucroPresumido({
      receitaMensal: 666666.67,
      receitaTrimestral: 2000000,
      params: PARAMS_PRESUMIDO,
      aplicarLc224: true,
    });
    expect(comAcrescimo.trimestral.parcelaNormal).toBe(1250000);
    expect(comAcrescimo.trimestral.parcelaExcedente).toBe(750000);
    // 1.250.000 * 32% + 750.000 * 35,2% = 400.000 + 264.000 = 664.000
    expect(comAcrescimo.trimestral.baseIrpj).toBe(664000);
  });

  it('(g) Simples Nacional Anexos II e IV', () => {
    const anexoII = calcularSimplesNacional({
      rbt12: 180000,
      receitaMes: 10000,
      faixas: FAIXAS_SIMPLES,
      anexoPadrao: 'II',
    });
    expect(anexoII.das).toBe(450);

    const anexoIV = calcularSimplesNacional({
      rbt12: 180000,
      receitaMes: 10000,
      faixas: FAIXAS_SIMPLES,
      anexoPadrao: 'IV',
    });
    expect(anexoIV.das).toBe(450);
  });

  it('(h) IRPF 2026 (55k zero, 70k redução parcial, 100k sem redução) e 2025 (55k sem redução)', () => {
    const r2026_55k = calcularComparadorIRPF({
      rendimentosTributaveis: 55000,
      inss: 0,
      dependentes: 0,
      saude: 0,
      educacao: 0,
      previdenciaPrivada: 0,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2026,
    });
    expect(r2026_55k.simplificado.impostoDevido).toBe(0);

    const r2026_70k = calcularComparadorIRPF({
      rendimentosTributaveis: 70000,
      inss: 0,
      dependentes: 0,
      saude: 0,
      educacao: 0,
      previdenciaPrivada: 0,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2026,
    });
    expect(r2026_70k.simplificado.reducaoLei15270).toBeGreaterThan(0);
    expect(r2026_70k.simplificado.impostoDevido).toBeLessThan(r2026_70k.simplificado.impostoAntesReducao);

    const r2026_100k = calcularComparadorIRPF({
      rendimentosTributaveis: 100000,
      inss: 0,
      dependentes: 0,
      saude: 0,
      educacao: 0,
      previdenciaPrivada: 0,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2026,
    });
    expect(r2026_100k.simplificado.reducaoLei15270).toBe(0);

    const r2025_55k = calcularComparadorIRPF({
      rendimentosTributaveis: 55000,
      inss: 0,
      dependentes: 0,
      saude: 0,
      educacao: 0,
      previdenciaPrivada: 0,
      livroCaixa: 0,
      irRetido: 0,
      tabelaAnual: TABELA_IRPF_2025,
    });
    expect(r2025_55k.simplificado.reducaoLei15270).toBe(0);
    expect(r2025_55k.simplificado.impostoDevido).toBeGreaterThan(0);
  });
});
