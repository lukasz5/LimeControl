#!/usr/bin/env node
/**
 * Sprawdza wygenerowaną stronę (katalog site/):
 *   node site-src/check.mjs
 *
 *  - każdy link wewnętrzny (href, src) wskazuje istniejący plik,
 *  - każda kotwica (#id) istnieje na stronie docelowej,
 *  - każda podstrona ma odpowiedniki we wszystkich językach (hreflang) i dokładnie jeden nagłówek <h1>,
 *  - w treści nie został żaden nierozwinięty znacznik {{…}}.
 *
 * Kończy się kodem 1, gdy znajdzie błąd — używane w CI (npm run check:site).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS, ROUTES, SITE_URL, outputPath } from './chrome.mjs';
import { electionRelease } from './pages/election-research.mjs';

const SITE = join(dirname(fileURLToPath(import.meta.url)), '..', 'site');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

/** Ścieżka URL (bez domeny) → plik w site/. */
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const file = join(SITE, clean.endsWith('/') ? `${clean}index.html` : clean);
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

const pages = new Map();
for (const file of htmlFiles(SITE)) {
  const html = readFileSync(file, 'utf8');
  pages.set(file, { html, ids: new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])) });
}

const errors = [];
const report = (file, message) => errors.push(`${relative(SITE, file)}: ${message}`);

for (const [file, { html, ids }] of pages) {
  const own = `/${relative(SITE, file).replace(/\\/g, '/')}`;
  if (/\{\{[A-Za-z_]+\}\}/.test(html)) report(file, 'nierozwinięty znacznik {{…}}');
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) report(file, `oczekiwano jednego <h1>, jest ${h1}`);
  if (!/<html lang="(pl|en|de)"[ >]/.test(html)) report(file, 'brak atrybutu lang w <html>');
  if (!/<title>[^<]{10,}<\/title>/.test(html)) report(file, 'brak tytułu strony');

  for (const [, attr, raw] of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
    const value = raw.replace(/&amp;/g, '&');
    if (!value || /^(mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    let target = value;
    if (/^https?:\/\//i.test(value)) {
      if (!value.startsWith(`${SITE_URL}/`) && value !== SITE_URL) continue; // link zewnętrzny
      target = value.slice(SITE_URL.length) || '/';
    }
    const [pathPart, anchor] = target.split('#');
    let targetFile = file;
    if (pathPart) {
      const absolutePath = pathPart.startsWith('/') ? pathPart : join(dirname(own), pathPart).replace(/\\/g, '/');
      targetFile = resolveFile(absolutePath);
      if (!targetFile) {
        report(file, `${attr}="${value}" — brak pliku`);
        continue;
      }
    }
    if (anchor && attr === 'href' && targetFile.endsWith('.html')) {
      const targetIds = pages.get(targetFile)?.ids ?? ids;
      if (!targetIds.has(decodeURIComponent(anchor))) report(file, `href="${value}" — brak kotwicy #${anchor}`);
    }
  }
}

// Każda trasa ma plik w obu językach, a strona wskazuje swoją wersję w drugim języku.
for (const page of Object.keys(ROUTES)) {
  for (const lang of LANGS) {
    const file = join(SITE, outputPath(page, lang));
    const entry = pages.get(file);
    if (!entry) {
      errors.push(`${outputPath(page, lang)}: brak wygenerowanej strony (${page}/${lang})`);
      continue;
    }
    const canonicals = [...entry.html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
    if (canonicals.length !== 1 || canonicals[0][1] !== SITE_URL + ROUTES[page][lang]) {
      report(file, 'nieprawidłowy adres kanoniczny');
    }
    for (const other of LANGS) {
      const expected = `hreflang="${other}" href="${SITE_URL}${ROUTES[page][other]}"`;
      if (!entry.html.includes(expected)) report(file, `brak <link rel="alternate" ${expected}>`);
    }
    if (!new RegExp(`<html lang="${lang}"[ >]`).test(entry.html)) report(file, `oczekiwano lang="${lang}"`);
  }
}

// The catalog tile opens the product, which leads to the country-specific release.
const pluginRepository = 'https://github.com/lukasz5/limecontrol-election-polls';
const releaseDirectory = `${pluginRepository}/releases/download/v${electionRelease.version}/`;
const releaseFiles = [electionRelease.zip, 'fala-1.lss', 'fala-2.lss', 'SHA256SUMS'];
const releaseLinks = new Set(releaseFiles.map(name => releaseDirectory + name));
for (const lang of LANGS) {
  const catalog = join(SITE, outputPath('plugins', lang));
  const product = join(SITE, outputPath('election', lang));
  const productUrl = ROUTES.election[lang];
  const moduleUrl = ROUTES.electionPoland[lang];
  const catalogLinks = pages.get(catalog)?.html.match(/<a\s[^>]*>/g) ?? [];
  if (!catalogLinks.some(tag => tag.includes('id="LimeControlElectionPolls"') && tag.includes(`href="${productUrl}"`))) {
    report(catalog, 'kafelek LimeControl Elections powinien otwierać stronę produktu');
  }
  const productHtml = pages.get(product)?.html ?? '';
  if (!productHtml.includes('<h1>LimeControl Elections</h1>') || !productHtml.includes(`href="${moduleUrl}"`)) {
    report(product, 'brak nazwy produktu lub wejścia do modułu krajowego');
  }
  if (!productHtml.includes(`href="${releaseDirectory}${electionRelease.zip}"`)) {
    report(product, 'brak bezpośredniego odsyłacza do instalatora wspólnego planera');
  }
  if (!productHtml.includes(`href="${moduleUrl}#planner"`)) {
    report(product, 'brak wejścia do przykładu planera kampanii');
  }
  const file = join(SITE, outputPath('electionPoland', lang));
  const entry = pages.get(file);
  if (!entry) continue;
  const { html } = entry;
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  const links = [...main.matchAll(/<a\b([^>]*?)\shref="([^"]+)"([^>]*)>/g)];
  if (!links.some(([, , href]) => href === productUrl)) report(file, 'brak powrotu do strony produktu');
  if (!links.some(([, , href]) => href === pluginRepository)) report(file, 'brak odsyłacza do repozytorium wtyczki');
  const downloads = new Set();
  for (const [, before, href, after] of links) {
    if (!/\sdownload(?:\s|=|$)/.test(before + after) && !href.includes('/releases/download/')) continue;
    downloads.add(href);
    if (!releaseLinks.has(href)) report(file, `niepoprawny adres pliku wydania: ${href}`);
  }
  for (const href of releaseLinks) {
    if (!downloads.has(href)) report(file, `brak odsyłacza do ${href}`);
  }
  if (!main.replaceAll('<wbr>', '').includes(`<samp>${electionRelease.sha256}</samp>`)) {
    report(file, 'brak sumy SHA-256 zakwalifikowanego pakietu ZIP');
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} błędów na stronie:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
  process.exit(1);
}
console.log(`✓ Strona: ${pages.size} plików HTML, linki wewnętrzne, kotwice i wersje językowe są poprawne.`);
