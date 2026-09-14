import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, checkAllAchievements, getTotalPoints, computeAchievementStats } from './achievements';

function entry(overrides = {}) {
  return {
    status: 'watching', progress: 0, favorite: false, rating: null,
    media_items: { type: 'anime', metadata: {} },
    ...overrides,
  };
}

describe('ACHIEVEMENTS (dados)', () => {
  it('todo id é único — duplicar um id faria a sincronização com o banco colidir', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda conquista tem check(), pontos positivos e categoria válida', () => {
    for (const a of ACHIEVEMENTS) {
      expect(typeof a.check).toBe('function');
      expect(a.points).toBeGreaterThan(0);
      expect(a.category).toBeTruthy();
    }
  });
});

describe('checkAllAchievements', () => {
  it('lista vazia: nada desbloqueado, exceto a que desbloqueia por padrão (early_adopter)', () => {
    const checked = checkAllAchievements([], null);
    const unlocked = checked.filter(a => a.unlocked).map(a => a.id);
    expect(unlocked).toEqual(['early_adopter']);
  });

  it('desbloqueia "Primeira Adição" com um único item salvo', () => {
    const checked = checkAllAchievements([entry()], null);
    const first = checked.find(a => a.id === 'first_add');
    expect(first.unlocked).toBe(true);
    expect(first.progress).toBe(1);
  });

  it('progress nunca ultrapassa total, mesmo passando muito do necessário', () => {
    const manyCompleted = Array.from({ length: 80 }, () => entry({ status: 'completed' }));
    const checked = checkAllAchievements(manyCompleted, null);
    const complete50 = checked.find(a => a.id === 'complete_50');
    expect(complete50.unlocked).toBe(true);
    expect(complete50.progress).toBe(50); // não 80
  });

  it('streak vindo de getStreak() alimenta as conquistas de Dedicação', () => {
    const checked = checkAllAchievements([], { longest_streak: 10, current_streak: 3 });
    expect(checked.find(a => a.id === 'streak_7').unlocked).toBe(true);
    expect(checked.find(a => a.id === 'streak_30').unlocked).toBe(false);
  });

  it('streak nulo (usuário sem nenhuma atividade registrada) não quebra', () => {
    expect(() => checkAllAchievements([], null)).not.toThrow();
  });
});

describe('getTotalPoints', () => {
  it('soma só os pontos das desbloqueadas', () => {
    const checked = checkAllAchievements([entry()], null); // desbloqueia first_add (10) + early_adopter (30)
    expect(getTotalPoints(checked)).toBe(40);
  });
});

describe('computeAchievementStats', () => {
  it('conta gêneros únicos, não duplica quando o mesmo gênero aparece em vários itens', () => {
    const entries = [
      entry({ media_items: { type: 'anime', metadata: { genres: ['Ação', 'Drama'] } } }),
      entry({ media_items: { type: 'anime', metadata: { genres: ['Ação'] } } }),
    ];
    expect(computeAchievementStats(entries).totalGenres).toBe(2);
  });

  it('statusCount reflete quantos status distintos foram usados', () => {
    const entries = [entry({ status: 'watching' }), entry({ status: 'completed' }), entry({ status: 'watching' })];
    expect(computeAchievementStats(entries).statusCount).toBe(2);
  });
});
