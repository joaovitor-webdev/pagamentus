import Decimal from 'decimal.js';

export interface FaixaTabela {
  ordem: number;
  limiteInferior: number;
  limiteSuperior: number | null;
  aliquota: number;
  parcelaDeduzir: number;
}

export interface ParametrosFolha {
  salarioMinimo: number;
  aliquotaFgts: number;
  tetoValeTransportePercentual: number;
  faixasInss: FaixaTabela[];
  faixasIrrf: FaixaTabela[];
  deducaoPorDependente: number;
  descontoSimplificadoMensal: number;
  isencaoIrrf2026: number;
  redutorIrrfLimiteSuperior2026: number;
  redutorIrrfValorBase2026: number;
  redutorIrrfFator2026: number;
}

export interface ParametroLegalBanco {
  vigencia_inicio: string;
  vigencia_fim: string | null;
  tipo: string;
  faixa_ordem: number;
  limite_inferior: number;
  limite_superior: number | null;
  aliquota: number;
  parcela_deduzir: number;
  valor_fixo: number;
}

export interface EntradaCalculoFolha {
  salarioBase: number;
  diasTrabalhados?: number;
  horasExtras50?: number;
  horasExtras100?: number;
  bonus?: number;
  faltasDias?: number;
  dependentes?: number;
  optanteValeTransporte?: boolean;
  custoValeTransporte?: number;
  jornadaMensalHoras?: number;
}

export interface MemoriaCalculoFolha {
  salarioProporcional: number;
  valorHorasExtras50: number;
  valorHorasExtras100: number;
  bonus: number;
  totalProventos: number;
  descontoFaltasEDsr: number;
  descontoValeTransporte: number;
  inss: number;
  faixaInssAliquota: number;
  baseIrrf: number;
  metodoIrrf: 'DEDUCAO_LEGAL' | 'DESCONTO_SIMPLIFICADO';
  impostoTabela: number;
  reducaoLei15270: number;
  irrf: number;
  totalDescontos: number;
  valorLiquido: number;
  fgts: number;
}

function roundRubrica(valor: Decimal): number {
  return valor.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function selecionarParametrosPorCompetencia(
  competencia: string,
  registros: ParametroLegalBanco[]
): ParametrosFolha {
  const ano = competencia.slice(0, 4);
  const dataRef = `${competencia}-01`;
  const vigentes = registros.filter(
    (r) => r.vigencia_inicio <= dataRef && (!r.vigencia_fim || r.vigencia_fim >= dataRef)
  );

  if (vigentes.length === 0) {
    throw new Error(`Cadastre os parâmetros legais de ${ano}`);
  }

  const getFixo = (tipo: string) =>
    Number(vigentes.find((r) => r.tipo === tipo)?.valor_fixo ?? 0);
  const getAliquota = (tipo: string) =>
    Number(vigentes.find((r) => r.tipo === tipo)?.aliquota ?? 0);

  const faixasInss: FaixaTabela[] = vigentes
    .filter((r) => r.tipo === 'INSS_FAIXA')
    .sort((a, b) => a.faixa_ordem - b.faixa_ordem)
    .map((r) => ({
      ordem: r.faixa_ordem,
      limiteInferior: Number(r.limite_inferior),
      limiteSuperior: r.limite_superior !== null ? Number(r.limite_superior) : null,
      aliquota: Number(r.aliquota),
      parcelaDeduzir: Number(r.parcela_deduzir),
    }));

  const faixasIrrf: FaixaTabela[] = vigentes
    .filter((r) => r.tipo === 'IRRF_FAIXA')
    .sort((a, b) => a.faixa_ordem - b.faixa_ordem)
    .map((r) => ({
      ordem: r.faixa_ordem,
      limiteInferior: Number(r.limite_inferior),
      limiteSuperior: r.limite_superior !== null ? Number(r.limite_superior) : null,
      aliquota: Number(r.aliquota),
      parcelaDeduzir: Number(r.parcela_deduzir),
    }));

  const redutor = vigentes.find((r) => r.tipo === 'IRRF_REDUTOR_2026');

  return {
    salarioMinimo: getFixo('SALARIO_MINIMO'),
    aliquotaFgts: getAliquota('FGTS_ALIQUOTA'),
    tetoValeTransportePercentual: getAliquota('VALE_TRANSPORTE_TETO'),
    faixasInss,
    faixasIrrf,
    deducaoPorDependente: getFixo('IRRF_DEDUCAO_DEPENDENTE'),
    descontoSimplificadoMensal: getFixo('IRRF_DESCONTO_SIMPLIFICADO'),
    isencaoIrrf2026: getFixo('IRRF_ISENCAO_2026'),
    redutorIrrfLimiteSuperior2026: Number(redutor?.limite_superior ?? 7350),
    redutorIrrfValorBase2026: Number(redutor?.valor_fixo ?? 978.62),
    redutorIrrfFator2026: 0.133145,
  };
}

export function calcularInssProgressivo(
  base: number,
  faixas: FaixaTabela[]
): { valor: number; aliquotaAplicada: number } {
  if (base <= 0 || faixas.length === 0) return { valor: 0, aliquotaAplicada: 0 };
  const ordenadas = [...faixas].sort((a, b) => a.ordem - b.ordem);
  const teto = ordenadas[ordenadas.length - 1].limiteSuperior ?? base;
  const baseLimitada = Decimal.min(new Decimal(base), new Decimal(teto));

  let faixaAplicada = ordenadas[0];
  for (const f of ordenadas) {
    if (baseLimitada.gte(f.limiteInferior)) {
      faixaAplicada = f;
    }
  }

  const inss = baseLimitada
    .times(new Decimal(faixaAplicada.aliquota).div(100))
    .minus(new Decimal(faixaAplicada.parcelaDeduzir));

  return {
    valor: Math.max(0, roundRubrica(inss)),
    aliquotaAplicada: faixaAplicada.aliquota,
  };
}

export function calcularIrrf2026(
  remuneracaoTributavelBruta: number,
  inss: number,
  dependentes: number,
  params: ParametrosFolha
): {
  baseIrrf: number;
  metodo: 'DEDUCAO_LEGAL' | 'DESCONTO_SIMPLIFICADO';
  impostoTabela: number;
  reducaoLei15270: number;
  irrfFinal: number;
} {
  const brutoDec = new Decimal(remuneracaoTributavelBruta);
  const deducaoLegalTotal = new Decimal(inss).plus(
    new Decimal(dependentes).times(params.deducaoPorDependente)
  );
  const simplificadoDec = new Decimal(params.descontoSimplificadoMensal);
  const usaSimplificado = simplificadoDec.gt(deducaoLegalTotal);
  const metodo = usaSimplificado ? 'DESCONTO_SIMPLIFICADO' : 'DEDUCAO_LEGAL';

  const baseIrrfDec = Decimal.max(
    0,
    brutoDec.minus(usaSimplificado ? simplificadoDec : deducaoLegalTotal)
  );
  const baseIrrf = roundRubrica(baseIrrfDec);

  const ordenadas = [...params.faixasIrrf].sort((a, b) => a.ordem - b.ordem);
  let faixa = ordenadas[0];
  for (const f of ordenadas) {
    if (baseIrrf >= f.limiteInferior) {
      faixa = f;
    }
  }

  const impostoTabelaDec = Decimal.max(
    0,
    new Decimal(baseIrrf)
      .times(new Decimal(faixa.aliquota).div(100))
      .minus(new Decimal(faixa.parcelaDeduzir))
  );
  const impostoTabela = roundRubrica(impostoTabelaDec);

  let reducaoLei15270 = 0;
  if (brutoDec.lte(params.isencaoIrrf2026)) {
    reducaoLei15270 = impostoTabela;
  } else if (brutoDec.lte(params.redutorIrrfLimiteSuperior2026)) {
    const redutorDec = new Decimal(params.redutorIrrfValorBase2026).minus(
      new Decimal(params.redutorIrrfFator2026).times(brutoDec)
    );
    reducaoLei15270 = Math.min(impostoTabela, Math.max(0, roundRubrica(redutorDec)));
  }

  const irrfFinal = Math.max(
    0,
    roundRubrica(new Decimal(impostoTabela).minus(new Decimal(reducaoLei15270)))
  );

  return {
    baseIrrf,
    metodo,
    impostoTabela,
    reducaoLei15270,
    irrfFinal,
  };
}

export function calcularFolhaEmpregado(
  entrada: EntradaCalculoFolha,
  params: ParametrosFolha
): MemoriaCalculoFolha {
  const salBase = new Decimal(entrada.salarioBase);
  const dias = new Decimal(entrada.diasTrabalhados ?? 30);
  const jornada = new Decimal(entrada.jornadaMensalHoras ?? 220);

  const salarioProporcional = roundRubrica(salBase.div(30).times(dias));
  const valorHora = salBase.div(jornada);

  const valorHorasExtras50 = roundRubrica(
    new Decimal(entrada.horasExtras50 ?? 0).times(valorHora).times(1.5)
  );
  const valorHorasExtras100 = roundRubrica(
    new Decimal(entrada.horasExtras100 ?? 0).times(valorHora).times(2.0)
  );
  const bonus = roundRubrica(new Decimal(entrada.bonus ?? 0));

  const faltasDias = new Decimal(entrada.faltasDias ?? 0);
  const descontoFaltasEDsr = faltasDias.gt(0)
    ? roundRubrica(salBase.div(30).times(faltasDias).times(2))
    : 0;

  const totalProventos = roundRubrica(
    new Decimal(salarioProporcional)
      .plus(valorHorasExtras50)
      .plus(valorHorasExtras100)
      .plus(bonus)
  );

  const basePrevidenciaria = Math.max(
    0,
    roundRubrica(new Decimal(totalProventos).minus(descontoFaltasEDsr))
  );

  const { valor: inss, aliquotaAplicada: faixaInssAliquota } = calcularInssProgressivo(
    basePrevidenciaria,
    params.faixasInss
  );

  const irrfRes = calcularIrrf2026(
    basePrevidenciaria,
    inss,
    entrada.dependentes ?? 0,
    params
  );

  let descontoValeTransporte = 0;
  if (entrada.optanteValeTransporte) {
    const tetoVt = roundRubrica(
      new Decimal(salarioProporcional).times(
        new Decimal(params.tetoValeTransportePercentual).div(100)
      )
    );
    descontoValeTransporte = Math.min(tetoVt, entrada.custoValeTransporte ?? tetoVt);
  }

  const totalDescontos = roundRubrica(
    new Decimal(descontoFaltasEDsr)
      .plus(descontoValeTransporte)
      .plus(inss)
      .plus(irrfRes.irrfFinal)
  );
  const valorLiquido = roundRubrica(new Decimal(totalProventos).minus(totalDescontos));
  const fgts = roundRubrica(
    new Decimal(basePrevidenciaria).times(new Decimal(params.aliquotaFgts).div(100))
  );

  return {
    salarioProporcional,
    valorHorasExtras50,
    valorHorasExtras100,
    bonus,
    totalProventos,
    descontoFaltasEDsr,
    descontoValeTransporte,
    inss,
    faixaInssAliquota,
    baseIrrf: irrfRes.baseIrrf,
    metodoIrrf: irrfRes.metodo,
    impostoTabela: irrfRes.impostoTabela,
    reducaoLei15270: irrfRes.reducaoLei15270,
    irrf: irrfRes.irrfFinal,
    totalDescontos,
    valorLiquido,
    fgts,
  };
}
