#!/usr/bin/env node
/**
 * Zrzuty ekranu prawdziwej aplikacji na stronę limecontrol.eu (hero i galeria „Zobacz aplikację”).
 *
 *   node site-src/screens.mjs        (to samo: npm run site:screens)
 *
 * Źródłem są zrzuty do sklepów z mobile/fastlane/screenshots/<pl|en-US>/ (tworzy je
 * mobile/store/screenshots.mjs — patrz mobile/README.md). Zrzuty sklepowe nie są w repozytorium,
 * a wynik tego skryptu jest: site/assets/screens/<pl|en>/<nazwa>.webp. Uruchom go ponownie po
 * odświeżeniu zrzutów do sklepów. Wymaga ImageMagick (`magick`) z obsługą WebP.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(REPO, 'mobile', 'fastlane', 'screenshots');
const OUT = join(REPO, 'site', 'assets', 'screens');

/** Zrzut sklepowy → plik na stronie i jego szerokość w pikselach (2× szerokości na ekranie). */
export const SCREENS = [
  ['iphone-6.9_01-surveys', 'surveys', 640],
  ['iphone-6.9_02-survey-summary', 'summary', 640],
  ['iphone-6.9_02b-survey-list', 'list', 640],
  ['iphone-6.9_03-link-qr-capi', 'link-qr', 640],
  ['iphone-6.9_04-template-library', 'templates', 640],
  ['iphone-6.9_05-participants', 'participants', 640],
  ['iphone-6.9_06-instances', 'instances', 640],
  ['ipad-13_01-surveys', 'ipad-surveys', 1400],
];

const LANG_DIRS = { pl: 'pl', en: 'en-US' };

for (const [lang, dir] of Object.entries(LANG_DIRS)) {
  mkdirSync(join(OUT, lang), { recursive: true });
  for (const [source, name, width] of SCREENS) {
    const input = join(SRC, dir, `${source}.png`);
    if (!existsSync(input)) throw new Error(`Brak ${input} — najpierw uruchom mobile/store/screenshots.mjs`);
    const output = join(OUT, lang, `${name}.webp`);
    execFileSync('magick', [input, '-resize', `${width}x`, '-strip', '-quality', '82', '-define', 'webp:method=6', output]);
    console.log(`✓ site/assets/screens/${lang}/${name}.webp`);
  }
}
