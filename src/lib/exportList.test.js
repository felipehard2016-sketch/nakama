import { describe, it, expect } from 'vitest';
import { listToCSV, listToJSON } from './exportList';

function entry(overrides = {}) {
  return {
    status: 'watching', progress: 12, rating: 8.5, favorite: true, updated_at: '2026-01-01T00:00:00Z',
    media_items: { title: 'Ronin Eclipse', type: 'anime' },
    ...overrides,
  };
}

describe('listToCSV', () => {
  it('inclui cabeçalho e uma linha por entrada', () => {
    const csv = listToCSV([entry()]);
    const lines = csv.replace(/^\uFEFF/, '').split('\r\n');
    expect(lines[0]).toBe('titulo,tipo,status,progresso,nota,favorito,atualizado_em');
    expect(lines[1]).toContain('Ronin Eclipse');
    expect(lines[1]).toContain('Assistindo'); // status já traduzido, não o slug em inglês
  });

  it('coloca entre aspas e escapa aspas internas em título com vírgula', () => {
    const csv = listToCSV([entry({ media_items: { title: 'Título, com "aspas"', type: 'anime' } })]);
    expect(csv).toContain('"Título, com ""aspas"""');
  });

  it('lista vazia gera só o cabeçalho', () => {
    const lines = listToCSV([]).replace(/^\uFEFF/, '').split('\r\n');
    expect(lines).toHaveLength(1);
  });

  it('nota ausente vira campo vazio, não a string "null"', () => {
    const csv = listToCSV([entry({ rating: null })]);
    const cols = csv.split('\r\n')[1].split(',');
    expect(cols[4]).toBe('');
  });
});

describe('listToJSON', () => {
  it('produz um array com os campos certos', () => {
    const json = JSON.parse(listToJSON([entry()]));
    expect(json).toEqual([{
      titulo: 'Ronin Eclipse', tipo: 'anime', status: 'watching',
      progresso: 12, nota: 8.5, favorito: true, atualizado_em: '2026-01-01T00:00:00Z',
    }]);
  });

  it('lista vazia gera array vazio', () => {
    expect(JSON.parse(listToJSON([]))).toEqual([]);
  });
});
