#!/usr/bin/env node
/**
 * Zrzuty ekranu aplikacji mobilnej dla App Store i Google Play, w języku polskim i angielskim.
 *
 *   npm run build:mobile
 *   SHOTS_PL_ENDPOINT='https://demo-pl.example.com/index.php/admin/remotecontrol' \
 *   SHOTS_EN_ENDPOINT='https://demo-en.example.com/index.php/admin/remotecontrol' \
 *   LS_USER=admin LS_PASSWORD='…' \
 *     node mobile/store/screenshots.mjs [--playwright /ścieżka/do/playwright/index.mjs] [--only ios-phone,ios-tablet] [--lang pl]
 *
 * Urządzenia (--only): ios-phone, ios-tablet, android-phone, android-tablet-7, android-tablet-10.
 *
 * Skrypt otwiera paczkę aplikacji mobilnej (dist-mobile/) w Chrome w rozmiarach wymaganych przez
 * sklepy, łączy się z instancją demonstracyjną (dane: seed-demo.mjs) i zapisuje zrzuty w układzie
 * katalogów fastlane, gotowe do wysłania poleceniami `fastlane ios metadata` / `fastlane android metadata`:
 *
 *   mobile/fastlane/screenshots/<pl|en-US>/                                   App Store (iPhone 6,9″, iPad 13″)
 *   mobile/fastlane/metadata/android/<pl-PL|en-US>/images/<typ>Screenshots/   Google Play (telefon, tablet 7″ i 10″)
 *
 * Adres instancji jest na zrzutach zastępowany adresem przykładowym (example.com).
 *
 * Wymaga Playwrighta (playwright-core lub playwright; nie jest zależnością projektu) i Chrome.
 * To te same widoki, które pokazuje aplikacja na telefonie — bez paska stanu systemu.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import http from 'node:http';
import { dirname, extname, join, normalize, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const DIST = join(REPO, 'dist-mobile');
const FASTLANE = join(HERE, '..', 'fastlane');

const args = process.argv.slice(2);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const only = option('--only');
const user = process.env.LS_USER;
const password = process.env.LS_PASSWORD;
const ENDPOINTS = { pl: process.env.SHOTS_PL_ENDPOINT, en: process.env.SHOTS_EN_ENDPOINT || process.env.SHOTS_PL_ENDPOINT };
if (!existsSync(join(DIST, 'index.html'))) throw new Error('Brak dist-mobile/ — uruchom najpierw: npm run build:mobile');
if (!user || !password || !ENDPOINTS.pl) {
  console.error('Ustaw SHOTS_PL_ENDPOINT (oraz opcjonalnie SHOTS_EN_ENDPOINT), LS_USER i LS_PASSWORD.');
  process.exit(2);
}

let chromium;
try {
  const custom = option('--playwright');
  ({ chromium } = await import(custom ? pathToFileURL(custom).href : 'playwright-core'));
} catch {
  console.error('Nie znaleziono Playwrighta. Zainstaluj go (npm i -D playwright-core) albo podaj --playwright <ścieżka do index.mjs>.');
  process.exit(2);
}

const IOS_LOCALE = { pl: 'pl', en: 'en-US' };
const ANDROID_LOCALE = { pl: 'pl-PL', en: 'en-US' };
/** App Store rozpoznaje urządzenie po rozdzielczości pliku, więc zrzuty obu urządzeń leżą w jednym katalogu języka. */
const iosShot = (prefix) => (lang, name) => join(FASTLANE, 'screenshots', IOS_LOCALE[lang], `${prefix}_${name}.png`);
const androidShot = (type) => (lang, name) => join(FASTLANE, 'metadata', 'android', ANDROID_LOCALE[lang], 'images', type, `${name}.png`);

/**
 * Rozmiary wymagane przez sklepy: viewport × skala = piksele zrzutu.
 * Google Play przyjmuje zrzuty w proporcjach 16:9 lub 9:16 (tablety: bok co najmniej 1080 px).
 */
/**
 * `sheet`: poniżej 1024 px szerokości aplikacja pokazuje szczegóły ankiety w wysuwanym panelu
 * (telefony i tablet 7″); szersze ekrany mają listę i szczegóły obok siebie.
 */
const DEVICES = [
  { id: 'ios-phone', file: iosShot('iphone-6.9'), platform: 'ios', width: 440, height: 956, scale: 3, phone: true, sheet: true }, // 1320×2868
  { id: 'ios-tablet', file: iosShot('ipad-13'), platform: 'ios', width: 1032, height: 1376, scale: 2, phone: false, sheet: false }, // 2064×2752
  { id: 'android-phone', file: androidShot('phoneScreenshots'), platform: 'android', width: 360, height: 640, scale: 3, phone: true, sheet: true }, // 1080×1920
  { id: 'android-tablet-7', file: androidShot('sevenInchScreenshots'), platform: 'android', width: 960, height: 540, scale: 2, phone: false, sheet: true }, // 1920×1080
  { id: 'android-tablet-10', file: androidShot('tenInchScreenshots'), platform: 'android', width: 1280, height: 720, scale: 2, phone: false, sheet: false }, // 2560×1440
].filter((d) => !only || only.split(',').includes(d.id));
const LANGS = ['pl', 'en'].filter((l) => !option('--lang') || option('--lang') === l);

const TEXT = {
  pl: {
    host: 'ankiety.example.com',
    profile: 'Badania 2026',
    connect: 'Połącz',
    password: 'Hasło LimeSurvey',
    surveys: 'Ankiety w instancji',
    library: 'Biblioteka szablonów',
    libraryTitle: 'Biblioteka szablonów ankiet',
    closeLibrary: 'Zamknij bibliotekę szablonów',
    tools: 'Link, tryb CAPI i motyw',
    qr: 'Kod QR',
    closeDetails: 'Zamknij szczegóły',
    tabs: { surveys: 'Ankiety', participants: 'Uczestnicy', instances: 'Instancje' },
    participants: 'Lista uczestników',
    first: /NPS/,
    dismiss: 'Zamknij powiadomienie',
  },
  en: {
    host: 'surveys.example.com',
    profile: 'Research 2026',
    connect: 'Connect',
    password: 'LimeSurvey password',
    surveys: 'Surveys in instance',
    library: 'Template library',
    libraryTitle: 'Survey template library',
    closeLibrary: 'Close the template library',
    tools: 'Link, CAPI mode and theme',
    qr: 'QR code',
    closeDetails: 'Close details',
    tabs: { surveys: 'Surveys', participants: 'Participants', instances: 'Instances' },
    participants: 'Participant list',
    first: /NPS/,
    dismiss: 'Dismiss notification',
  },
};

// ---------- serwer plików dist-mobile ----------
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.lss': 'application/xml' };
const server = http.createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, path);
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const settle = (page, ms = 700) => page.waitForTimeout(ms);
/**
 * Osobna przeglądarka dla każdego języka: pola daty i godziny formatuje sama przeglądarka według
 * własnego języka interfejsu. Na Linuksie i Windows wystarcza --lang; na macOS Chrome bierze język
 * z systemu — wtedy SHOTS_CHROME_PL / SHOTS_CHROME_EN mogą wskazać skrypt uruchamiający Chrome
 * z parametrem -AppleLanguages '(en-GB)'.
 */
const launch = (lang) => {
  const executablePath = process.env[`SHOTS_CHROME_${lang.toUpperCase()}`];
  return chromium.launch({
    ...(executablePath ? { executablePath } : { channel: 'chrome' }),
    args: ['--disable-web-security', `--lang=${lang === 'pl' ? 'pl-PL' : 'en-GB'}`],
  });
};

async function dismissToasts(page, t) {
  for (const button of await page.getByRole('button', { name: t.dismiss }).all()) await button.click().catch(() => {});
}

try {
  for (const lang of LANGS) {
    const browser = await launch(lang);
    for (const device of DEVICES) {
      const t = TEXT[lang];
      const real = new URL(ENDPOINTS[lang]);
      const shownEndpoint = `https://${t.host}/index.php/admin/remotecontrol`;

      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        deviceScaleFactor: device.scale,
        isMobile: device.phone,
        hasTouch: true,
        locale: lang === 'pl' ? 'pl-PL' : 'en-GB',
        timezoneId: 'Europe/Warsaw',
      });
      // Aplikacja ma się zachowywać jak w natywnej powłoce: bez logowania, profile na urządzeniu.
      await context.addInitScript(
        ({ platform, language, profile }) => {
          window.CapacitorCustomPlatform = { name: platform, plugins: {} };
          localStorage.setItem('limecontrol_lang_v1', language);
          localStorage.setItem('CapacitorStorage.limecontrol_local_instances_v1', JSON.stringify([profile]));
        },
        {
          platform: device.platform,
          language: lang,
          profile: {
            id: 'demo', ownerUid: 'local', name: t.profile, baseUrl: `https://${t.host}`, rpcEndpoint: shownEndpoint,
            username: 'admin', authPlugin: 'Authdb', connectionMode: 'direct', limeVersion: 'auto',
          },
        }
      );
      // Zapytania do adresu przykładowego trafiają do instancji demonstracyjnej.
      await context.route(`https://${t.host}/**`, async (route) => {
        const response = await route.fetch({ url: real.toString() });
        const body = (await response.text()).split(real.origin).join(`https://${t.host}`).split(real.host).join(t.host);
        await route.fulfill({ status: response.status(), contentType: 'application/json', body });
      });

      const page = await context.newPage();
      const shot = async (name) => {
        await settle(page);
        const path = device.file(lang, name);
        mkdirSync(dirname(path), { recursive: true });
        await page.screenshot({ path });
        console.log(`✓ ${relative(REPO, path)}`);
      };

      await page.goto(origin, { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: t.connect, exact: true }).first().click();
      await page.getByPlaceholder(t.password).fill(password);
      await page.getByPlaceholder(t.password).press('Enter');
      await page.getByRole('heading', { name: t.surveys }).waitFor({ timeout: 30_000 });
      await page.waitForLoadState('networkidle');
      await dismissToasts(page, t);

      // 1. ankiety w instancji: statystyki wybranej ankiety
      const row = page.getByRole('button', { name: t.first }).filter({ hasText: /SID \d+/ }).locator('visible=true').first();
      await row.click();
      await page.waitForLoadState('networkidle');
      await dismissToasts(page, t);
      if (device.sheet) {
        // 2 (wysuwany panel). szczegóły ankiety: podsumowanie odpowiedzi i wykresy
        await shot('02-survey-summary');
        await page.getByRole('button', { name: t.closeDetails }).locator('visible=true').first().click();
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot('01-surveys');
      if (device.sheet) {
        // lista ankiet pod wykresem
        await row.evaluate((el) => el.scrollIntoView({ block: 'center' }));
        await shot('02b-survey-list');
        await row.click();
        await page.waitForLoadState('networkidle');
      }

      // 3. link, kod QR i tryb CAPI
      const tools = page.getByRole('heading', { name: t.tools }).locator('visible=true').first();
      await tools.scrollIntoViewIfNeeded();
      const card = tools.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
      await card.getByRole('button', { name: t.qr }).click();
      await tools.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.mouse.wheel(0, -24);
      await shot('03-link-qr-capi');
      if (device.sheet) await page.getByRole('button', { name: t.closeDetails }).locator('visible=true').first().click();

      // 4. biblioteka szablonów
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.getByRole('button', { name: t.library }).first().click();
      const library = page.getByRole('heading', { name: t.libraryTitle });
      await library.waitFor();
      await library.evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.evaluate(() => window.scrollBy(0, -90));
      await shot('04-template-library');
      await page.getByRole('button', { name: t.closeLibrary }).click();

      // 5. uczestnicy
      await page.getByRole('button', { name: t.tabs.participants, exact: true }).locator('visible=true').first().click();
      // ankieta z tabelą uczestników (pierwsza na liście może jej nie mieć)
      const picker = page.locator('select').locator('visible=true').first();
      const withTokens = await picker.locator('option').filter({ hasText: t.first }).first().getAttribute('value');
      await picker.selectOption(withTokens);
      await page.getByText(t.participants).first().waitFor({ timeout: 30_000 });
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot('05-participants');

      // 6. instancje: profile i aktywna sesja
      await page.getByRole('button', { name: t.tabs.instances, exact: true }).locator('visible=true').first().click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot('06-instances');

      await context.close();
    }
    await browser.close();
  }
} finally {
  server.close();
}
