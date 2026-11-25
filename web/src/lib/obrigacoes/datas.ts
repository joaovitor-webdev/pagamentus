export function calcularNesimoDiaUtil(
  ano: number,
  mes: number,
  n: number,
  feriadosIso: string[]
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
