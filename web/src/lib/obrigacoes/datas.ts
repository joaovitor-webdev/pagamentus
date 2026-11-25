export function calcularPascoaMeeusButcher(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia)).toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function gerarFeriadosMoveisAno(ano: number) {
  const pascoa = calcularPascoaMeeusButcher(ano);
  return {
    pascoa,
    carnavalSegunda: addDaysIso(pascoa, -48),
    carnavalTerca: addDaysIso(pascoa, -47),
    sextaFeiraSanta: addDaysIso(pascoa, -2),
    corpusChristi: addDaysIso(pascoa, 60),
  };
}

export function gerarFeriadosNacionaisAno(ano: number): string[] {
  const m = gerarFeriadosMoveisAno(ano);
  return [
    `${ano}-01-01`,
    m.carnavalSegunda,
    m.carnavalTerca,
    m.sextaFeiraSanta,
    `${ano}-04-21`,
    `${ano}-05-01`,
    m.corpusChristi,
    `${ano}-09-07`,
    `${ano}-10-12`,
    `${ano}-11-02`,
    `${ano}-11-15`,
    `${ano}-11-20`,
    `${ano}-12-25`,
    `${ano}-12-31`,
  ];
}

export function calcularNesimoDiaUtil(
  ano: number,
  mes: number,
  n: number,
  feriadosIso: string[] = gerarFeriadosNacionaisAno(ano)
): string {
  const feriadosSet = new Set(feriadosIso);
  let count = 0;
  let dia = 1;

  while (count < n) {
    const dt = new Date(Date.UTC(ano, mes - 1, dia));
    const dow = dt.getUTCDay();
    const iso = dt.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !feriadosSet.has(iso)) {
      count++;
      if (count === n) return iso;
    }
    dia++;
  }
  return '';
}
