import { describe, it, expect } from 'vitest';
import { levelFromEpisodes, labelForLevel } from './leveling';

describe('levelFromEpisodes', () => {
  it('começa no nível 1 (Novato) com zero episódios', () => {
    expect(levelFromEpisodes(0)).toEqual({ min: 0, level: 1, label: 'Novato' });
    expect(levelFromEpisodes()).toEqual({ min: 0, level: 1, label: 'Novato' });
  });

  it('usa o limite exato de uma faixa como já pertencente a ela (>=, não >)', () => {
    expect(levelFromEpisodes(100).level).toBe(2);
    expect(levelFromEpisodes(99).level).toBe(1);
  });

  it('sobe pelas faixas intermediárias corretamente', () => {
    expect(levelFromEpisodes(300).level).toBe(3);
    expect(levelFromEpisodes(700).level).toBe(4);
    expect(levelFromEpisodes(1500).level).toBe(5);
    expect(levelFromEpisodes(3000).level).toBe(6);
  });

  it('não passa do nível máximo mesmo com um número muito alto', () => {
    expect(levelFromEpisodes(999999)).toEqual({ min: 6000, level: 7, label: 'Otaku' });
  });
});

describe('labelForLevel', () => {
  it('retorna o rótulo certo para cada nível conhecido', () => {
    expect(labelForLevel(1)).toBe('Novato');
    expect(labelForLevel(7)).toBe('Otaku');
  });

  it('cai em "Novato" para um nível desconhecido, em vez de undefined', () => {
    expect(labelForLevel(99)).toBe('Novato');
    expect(labelForLevel(undefined)).toBe('Novato');
  });
});
