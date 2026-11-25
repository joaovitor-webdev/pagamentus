export function validarCpf(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(limpo[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== Number(limpo[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(limpo[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === Number(limpo[10]);
}

export function validarCnpj(cnpj: string): boolean {
  const limpo = cnpj.replace(/\D/g, '');
  if (limpo.length !== 14 || /^(\d)\1+$/.test(limpo)) return false;

  const calc = (base: string, pesos: number[]) => {
    const soma = base
      .split('')
      .reduce((acc, num, idx) => acc + Number(num) * pesos[idx], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calc(limpo.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(limpo.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(limpo[12]) && d2 === Number(limpo[13]);
}
