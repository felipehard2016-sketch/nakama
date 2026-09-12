/** Agrega a lista do usuário (getUserList) em números prontos pra exibir. */
export function computeStats(entries = []) {
  let totalEpisodes = 0;
  let totalChapters = 0;
  let minutesWatched = 0;
  let completedCount = 0;
  const genreCounts = new Map();

  for (const entry of entries) {
    const m = entry.media_items;
    if (!m) continue;

    if (m.type === 'anime') {
      totalEpisodes += entry.progress || 0;
      const duration = m.metadata?.duration || 24; // minutos/episódio, 24 é a média de um anime de TV
      minutesWatched += (entry.progress || 0) * duration;
    } else if (m.type === 'manga') {
      totalChapters += entry.progress || 0;
    }

    if (entry.status === 'completed') completedCount += 1;

    for (const genre of m.metadata?.genres || []) {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, count]) => ({ genre, count }));

  return {
    totalItems: entries.length,
    totalEpisodes,
    totalChapters,
    hoursWatched: Math.round(minutesWatched / 60),
    completedCount,
    topGenres,
  };
}

/**
 * Recorte "wrapped" de um ano específico. Como não guardamos a data exata
 * de conclusão (só `updated_at`, que muda a cada edição), usamos
 * updated_at dentro do ano como proxy de "atividade do ano" — funciona
 * bem pra quem usa o app ao longo do ano, é uma aproximação pra quem
 * importa/edita lista antiga fora do período.
 */
export function computeWrappedStats(entries = [], year = new Date().getFullYear()) {
  const inYear = entries.filter(e => new Date(e.updated_at).getFullYear() === year);
  const base = computeStats(inYear);
  const topRated = [...inYear].filter(e => e.rating != null).sort((a, b) => b.rating - a.rating)[0];
  const favorite = inYear.find(e => e.favorite) || topRated;

  return { ...base, year, favorite, itemsThisYear: inYear.length };
}
