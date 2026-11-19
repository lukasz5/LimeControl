#!/usr/bin/env node
/**
 * Obrazki podglądu linku (Open Graph, 1200×630) dla podstron bez własnego obrazka:
 *   site/assets/og/<pl|en|de>.png
 *
 *   node site-src/og-image.mjs [--playwright /ścieżka/do/playwright/index.mjs]
 *
 * Składa logo, hasło strony i zrzut aplikacji (site/assets/screens/) w Chrome przez Playwright.
 * Krój „Plus Jakarta Sans” jest pobierany z Google Fonts, więc renderowanie wymaga dostępu do sieci.
 * Uruchom ponownie po zmianie logo, hasła albo zrzutów ekranu. Wymaga Playwrighta (nie jest zależnością projektu).
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(REPO, 'site', 'assets');
const args = process.argv.slice(2);
const custom = args.includes('--playwright') ? args[args.indexOf('--playwright') + 1] : null;

let chromium;
try {
  ({ chromium } = await import(custom ? pathToFileURL(custom).href : 'playwright-core'));
} catch {
  console.error('Nie znaleziono Playwrighta. Zainstaluj go (npm i -D playwright-core) albo podaj --playwright <ścieżka do index.mjs>.');
  process.exit(2);
}

const TEXT = {
  pl: { title: 'LimeSurvey w Twojej kieszeni', sub: 'Aplikacja na iOS, Androida i web · motywy WCAG 2.2 · szablony ankiet · wtyczki CATI/CAPI', tag: 'Darmowe i open source', screen: 'pl' },
  en: { title: 'LimeSurvey in your pocket', sub: 'iOS, Android and web app · WCAG 2.2 themes · survey templates · CATI/CAPI plugins', tag: 'Free and open source', screen: 'en' },
  de: { title: 'LimeSurvey in der Hosentasche', sub: 'App für iOS, Android und Web · WCAG-2.2-Designs · Umfragevorlagen · CATI/CAPI-Plugins', tag: 'Kostenlos und Open Source', screen: 'en' },
};

const dataUri = (path, type) => `data:${type};base64,${readFileSync(path).toString('base64')}`;
const logo = dataUri(join(ASSETS, 'logo-dark.svg'), 'image/svg+xml');

const html = (t) => `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=DM+Sans:wght@400;500&display=block">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; width: 1200px; height: 630px; overflow: hidden; font-family: 'DM Sans', sans-serif; color: #e8f3e0;
    background: radial-gradient(900px 600px at 15% 10%, #1b5e36 0%, transparent 60%), radial-gradient(700px 500px at 100% 100%, #2c4d12 0%, transparent 60%), #08170e; }
  .wrap { position: absolute; inset: 0; padding: 64px 72px; display: flex; flex-direction: column; }
  .logo { height: 76px; width: auto; align-self: flex-start; }
  h1 { font: 800 68px/1.05 'Plus Jakarta Sans', sans-serif; letter-spacing: -2px; margin: 56px 0 22px; max-width: 660px; color: #f4fbe9; }
  p { font-size: 25px; line-height: 1.45; margin: 0; max-width: 620px; color: #b9cdbf; }
  .tag { margin-top: auto; align-self: flex-start; font: 700 20px/1 'Plus Jakarta Sans', sans-serif; letter-spacing: .5px; color: #0f2a1a; background: #a3e635; padding: 14px 22px; border-radius: 999px; }
  .phone { position: absolute; right: 70px; top: 60px; width: 330px; height: 716px; border-radius: 52px; padding: 12px; background: #050d08;
    box-shadow: 0 0 0 2px #2a4a34, 0 40px 80px -20px rgba(0,0,0,.7); transform: rotate(4deg); }
  .phone img { width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 41px; display: block; }
</style></head><body>
  <div class="wrap">
    <img class="logo" src="${logo}" alt="">
    <h1>${t.title}</h1>
    <p>${t.sub}</p>
    <span class="tag">${t.tag}</span>
  </div>
  <div class="phone"><img src="${dataUri(join(ASSETS, 'screens', t.screen, 'surveys.webp'), 'image/webp')}" alt=""></div>
</body></html>`;

mkdirSync(join(ASSETS, 'og'), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
for (const [lang, t] of Object.entries(TEXT)) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(html(t), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  if (!(await page.evaluate(() => document.fonts.check("800 20px 'Plus Jakarta Sans'")))) {
    throw new Error('Nie udało się wczytać kroju Plus Jakarta Sans (brak sieci?)');
  }
  await page.screenshot({ path: join(ASSETS, 'og', `${lang}.png`), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
  console.log(`✓ site/assets/og/${lang}.png`);
}
await browser.close();
