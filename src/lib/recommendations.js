/**
 * Gêneros mais frequentes na lista do usuário, a partir do `metadata`
 * guardado em cada media_items (o payload da AniList inteiro, salvo
 * por ensureMediaItem). Itens adicionados só pelo botão rápido do
 * card (sem nunca abrir o detalhe) podem não ter `genres` no metadata
 * ainda, dependendo de qual fileira a AniList devolveu o dado — nesse
 * caso simplesmente não contam, sem quebrar nada.
 */
export function computeTopGenres(entries, count = 3) {
  const counts = new Map();
  for (const entry of entries) {
    for (const g of entry.media_items?.metadata?.genres || []) {
      counts.set(g, (counts.get(g) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([genre]) => genre);
}

/** Tira da lista de recomendações qualquer título que já esteja na lista pessoal. */
export function excludeTracked(media, trackedExternalIds) {
  return media.filter(m => !trackedExternalIds.has(String(m.id)));
}
