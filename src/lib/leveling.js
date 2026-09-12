/** Nível calculado por episódios assistidos (mesmas faixas usadas na v1). */
const THRESHOLDS = [
  { min: 6000, level: 7, label: 'Otaku' },
  { min: 3000, level: 6, label: 'Mestre' },
  { min: 1500, level: 5, label: 'Veterano' },
  { min: 700,  level: 4, label: 'Experiente' },
  { min: 300,  level: 3, label: 'Intermediário' },
  { min: 100,  level: 2, label: 'Iniciante' },
  { min: 0,    level: 1, label: 'Novato' },
];

export function levelFromEpisodes(eps = 0) {
  return THRESHOLDS.find(t => eps >= t.min);
}

export function labelForLevel(level = 1) {
  return THRESHOLDS.find(t => t.level === level)?.label || 'Novato';
}
