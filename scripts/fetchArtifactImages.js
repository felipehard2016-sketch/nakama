#!/usr/bin/env node
/*
 * Busca automática de imagens de artefatos nas wikis oficiais da Fandom
 * (MediaWiki), pra alimentar public/artifacts/<anime>/<arquivo>.
 *
 * Uso:
 *   node scripts/fetchArtifactImages.js <nome-do-manifesto> [--force] [--out <dir>]
 *   node scripts/fetchArtifactImages.js luffy
 *   node scripts/fetchArtifactImages.js luffy --force   # rebaixa mesmo se já existir
 *
 * Os manifestos ficam em scripts/artifactImageManifest.js — cada entrada
 * é { character, anime, wiki, artifactLabel, searchTerm, filename }.
 * `wiki` é o subdomínio da Fandom (ex. "onepiece" → onepiece.fandom.com).
 *
 * Fluxo por artefato:
 *   1. Busca (action=query&list=search) o termo na wiki certa.
 *   2. Pega a imagem principal (pageimages/original) da página melhor
 *      colocada na busca.
 *   3. Confere Content-Type e tamanho mínimo (descarta ícone/placeholder
 *      claramente vazio da própria Fandom).
 *   4. Salva em public/artifacts/<filename> e registra no relatório.
 *
 * NUNCA inventa nem usa imagem genérica pra "preencher": qualquer etapa
 * que falhar (sem resultado de busca, sem imagem principal, imagem
 * suspeita) vira `status: 'not_found'` no relatório — o artefato
 * continua no estado "aguardando foto" já implementado em Diario.jsx até
 * alguém revisar manualmente (ver `lowConfidence` no manifesto pros
 * casos já sinalizados como prováveis de precisar disso, tipo cicatrizes
 * que não são item de verdade).
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFESTS } from './artifactImageManifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'public', 'artifacts');
const MIN_BYTES = 2000; // abaixo disso é quase sempre ícone/placeholder da própria Fandom, não a imagem real
const REQUEST_DELAY_MS = 900; // educado com o servidor da wiki — um artefato por vez, sem rajada
const USER_AGENT = 'NakamaDiarioBot/1.0 (uso pessoal, projeto nao-comercial; contato via repositorio github)';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function wikiFetch(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
  return res.json();
}

/** Acha o título da página mais relevante pra um termo de busca, numa wiki da Fandom. */
async function searchWikiPage(wiki, term) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=3&format=json`;
  const data = await wikiFetch(url);
  const hits = data?.query?.search || [];
  return hits[0]?.title || null;
}

/** Pega a URL da imagem principal (infobox) de uma página já identificada. */
async function getPageImageUrl(wiki, title) {
  const url = `https://${wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&redirects=1&format=json`;
  const data = await wikiFetch(url);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  return page?.original?.source || null;
}

/** Baixa a imagem, valida tipo/tamanho, e salva no destino. Lança erro descritivo se algo não bater. */
async function downloadImage(imageUrl, destPath) {
  const res = await fetch(imageUrl, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`resposta não é imagem (content-type: ${contentType})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error(`arquivo suspeito de pequeno (${buf.length} bytes) — provável ícone vazio da wiki`);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, buf);
  return buf.length;
}

/**
 * Roda o fluxo completo pra uma lista de artefatos.
 * @param {Array} entries - ver formato em artifactImageManifest.js
 * @param {{outDir?: string, force?: boolean, delayMs?: number}} options
 * @returns {Promise<Array>} relatório, um item por artefato
 */
export async function fetchArtifactImages(entries, options = {}) {
  const { outDir = DEFAULT_OUT_DIR, force = false, delayMs = REQUEST_DELAY_MS } = options;
  const report = [];

  for (const entry of entries) {
    const destPath = path.join(outDir, entry.filename);
    const base = { character: entry.character, artifactLabel: entry.artifactLabel, filename: entry.filename };

    if (!force && existsSync(destPath)) {
      report.push({ ...base, status: 'skipped_exists', note: 'já existe localmente — use --force pra rebaixar' });
      continue;
    }

    try {
      const pageTitle = await searchWikiPage(entry.wiki, entry.searchTerm);
      if (!pageTitle) {
        report.push({ ...base, status: 'not_found', note: `busca por "${entry.searchTerm}" não achou nenhuma página em ${entry.wiki}.fandom.com` });
        await sleep(delayMs);
        continue;
      }

      const imageUrl = await getPageImageUrl(entry.wiki, pageTitle);
      if (!imageUrl) {
        report.push({ ...base, status: 'not_found', pageTitle, note: `página "${pageTitle}" não tem imagem principal cadastrada` });
        await sleep(delayMs);
        continue;
      }

      const bytes = await downloadImage(imageUrl, destPath);
      report.push({
        ...base,
        status: 'downloaded',
        pageTitle,
        imageUrl,
        bytes,
        note: entry.lowConfidence ? 'baixado, mas marcado lowConfidence no manifesto — revisar visualmente com atenção' : undefined,
      });
    } catch (err) {
      report.push({ ...base, status: 'error', note: String(err?.message || err) });
    }

    await sleep(delayMs);
  }

  return report;
}

function printReport(report) {
  const byStatus = { downloaded: [], not_found: [], error: [], skipped_exists: [] };
  for (const r of report) byStatus[r.status]?.push(r);

  console.log('\n=== Relatório de busca de imagens ===\n');
  if (byStatus.downloaded.length) {
    console.log(`✅ Baixados (${byStatus.downloaded.length}):`);
    for (const r of byStatus.downloaded) {
      console.log(`   ${r.filename} ← "${r.pageTitle}" (${(r.bytes / 1024).toFixed(0)} KB)${r.note ? '  ⚠ ' + r.note : ''}`);
    }
  }
  if (byStatus.skipped_exists.length) {
    console.log(`\n⏭  Já existiam, pulados (${byStatus.skipped_exists.length}):`);
    for (const r of byStatus.skipped_exists) console.log(`   ${r.filename}`);
  }
  if (byStatus.not_found.length) {
    console.log(`\n❌ SEM imagem encontrada — continuam "aguardando foto" (${byStatus.not_found.length}):`);
    for (const r of byStatus.not_found) console.log(`   [${r.character}] ${r.artifactLabel} — ${r.note}`);
  }
  if (byStatus.error.length) {
    console.log(`\n⚠️  Erros durante a busca/download (${byStatus.error.length}):`);
    for (const r of byStatus.error) console.log(`   [${r.character}] ${r.artifactLabel} — ${r.note}`);
  }
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);
  const manifestName = args.find(a => !a.startsWith('--'));
  const force = args.includes('--force');
  const outIdx = args.indexOf('--out');
  const outDir = outIdx >= 0 ? args[outIdx + 1] : undefined;

  if (!manifestName || !MANIFESTS[manifestName]) {
    console.error(`Uso: node scripts/fetchArtifactImages.js <manifesto> [--force] [--out <dir>]`);
    console.error(`Manifestos disponíveis: ${Object.keys(MANIFESTS).join(', ')}`);
    process.exit(1);
  }

  const entries = MANIFESTS[manifestName];
  console.log(`Buscando imagens de ${entries.length} artefato(s) do manifesto "${manifestName}"...`);
  const report = await fetchArtifactImages(entries, { force, outDir });
  printReport(report);

  const reportPath = path.join(__dirname, `artifact-image-report.${manifestName}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`Relatório completo salvo em ${path.relative(process.cwd(), reportPath)}`);

  const hadFailures = report.some(r => r.status === 'not_found' || r.status === 'error');
  process.exit(hadFailures ? 1 : 0);
}

// Só roda main() quando chamado direto (`node fetchArtifactImages.js`), não quando importado.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
