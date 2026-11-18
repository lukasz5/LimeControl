#!/usr/bin/env node
/**
 * Renderuje pliki SVG z tego katalogu do PNG o tej samej nazwie (Chrome przez Playwright).
 *
 *   node mobile/assets/render.mjs [--playwright /ścieżka/do/playwright/index.mjs] [plik.svg …]
 *
 * Rozmiar PNG wynika z atrybutu viewBox. Krój „Plus Jakarta Sans” (teksty w grafice głównej
 * Google Play) jest pobierany z Google Fonts, więc renderowanie wymaga dostępu do sieci.
 * Po zmianie ikony lub ekranu startowego uruchom jeszcze: python3 mobile/assets/generate.py
 *
 * Wymaga Playwrighta (playwright-core lub playwright; nie jest zależnością projektu) i Chrome.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const custom = args.includes('--playwright') ? args.splice(args.indexOf('--playwright'), 2)[1] : null;
const files = args.length ? args : readdirSync(HERE).filter((f) => f.endsWith('.svg')).sort();

let chromium;
try {
  ({ chromium } = await import(custom ? pathToFileURL(custom).href : 'playwright-core'));
} catch {
  console.error('Nie znaleziono Playwrighta. Zainstaluj go (npm i -D playwright-core) albo podaj --playwright <ścieżka do index.mjs>.');
  process.exit(2);
}

const FONTS = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=block';
const browser = await chromium.launch({ channel: 'chrome' });
for (const file of files) {
  const svg = readFileSync(join(HERE, file), 'utf8');
  const box = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (!box) throw new Error(`${file}: brak atrybutu viewBox="0 0 szer wys"`);
  const [width, height] = [Number(box[1]), Number(box[2])];
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const needsFonts = svg.includes('<text');
  await page.setContent(
    `<html><head>${needsFonts ? `<link rel="stylesheet" href="${FONTS}">` : ''}</head>` +
      `<body style="margin:0;background:transparent">${svg}</body></html>`,
    { waitUntil: needsFonts ? 'networkidle' : 'load' },
  );
  if (needsFonts) {
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() => document.fonts.check("800 20px 'Plus Jakarta Sans'"));
    if (!loaded) throw new Error(`${file}: nie udało się wczytać kroju Plus Jakarta Sans (brak sieci?)`);
  }
  const out = file.replace(/\.svg$/, '.png');
  await page.screenshot({ path: join(HERE, out), omitBackground: true, clip: { x: 0, y: 0, width, height } });
  await page.close();
  console.log('✓', out, `${width}×${height}`);
}
await browser.close();
