import { describe, it, expect } from 'vitest';
import { calcularNesimoDiaUtil } from '../lib/obrigacoes/datas';

const FERIADOS_2026_2027 = [
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-04-03',
  '2026-04-21',
  '2026-05-01',
  '2026-06-04',
  '2026-09-07',
  '2026-10-12',
  '2026-11-02',
  '2026-11-15',
  '2026-11-20',
  '2026-12-25',
  '2026-12-31',
  '2027-01-01',
  '2027-02-08',
  '2027-02-09',
  '2027-03-26',
  '2027-04-02', // caso Sexta-feira Santa simulada em abril/2027
  '2027-04-21',
  '2027-05-01',
  '2027-05-27',
  '2027-09-07',
  '2027-10-12',
  '2027-11-02',
  '2027-11-15',
  '2027-11-20',
  '2027-12-25',
];

describe('Motor de N-ésimo dia útil (EFD-Contribuições)', () => {
  it('10º dia útil de jan/2027 = 15/01/2027 (considerando 01/01/2027 feriado)', () => {
    expect(calcularNesimoDiaUtil(2027, 1, 10, FERIADOS_2026_2027)).toBe('2027-01-15');
  });

  it('10º dia útil de fev/2027 considerando o Carnaval (08 e 09/02/2027) = 16/02/2027', () => {
    expect(calcularNesimoDiaUtil(2027, 2, 10, FERIADOS_2026_2027)).toBe('2027-02-16');
  });

  it('10º dia útil de abr/2026 e abr/2027 considerando Sexta-feira Santa', () => {
    expect(calcularNesimoDiaUtil(2026, 4, 10, FERIADOS_2026_2027)).toBe('2026-04-15');
    expect(calcularNesimoDiaUtil(2027, 4, 10, FERIADOS_2026_2027)).toBe('2027-04-15');
  });
});
