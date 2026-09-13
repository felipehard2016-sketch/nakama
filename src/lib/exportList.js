import { STATUS_LABELS } from './mediaList';

/** Escapa um campo pra CSV (aspas duplicadas, envolve em aspas se tiver vírgula/aspas/quebra de linha). */
function csvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

const CSV_HEADER = ['titulo', 'tipo', 'status', 'progresso', 'nota', 'favorito', 'atualizado_em'];

// BOM, escapado em vez de colar o caractere puro — senão o ESLint
// acusa "irregular whitespace". Sem ele, o Excel no Windows costuma
// ler acentos errado num CSV em UTF-8.
const CSV_BOM = '\uFEFF';

function entryToRow(entry) {
  const m = entry.media_items;
  return [
    m?.title || '',
    m?.type || '',
    STATUS_LABELS[entry.status] || entry.status,
    entry.progress ?? 0,
    entry.rating ?? '',
    entry.favorite ? 'sim' : 'não',
    entry.updated_at || '',
  ];
}

export function listToCSV(entries) {
  const lines = [CSV_HEADER, ...entries.map(entryToRow)];
  return CSV_BOM + lines.map(row => row.map(csvField).join(',')).join('\r\n');
}

export function listToJSON(entries) {
  return JSON.stringify(
    entries.map(entry => ({
      titulo: entry.media_items?.title,
      tipo: entry.media_items?.type,
      status: entry.status,
      progresso: entry.progress,
      nota: entry.rating,
      favorito: entry.favorite,
      atualizado_em: entry.updated_at,
    })),
    null,
    2,
  );
}

/** Dispara o download de um arquivo gerado no navegador (sem round-trip nenhum a servidor). */
export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
