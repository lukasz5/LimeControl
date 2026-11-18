#!/usr/bin/env node
/**
 * Buduje bibliotekę szablonów ankiet LimeControl:
 *   node survey-templates/build.mjs
 *
 * 1. Wczytuje definicje z templates/*.json, rozwija skróty (scales.json) i je waliduje.
 * 2. Generuje pliki struktury LimeSurvey (.lss) do site/ankiety/pobierz/ (strona)
 *    oraz public/szablony-ankiet/ (aplikacja — import jednym kliknięciem).
 * 3. Zapisuje katalog (catalog.json) używany przez stronę i aplikację.
 * 4. Pakuje wszystkie szablony do jednego ZIP-a.
 *
 * Podstrony galerii (PL i EN) generuje osobno site-src/build.mjs — `npm run build:site`.
 *
 * Wynik jest deterministyczny: ponowne uruchomienie bez zmian w definicjach nie zmienia plików.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLss, countQuestions, normalizeTemplate, validateTemplate } from './lib/lss.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, '..');
const SITE = join(REPO, 'site', 'ankiety');
const APP = join(REPO, 'public', 'szablony-ankiet');
const VERSION = '1.0.0';
const TESTED_ON = ['6.15.12', '7.10.0'];
const MODES = ['cawi', 'cati', 'capi'];
/** Stała data plików w archiwum — dzięki niej ZIP jest powtarzalny bit w bit. */
const FIXED_MTIME = new Date('2026-01-01T00:00:00Z');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

export function loadTemplates() {
  const scales = readJson(join(ROOT, 'scales.json'));
  const categories = readJson(join(ROOT, 'categories.json'));
  const themesCfg = readJson(join(REPO, 'limesurvey-themes', 'themes.json'));
  const themeIds = new Set(themesCfg.themes.map((t) => t.id));
  const errors = [];
  const templates = readdirSync(join(ROOT, 'templates'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const raw = readJson(join(ROOT, 'templates', file));
      const def = normalizeTemplate(raw, scales);
      if (`${def.id}.json` !== file) errors.push(`${file}: id „${def.id}” musi odpowiadać nazwie pliku.`);
      errors.push(...validateTemplate(def));
      if (!categories.some((c) => c.id === def.category)) errors.push(`${def.id}: nieznana kategoria „${def.category}”.`);
      if (!Array.isArray(def.modes) || !def.modes.length || def.modes.some((m) => !MODES.includes(m))) errors.push(`${def.id}: modes musi zawierać wartości z listy ${MODES.join(', ')}.`);
      if (def.theme && !themeIds.has(def.theme)) errors.push(`${def.id}: nieznany motyw „${def.theme}” (limesurvey-themes/themes.json).`);
      if (!Number.isFinite(def.minutes) || def.minutes <= 0) errors.push(`${def.id}: minutes musi być liczbą dodatnią.`);
      if (!Number.isFinite(def.order)) errors.push(`${def.id}: brak pola order.`);
      for (const l of def.languages || []) if (!def.summary?.[l]) errors.push(`${def.id}: brak summary „${l}”.`);
      return def;
    })
    .sort((a, b) => a.order - b.order);
  const ids = new Set();
  for (const t of templates) {
    if (ids.has(t.id)) errors.push(`${t.id}: zduplikowane id.`);
    ids.add(t.id);
  }
  if (errors.length) throw new Error(`Błędy w definicjach szablonów:\n- ${errors.join('\n- ')}`);
  return { templates, categories, themesCfg };
}

export function build({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  const { templates, categories, themesCfg } = loadTemplates();

  for (const dir of [join(SITE, 'pobierz'), APP]) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }
  mkdirSync(join(SITE, 'img'), { recursive: true });

  const entries = templates.map((def) => {
    // Szablon wskazuje sugerowany motyw LimeControl. Gdy motyw nie jest zainstalowany, LimeSurvey
    // przy imporcie sam wybiera motyw domyślny (sprawdzone na LS 6.15.12 i 7.10.0).
    const template = def.theme ? `lc_${def.theme}` : 'fruity_twentythree';
    const xml = buildLss({ ...def, settings: { template, ...(def.settings || {}) } }, { sid: 100000 + def.order });
    const file = `${def.id}.lss`;
    for (const dir of [join(SITE, 'pobierz'), APP]) {
      writeFileSync(join(dir, file), xml);
      utimesSync(join(dir, file), FIXED_MTIME, FIXED_MTIME);
    }
    const preview = join(ROOT, 'previews', `${def.id}.jpg`);
    const hasPreview = existsSync(preview);
    if (hasPreview) copyFileSync(preview, join(SITE, 'img', `${def.id}.jpg`));
    else if (!quiet) console.warn(`  ! brak podglądu previews/${def.id}.jpg`);
    const entry = {
      id: def.id,
      file,
      bytes: Buffer.byteLength(xml),
      sha256: createHash('sha256').update(xml).digest('hex'),
      category: def.category,
      modes: def.modes,
      theme: def.theme ? `lc_${def.theme}` : null,
      minutes: def.minutes,
      groups: def.groups.length,
      questions: countQuestions(def),
      languages: def.languages,
      tokenAttributes: (def.tokenAttributes || []).length,
      title: def.title,
      summary: def.summary,
      preview: hasPreview,
    };
    log(`✓ ${file}  ${(entry.bytes / 1024).toFixed(1)} kB  ${entry.questions} pytań, ${entry.groups} grup, ${def.languages.join('+')}`);
    return entry;
  });

  const catalog = {
    version: VERSION,
    testedOn: TESTED_ON,
    categories,
    themes: themesCfg.themes.map((t) => ({ id: `lc_${t.id}`, label: t.label })),
    templates: entries,
  };
  const catalogJson = `${JSON.stringify(catalog, null, 2)}\n`;
  writeFileSync(join(SITE, 'catalog.json'), catalogJson);
  writeFileSync(join(APP, 'catalog.json'), catalogJson);

  const zip = join(SITE, 'pobierz', 'limecontrol-szablony-ankiet.zip');
  // ZIP zapisuje czas lokalny — stała strefa daje identyczne archiwum na każdej maszynie (także w CI).
  execFileSync('zip', ['-qjX', zip, ...entries.map((e) => join(SITE, 'pobierz', e.file))], { env: { ...process.env, TZ: 'UTC' } });
  utimesSync(zip, FIXED_MTIME, FIXED_MTIME);
  const zipBytes = statSync(zip).size;
  log(`✓ limecontrol-szablony-ankiet.zip  ${(zipBytes / 1024).toFixed(1)} kB`);

  return { catalog, templates, zipBytes };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
