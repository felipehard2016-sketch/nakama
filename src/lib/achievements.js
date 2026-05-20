import { getAllMedia, getStreak } from './storage';

/* ─────────────────────────────────────────────────────────────
   Definições de conquistas
   check(stats) → { unlocked: bool, progress: number, total: number }
───────────────────────────────────────────────────────────── */

export const ACHIEVEMENT_CATEGORIES = ['Coleção', 'Maratona', 'Variedade', 'Social', 'Dedicação'];

export const ACHIEVEMENTS = [
  /* ── Coleção ── */
  {
    id: 'first_add',
    icon: '🌱', category: 'Coleção', points: 10,
    title: 'Primeira Adição',
    desc: 'Adicionou seu primeiro anime ou mangá à lista.',
    check: s => ({ unlocked: s.totalSaved >= 1, progress: Math.min(s.totalSaved, 1), total: 1 }),
  },
  {
    id: 'collector_10',
    icon: '📚', category: 'Coleção', points: 20,
    title: 'Colecionador',
    desc: 'Tenha 10 títulos na sua lista.',
    check: s => ({ unlocked: s.totalSaved >= 10, progress: Math.min(s.totalSaved, 10), total: 10 }),
  },
  {
    id: 'collector_50',
    icon: '🗃️', category: 'Coleção', points: 50,
    title: 'Arquivista',
    desc: 'Tenha 50 títulos na sua lista.',
    check: s => ({ unlocked: s.totalSaved >= 50, progress: Math.min(s.totalSaved, 50), total: 50 }),
  },
  {
    id: 'collector_100',
    icon: '🏛️', category: 'Coleção', points: 100,
    title: 'Bibliotecário',
    desc: '100 títulos salvos. Uma biblioteca completa.',
    check: s => ({ unlocked: s.totalSaved >= 100, progress: Math.min(s.totalSaved, 100), total: 100 }),
  },
  {
    id: 'first_complete',
    icon: '✅', category: 'Coleção', points: 15,
    title: 'Concluidor',
    desc: 'Completou seu primeiro anime ou mangá.',
    check: s => ({ unlocked: s.completed >= 1, progress: Math.min(s.completed, 1), total: 1 }),
  },
  {
    id: 'complete_20',
    icon: '🎯', category: 'Coleção', points: 40,
    title: 'Dedicado',
    desc: '20 títulos completos.',
    check: s => ({ unlocked: s.completed >= 20, progress: Math.min(s.completed, 20), total: 20 }),
  },
  {
    id: 'complete_50',
    icon: '🏆', category: 'Coleção', points: 80,
    title: 'Veterano',
    desc: '50 títulos marcados como completos.',
    check: s => ({ unlocked: s.completed >= 50, progress: Math.min(s.completed, 50), total: 50 }),
  },
  {
    id: 'favorites_5',
    icon: '❤️', category: 'Coleção', points: 20,
    title: 'Coração Cheio',
    desc: 'Favoritou 5 títulos.',
    check: s => ({ unlocked: s.favorites >= 5, progress: Math.min(s.favorites, 5), total: 5 }),
  },
  {
    id: 'favorites_25',
    icon: '💖', category: 'Coleção', points: 50,
    title: 'Apaixonado',
    desc: 'Favoritou 25 títulos.',
    check: s => ({ unlocked: s.favorites >= 25, progress: Math.min(s.favorites, 25), total: 25 }),
  },

  /* ── Maratona ── */
  {
    id: 'eps_100',
    icon: '📺', category: 'Maratona', points: 25,
    title: 'Espectador',
    desc: '100 episódios assistidos.',
    check: s => ({ unlocked: s.totalEps >= 100, progress: Math.min(s.totalEps, 100), total: 100 }),
  },
  {
    id: 'eps_500',
    icon: '🔥', category: 'Maratona', points: 60,
    title: 'Maratonista',
    desc: '500 episódios no total.',
    check: s => ({ unlocked: s.totalEps >= 500, progress: Math.min(s.totalEps, 500), total: 500 }),
  },
  {
    id: 'eps_1000',
    icon: '⚡', category: 'Maratona', points: 100,
    title: 'Viciado',
    desc: '1.000 episódios assistidos.',
    check: s => ({ unlocked: s.totalEps >= 1000, progress: Math.min(s.totalEps, 1000), total: 1000 }),
  },
  {
    id: 'eps_3000',
    icon: '🌟', category: 'Maratona', points: 200,
    title: 'Lendário',
    desc: '3.000 episódios. Nível lendário.',
    check: s => ({ unlocked: s.totalEps >= 3000, progress: Math.min(s.totalEps, 3000), total: 3000 }),
  },
  {
    id: 'chapters_200',
    icon: '📖', category: 'Maratona', points: 40,
    title: 'Leitor',
    desc: '200 capítulos de mangá lidos.',
    check: s => ({ unlocked: s.totalChaps >= 200, progress: Math.min(s.totalChaps, 200), total: 200 }),
  },
  {
    id: 'hours_24',
    icon: '⏰', category: 'Maratona', points: 30,
    title: '24 Horas',
    desc: 'Um dia inteiro de anime assistido.',
    check: s => ({ unlocked: s.totalMinutes >= 1440, progress: Math.min(s.totalMinutes, 1440), total: 1440 }),
  },
  {
    id: 'hours_240',
    icon: '🕰️', category: 'Maratona', points: 100,
    title: 'Dez Dias',
    desc: '240 horas de anime. São 10 dias inteiros.',
    check: s => ({ unlocked: s.totalMinutes >= 14400, progress: Math.min(s.totalMinutes, 14400), total: 14400 }),
  },

  /* ── Variedade ── */
  {
    id: 'genres_5',
    icon: '🎭', category: 'Variedade', points: 30,
    title: 'Eclético',
    desc: 'Completou animes de 5 gêneros diferentes.',
    check: s => ({ unlocked: s.completedGenres >= 5, progress: Math.min(s.completedGenres, 5), total: 5 }),
  },
  {
    id: 'genres_10',
    icon: '🌈', category: 'Variedade', points: 60,
    title: 'Diversificado',
    desc: '10 gêneros diferentes na sua lista.',
    check: s => ({ unlocked: s.totalGenres >= 10, progress: Math.min(s.totalGenres, 10), total: 10 }),
  },
  {
    id: 'has_manga',
    icon: '📗', category: 'Variedade', points: 20,
    title: 'Além do Anime',
    desc: 'Adicionou um mangá, novel ou webtoon.',
    check: s => ({ unlocked: s.mangaCount >= 1, progress: Math.min(s.mangaCount, 1), total: 1 }),
  },
  {
    id: 'has_movie',
    icon: '🎬', category: 'Variedade', points: 15,
    title: 'Cinéfilo',
    desc: 'Assistiu pelo menos um filme de anime.',
    check: s => ({ unlocked: s.movieCount >= 1, progress: Math.min(s.movieCount, 1), total: 1 }),
  },
  {
    id: 'manga_10',
    icon: '📚', category: 'Variedade', points: 40,
    title: 'Mangaka Fan',
    desc: '10 mangás ou novels na lista.',
    check: s => ({ unlocked: s.mangaCount >= 10, progress: Math.min(s.mangaCount, 10), total: 10 }),
  },
  {
    id: 'high_score',
    icon: '⭐', category: 'Variedade', points: 25,
    title: 'Crítico',
    desc: 'Avaliou pelo menos 10 títulos.',
    check: s => ({ unlocked: s.scoredCount >= 10, progress: Math.min(s.scoredCount, 10), total: 10 }),
  },
  {
    id: 'all_statuses',
    icon: '🗺️', category: 'Variedade', points: 35,
    title: 'Explorador',
    desc: 'Usou todos os 5 status de lista.',
    check: s => ({ unlocked: s.statusCount >= 5, progress: Math.min(s.statusCount, 5), total: 5 }),
  },

  /* ── Dedicação ── */
  {
    id: 'streak_3',
    icon: '🔥', category: 'Dedicação', points: 20,
    title: '3 Dias Seguidos',
    desc: 'Ativo no app por 3 dias consecutivos.',
    check: s => ({ unlocked: s.longestStreak >= 3, progress: Math.min(s.longestStreak, 3), total: 3 }),
  },
  {
    id: 'streak_7',
    icon: '🗓️', category: 'Dedicação', points: 50,
    title: 'Semana Perfeita',
    desc: '7 dias consecutivos de atividade.',
    check: s => ({ unlocked: s.longestStreak >= 7, progress: Math.min(s.longestStreak, 7), total: 7 }),
  },
  {
    id: 'streak_30',
    icon: '🏅', category: 'Dedicação', points: 150,
    title: 'Mês Dedicado',
    desc: '30 dias seguidos de atividade. Impressionante.',
    check: s => ({ unlocked: s.longestStreak >= 30, progress: Math.min(s.longestStreak, 30), total: 30 }),
  },
  {
    id: 'early_adopter',
    icon: '🎌', category: 'Dedicação', points: 30,
    title: 'Nakama OG',
    desc: 'Um dos primeiros usuários do Nakama.',
    check: s => ({ unlocked: true, progress: 1, total: 1 }), // todos desbloqueiam
  },
];

/* ─── Computar stats do usuário para checar conquistas ─── */
export function computeAchievementStats() {
  const all = getAllMedia();
  const saved = all.filter(m => m.listStatus || m.favorited);
  const completed = saved.filter(m => m.listStatus === 'COMPLETED');

  const isAnime = m => !['MANGA','NOVEL','ONE_SHOT'].includes(m.format);
  const animes  = saved.filter(isAnime);
  const mangas  = saved.filter(m => !isAnime(m));

  const totalEps   = animes.reduce((s, m) => s + (m.progress || 0), 0);
  const totalChaps = mangas.reduce((s, m) => s + (m.progress || 0), 0);
  const totalMin   = animes.reduce((s, m) => s + (m.progress || 0) * (m.duration || 24), 0)
                   + mangas.reduce((s, m) => s + (m.progress || 0) * 5, 0);

  /* Gêneros */
  const allGenres      = new Set(saved.flatMap(m => m.genres || []));
  const completedGenreSet = new Set(completed.flatMap(m => m.genres || []));

  /* Status distintos usados */
  const statusSet = new Set(saved.filter(m => m.listStatus).map(m => m.listStatus));

  /* Streak */
  const streak = getStreak();

  /* Scores atribuídos */
  const scoredCount = saved.filter(m => m.userScore).length;

  return {
    totalSaved:       saved.length,
    completed:        completed.length,
    favorites:        saved.filter(m => m.favorited).length,
    totalEps,
    totalChaps,
    totalMinutes:     totalMin,
    totalGenres:      allGenres.size,
    completedGenres:  completedGenreSet.size,
    mangaCount:       mangas.length,
    movieCount:       saved.filter(m => m.format === 'MOVIE').length,
    scoredCount,
    statusCount:      statusSet.size,
    longestStreak:    streak.longest || 0,
    currentStreak:    streak.count || 0,
    streakActive:     streak.active,
  };
}

/* ─── Verificar todas as conquistas ─── */
export function checkAllAchievements() {
  const stats = computeAchievementStats();
  return ACHIEVEMENTS.map(a => {
    const result = a.check(stats);
    return { ...a, ...result };
  });
}

/* ─── Total de pontos ─── */
export function getTotalPoints(achievements) {
  return achievements.filter(a => a.unlocked).reduce((s, a) => s + a.points, 0);
}
