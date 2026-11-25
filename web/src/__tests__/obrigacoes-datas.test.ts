import { describe, it, expect } from 'vitest';
import {
  calcularNesimoDiaUtil,
  gerarFeriadosMoveisAno,
  gerarFeriadosNacionaisAno,
} from '../lib/obrigacoes/datas';

describe('Feriados Móveis (Meeus/Butcher) e N-ésimo dia útil', () => {
  it('calcula Páscoa e feriados móveis de 2026, 2027 e 2028 conforme calendário oficial', () => {
    const f2026 = gerarFeriadosMoveisAno(2026);
    expect(f2026.pascoa).toBe('2026-04-05');
    expect(f2026.carnavalSegunda).toBe('2026-02-16');
    expect(f2026.carnavalTerca).toBe('2026-02-17');
    expect(f2026.sextaFeiraSanta).toBe('2026-04-03');
    expect(f2026.corpusChristi).toBe('2026-06-04');

    const f2027 = gerarFeriadosMoveisAno(2027);
    expect(f2027.pascoa).toBe('2027-03-28');
    expect(f2027.carnavalSegunda).toBe('2027-02-08');
    expect(f2027.carnavalTerca).toBe('2027-02-09');
    expect(f2027.sextaFeiraSanta).toBe('2027-03-26');
    expect(f2027.corpusChristi).toBe('2027-05-27');

    const f2028 = gerarFeriadosMoveisAno(2028);
    expect(f2028.pascoa).toBe('2028-04-16');
    expect(f2028.carnavalSegunda).toBe('2028-02-28');
    expect(f2028.carnavalTerca).toBe('2028-02-29');
    expect(f2028.sextaFeiraSanta).toBe('2028-04-14');
    expect(f2028.corpusChristi).toBe('2028-06-15');
  });

  it('10º dia útil de jan/2027 = 15/01/2027 (considerando 01/01/2027 feriado)', () => {
    expect(calcularNesimoDiaUtil(2027, 1, 10, gerarFeriadosNacionaisAno(2027))).toBe('2027-01-15');
  });

  it('10º dia útil de fev/2027 considerando o Carnaval (08 e 09/02/2027) = 16/02/2027', () => {
    expect(calcularNesimoDiaUtil(2027, 2, 10, gerarFeriadosNacionaisAno(2027))).toBe('2027-02-16');
  });

  it('10º dia útil de abr/2026 (c/ Sexta-feira Santa 03/04/2026) = 15/04/2026 e de abr/2027 (Sexta-feira Santa em 26/03/2027) = 14/04/2027', () => {
    expect(calcularNesimoDiaUtil(2026, 4, 10, gerarFeriadosNacionaisAno(2026))).toBe('2026-04-15');
    expect(calcularNesimoDiaUtil(2027, 4, 10, gerarFeriadosNacionaisAno(2027))).toBe('2027-04-14');
  });
});
