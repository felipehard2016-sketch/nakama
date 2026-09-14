/** Remove tags HTML simples das descrições da AniList (que vêm com <br>, etc.). */
export function stripHtml(html) {
  return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
}

/**
 * Descrições da AniList (anime e personagem) vêm com marcação própria
 * (não HTML): `__negrito__` e `~!spoiler!~` (spoiler pode cobrir várias
 * linhas juntas). Aqui só remove os marcadores de spoiler — o `__`
 * de negrito é tratado à parte por quem for exibir o texto (ver
 * componente Formatted), porque splitar em negrito exige manter a
 * marcação até a hora de renderizar.
 */
export function cleanAniListText(raw) {
  return stripHtml(raw).replace(/~!|!~/g, '');
}

/**
 * Bios de personagem da AniList vêm com uma marcação própria (não HTML):
 * `__negrito__` e `~!spoiler!~` (o spoiler pode cobrir várias linhas
 * juntas). Separa isso em duas partes:
 *  - `stats`: um bloco inicial de linhas "__Rótulo:__ valor" (altura,
 *    afiliação, fruta do diabo etc.) — vira uma ficha visual
 *  - `paragraphs`: o resto, em parágrafos, pra render com negrito de
 *    verdade em vez do "__" literal
 * Os marcadores de spoiler são removidos (o texto fica visível) — não
 * tenta esconder automaticamente, já que o spoiler pode atravessar
 * várias linhas e blocos de stat ao mesmo tempo.
 */
export function parseCharacterBio(raw) {
  if (!raw) return { stats: [], paragraphs: [] };

  const text = cleanAniListText(raw);
  const lines = text.split('\n');
  const stats = [];
  const proseLines = [];
  let inStatsBlock = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (inStatsBlock) {
      if (line === '') continue;
      const m = line.match(/^__([^_]+):__\s*(.*)$/);
      if (m) { stats.push({ label: m[1].trim(), value: m[2].trim() }); continue; }
      inStatsBlock = false;
    }
    proseLines.push(rawLine);
  }

  const paragraphs = proseLines.join('\n').trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return { stats, paragraphs };
}

/** Formata segundos até um evento futuro em texto curto tipo "em 3d 4h". */
export function formatCountdown(seconds) {
  if (seconds <= 0) return 'no ar';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `em ${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `em ${hours}h ${minutes}min`;
}
