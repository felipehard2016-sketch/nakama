import { describe, it, expect } from 'vitest';
import { computeTopGenres, excludeTracked } from './recommendations';

function entry(genres) {
  return { media_items: { metadata: { genres } } };
}

describe('computeTopGenres', () => {
  it('ordena por frequência, do mais comum pro menos', () => {
    const entries = [entry(['Action', 'Drama']), entry(['Action']), entry(['Romance'])];
    expect(computeTopGenres(entries, 2)).toEqual(['Action', 'Drama']);
  });

  it('respeita o limite pedido', () => {
    const entries = [entry(['Action']), entry(['Drama']), entry(['Romance'])];
    expect(computeTopGenres(entries, 1)).toHaveLength(1);
  });

  it('lista vazia retorna array vazio, sem quebrar', () => {
    expect(computeTopGenres([])).toEqual([]);
  });

  it('entrada sem metadata.genres (item adicionado só pelo botão rápido) não quebra', () => {
    const entries = [{ media_items: { metadata: {} } }, { media_items: {} }, entry(['Action'])];
    expect(computeTopGenres(entries)).toEqual(['Action']);
  });
});

describe('excludeTracked', () => {
  it('remove os ids que já estão na lista pessoal', () => {
    const media = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const tracked = new Set(['2']);
    expect(excludeTracked(media, tracked).map(m => m.id)).toEqual([1, 3]);
  });

  it('sem nada rastreado, devolve a lista inteira', () => {
    const media = [{ id: 1 }, { id: 2 }];
    expect(excludeTracked(media, new Set())).toHaveLength(2);
  });
});
