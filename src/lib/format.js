/** Remove tags HTML simples das descrições da AniList (que vêm com <br>, etc.). */
export function stripHtml(html) {
  return (html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
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
