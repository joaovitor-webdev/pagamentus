import Decimal from 'decimal.js';

export interface FaixaSimples {
  anexo: 'I' | 'II' | 'III' | 'IV' | 'V';
  faixa: number;
  rbt12_min: number;
  rbt12_max: number;
  aliquota_nominal: number;
  parcela_deduzir: number;
}

export interface ParamPresumido {
  presuncao_irpj: number;
  presuncao_csll: number;
  aliquota_irpj: number;
  adicional_irpj: number;
  limite_adicional_trimestral: number;
  aliquota_csll: number;
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_iss_padrao: number;
  cbs_teste_2026: number;
  ibs_teste_2026: number;
  limite_receita_anual_lc224?: number;
  acrescimo_presuncao_lc224?: number;
}

export interface FaixaIRPFAnual {
  ano_calendario?: number;
  faixa: number;
  base_min: number;
  base_max: number | null;
  aliquota: number;
  parcela_deduzir: number;
  deducao_dependente_anual: number;
  limite_educacao_anual: number;
  limite_previdencia_pct: number;
  desconto_simplificado_pct: number;
  limite_desconto_simplificado_anual: number;
  reducao_limite_isencao?: number | null;
  reducao_limite_faixa?: number | null;
  reducao_maxima?: number | null;
  reducao_constante?: number | null;
  reducao_fator?: number | null;
}

function round2(d: Decimal): number {
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function calcularSimplesNacional(input: {
  rbt12: number;
  receitaMes: number;
  folha12m?: number;
  sujeitoFatorR?: boolean;
  faixas: FaixaSimples[];
  anexoPadrao?: 'I' | 'II' | 'III' | 'IV' | 'V';
}) {
  const rbt12 = new Decimal(input.rbt12 || 0);
  const receitaMes = new Decimal(input.receitaMes || 0);
  const folha12m = new Decimal(input.folha12m || 0);

  const fatorR = rbt12.gt(0) ? folha12m.div(rbt12) : new Decimal(0);
  let anexoAplicado = input.anexoPadrao || 'III';
  if (input.sujeitoFatorR) {
    anexoAplicado = fatorR.gte(0.28) ? 'III' : 'V';
  }

  const faixasAnexo = input.faixas
    .filter((f) => f.anexo === anexoAplicado)
    .sort((a, b) => a.faixa - b.faixa);

  const faixa =
    faixasAnexo.find((f) => rbt12.gte(f.rbt12_min) && rbt12.lte(f.rbt12_max)) ||
    faixasAnexo[faixasAnexo.length - 1];

  if (!faixa) {
    throw new Error(`Nenhuma faixa encontrada para o Anexo ${anexoAplicado}.`);
  }

  const aliqNominal = new Decimal(faixa.aliquota_nominal);
  const parcelaDeduzir = new Decimal(faixa.parcela_deduzir);
  const aliqEfetiva = rbt12.gt(0)
    ? rbt12.mul(aliqNominal).minus(parcelaDeduzir).div(rbt12)
    : aliqNominal;

  const das = round2(receitaMes.mul(aliqEfetiva));

  return {
    anexoAplicado,
    fatorR: fatorR.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    faixa: faixa.faixa,
    aliquotaNominal: aliqNominal.toNumber(),
    parcelaDeduzir: parcelaDeduzir.toNumber(),
    aliquotaEfetiva: aliqEfetiva.toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toNumber(),
    das,
  };
}

export function calcularLucroPresumido(input: {
  receitaMensal: number;
  receitaTrimestral: number;
  params: ParamPresumido;
  aplicarLc224?: boolean;
}) {
  const recMes = new Decimal(input.receitaMensal || 0);
  const recTrim = new Decimal(input.receitaTrimestral || 0);
  const p = input.params;

  const iss = round2(recMes.mul(p.aliquota_iss_padrao));
  const pis = round2(recMes.mul(p.aliquota_pis));
  const cofins = round2(recMes.mul(p.aliquota_cofins));
  const cbsInformativo = round2(recMes.mul(p.cbs_teste_2026));
  const ibsInformativo = round2(recMes.mul(p.ibs_teste_2026));

  const limiteTrimLc224 = new Decimal(p.limite_receita_anual_lc224 ?? 5000000).div(4);
  const acrescimo = new Decimal(p.acrescimo_presuncao_lc224 ?? 0.1);
  const parcelaNormal = input.aplicarLc224 ? Decimal.min(recTrim, limiteTrimLc224) : recTrim;
  const parcelaExcedente = input.aplicarLc224 ? Decimal.max(0, recTrim.minus(limiteTrimLc224)) : new Decimal(0);

  const presIrpjExcedente = new Decimal(p.presuncao_irpj).mul(new Decimal(1).plus(acrescimo));
  const presCsllExcedente = new Decimal(p.presuncao_csll).mul(new Decimal(1).plus(acrescimo));

  const baseIrpj = parcelaNormal.mul(p.presuncao_irpj).plus(parcelaExcedente.mul(presIrpjExcedente));
  const irpjBasico = baseIrpj.mul(p.aliquota_irpj);
  const excedente = Decimal.max(0, baseIrpj.minus(p.limite_adicional_trimestral));
  const irpjAdicional = excedente.mul(p.adicional_irpj);
  const irpjTotal = round2(irpjBasico.plus(irpjAdicional));

  const baseCsll = parcelaNormal.mul(p.presuncao_csll).plus(parcelaExcedente.mul(presCsllExcedente));
  const csll = round2(baseCsll.mul(p.aliquota_csll));

  return {
    mensal: { iss, pis, cofins, cbsInformativo, ibsInformativo },
    trimestral: {
      parcelaNormal: round2(parcelaNormal),
      parcelaExcedente: round2(parcelaExcedente),
      baseIrpj: round2(baseIrpj),
      irpjBasico: round2(irpjBasico),
      irpjAdicional: round2(irpjAdicional),
      irpjTotal,
      baseCsll: round2(baseCsll),
      csll,
    },
  };
}

function calcularImpostoTabelaAnual(baseCalculo: Decimal, tabela: FaixaIRPFAnual[]): number {
  const ordenadas = [...tabela].sort((a, b) => a.faixa - b.faixa);
  const faixa =
    ordenadas.find(
      (f) => baseCalculo.gte(f.base_min) && (f.base_max === null || baseCalculo.lte(f.base_max))
    ) || ordenadas[ordenadas.length - 1];

  if (!faixa) return 0;
  const imposto = Decimal.max(0, baseCalculo.mul(faixa.aliquota).minus(faixa.parcela_deduzir));
  return round2(imposto);
}

function calcularReducaoLei15270(rend: Decimal, impostoAntes: number, ref: FaixaIRPFAnual): number {
  if (!ref.reducao_limite_isencao || !ref.reducao_limite_faixa) return 0;
  if (rend.lte(ref.reducao_limite_isencao)) {
    return Math.min(impostoAntes, ref.reducao_maxima ?? impostoAntes);
  }
  if (rend.lte(ref.reducao_limite_faixa)) {
    const red = new Decimal(ref.reducao_constante ?? 0).minus(
      new Decimal(ref.reducao_fator ?? 0).mul(rend)
    );
    return round2(Decimal.max(0, Decimal.min(new Decimal(impostoAntes), red)));
  }
  return 0;
}

export function calcularComparadorIRPF(input: {
  rendimentosTributaveis: number;
  inss: number;
  dependentes: number;
  saude: number;
  educacao: number;
  previdenciaPrivada: number;
  livroCaixa: number;
  irRetido: number;
  tabelaAnual: FaixaIRPFAnual[];
}) {
  const ref = input.tabelaAnual[0];
  if (!ref) throw new Error('Tabela anual do IRPF não informada.');

  const rend = new Decimal(input.rendimentosTributaveis || 0);
  const inss = new Decimal(input.inss || 0);
  const dep = new Decimal(input.dependentes || 0).mul(ref.deducao_dependente_anual);
  const saude = new Decimal(input.saude || 0);
  const limiteEdu = new Decimal(1 + (input.dependentes || 0)).mul(ref.limite_educacao_anual);
  const educacaoDedutivel = Decimal.min(new Decimal(input.educacao || 0), limiteEdu);
  const limitePrev = rend.mul(ref.limite_previdencia_pct);
  const prevDedutivel = Decimal.min(new Decimal(input.previdenciaPrivada || 0), limitePrev);
  const livroCaixa = new Decimal(input.livroCaixa || 0);
  const irRetido = new Decimal(input.irRetido || 0);

  const totalDeducoesLegais = inss.plus(dep).plus(saude).plus(educacaoDedutivel).plus(prevDedutivel).plus(livroCaixa);
  const baseCompleta = Decimal.max(0, rend.minus(totalDeducoesLegais));
  const impostoCompletoAntes = calcularImpostoTabelaAnual(baseCompleta, input.tabelaAnual);
  const reducaoCompleta = calcularReducaoLei15270(rend, impostoCompletoAntes, ref);
  const impostoCompleto = round2(Decimal.max(0, new Decimal(impostoCompletoAntes).minus(reducaoCompleta)));
  const saldoCompleto = round2(new Decimal(impostoCompleto).minus(irRetido));

  const descontoSimplificado = Decimal.min(
    rend.mul(ref.desconto_simplificado_pct),
    new Decimal(ref.limite_desconto_simplificado_anual)
  );
  const baseSimplificada = Decimal.max(0, rend.minus(descontoSimplificado));
  const impostoSimplificadoAntes = calcularImpostoTabelaAnual(baseSimplificada, input.tabelaAnual);
  const reducaoSimplificada = calcularReducaoLei15270(rend, impostoSimplificadoAntes, ref);
  const impostoSimplificado = round2(Decimal.max(0, new Decimal(impostoSimplificadoAntes).minus(reducaoSimplificada)));
  const saldoSimplificado = round2(new Decimal(impostoSimplificado).minus(irRetido));

  const maisVantajoso = impostoSimplificado <= impostoCompleto ? 'SIMPLIFICADO' : 'COMPLETO';

  return {
    completo: {
      deducoes: round2(totalDeducoesLegais),
      baseCalculo: round2(baseCompleta),
      impostoAntesReducao: impostoCompletoAntes,
      reducaoLei15270: reducaoCompleta,
      impostoDevido: impostoCompleto,
      saldoPagarRestituir: saldoCompleto,
    },
    simplificado: {
      desconto: round2(descontoSimplificado),
      baseCalculo: round2(baseSimplificada),
      impostoAntesReducao: impostoSimplificadoAntes,
      reducaoLei15270: reducaoSimplificada,
      impostoDevido: impostoSimplificado,
      saldoPagarRestituir: saldoSimplificado,
    },
    maisVantajoso,
    economia: round2(new Decimal(impostoCompleto - impostoSimplificado).abs()),
  };
}
