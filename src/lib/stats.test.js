import { describe, it, expect } from 'vitest';
import { computeStats, computeWrappedStats } from './stats';

function animeEntry(overrides = {}) {
  return {
    status: 'watching',
    progress: 12,
    media_items: { type: 'anime', metadata: { duration: 24, genres: ['Ação'] } },
    ...overrides,
  };
}
function mangaEntry(overrides = {}) {
  return {
    status: 'reading',
    progress: 30,
    media_items: { type: 'manga', metadata: { genres: ['Romance'] } },
    ...overrides,
  };
}

describe('computeStats', () => {
  it('lista vazia não quebra e retorna tudo zerado', () => {
    expect(computeStats([])).toEqual({
      totalItems: 0, totalEpisodes: 0, totalChapters: 0,
      hoursWatched: 0, completedCount: 0, topGenres: [],
    });
    expect(computeStats()).toMatchObject({ totalItems: 0 });
  });

  it('soma episódios de anime e capítulos de mangá separadamente', () => {
    const s = computeStats([animeEntry({ progress: 12 }), mangaEntry({ progress: 30 })]);
    expect(s.totalEpisodes).toBe(12);
    expect(s.totalChapters).toBe(30);
  });

  it('usa 24min/episódio como padrão quando a duração não vem da AniList', () => {
    const s = computeStats([animeEntry({ progress: 10, media_items: { type: 'anime', metadata: {} } })]);
    expect(s.hoursWatched).toBe(4); // 10 * 24min = 240min = 4h
  });

  it('conta só entradas com status "completed" em completedCount', () => {
    const s = computeStats([
      animeEntry({ status: 'completed' }),
      animeEntry({ status: 'watching' }),
      mangaEntry({ status: 'completed' }),
    ]);
    expect(s.completedCount).toBe(2);
  });

  it('ignora uma entrada sem media_items em vez de quebrar (item órfão no banco)', () => {
    expect(() => computeStats([{ status: 'completed', media_items: null }])).not.toThrow();
    expect(computeStats([{ status: 'completed', media_items: null }]).totalItems).toBe(1);
  });

  it('ordena topGenres por contagem, do maior pro menor, e limita a 6', () => {
    const entries = [
      animeEntry({ media_items: { type: 'anime', metadata: { genres: ['Ação'] } } }),
      animeEntry({ media_items: { type: 'anime', metadata: { genres: ['Ação'] } } }),
      animeEntry({ media_items: { type: 'anime', metadata: { genres: ['Romance'] } } }),
    ];
    const s = computeStats(entries);
    expect(s.topGenres[0]).toEqual({ genre: 'Ação', count: 2 });
    expect(s.topGenres[1]).toEqual({ genre: 'Romance', count: 1 });
  });
});

describe('computeWrappedStats', () => {
  it('filtra só entradas atualizadas no ano pedido', () => {
    const entries = [
      animeEntry({ updated_at: '2024-05-01T00:00:00Z' }),
      animeEntry({ updated_at: '2023-05-01T00:00:00Z' }),
    ];
    const w = computeWrappedStats(entries, 2024);
    expect(w.itemsThisYear).toBe(1);
    expect(w.year).toBe(2024);
  });

  it('escolhe o favorito marcado, ou cai pro melhor avaliado se ninguém foi favoritado', () => {
    const entries = [
      animeEntry({ updated_at: '2024-01-01', rating: 7, favorite: false }),
      animeEntry({ updated_at: '2024-02-01', rating: 9.5, favorite: false }),
    ];
    const w = computeWrappedStats(entries, 2024);
    expect(w.favorite.rating).toBe(9.5);
  });

  it('ano sem nenhuma atividade retorna itemsThisYear 0 sem quebrar', () => {
    const w = computeWrappedStats([animeEntry({ updated_at: '2020-01-01' })], 2024);
    expect(w.itemsThisYear).toBe(0);
    expect(w.favorite).toBeUndefined();
  });
});
