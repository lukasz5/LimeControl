#!/usr/bin/env node
/**
 * Kopiuje fonty (SIL OFL 1.1) z pakietów npm @fontsource / @fontsource-variable do limesurvey-themes/fonts/
 * i zapisuje manifest fonts.json, z którego korzysta build.mjs.
 *
 *   node limesurvey-themes/fonts/vendor.mjs <katalog node_modules> [<katalog node_modules> …]
 *
 * Skrypt szuka każdego pakietu z listy FONTS w podanych katalogach node_modules (pierwsze trafienie wygrywa),
 * kopiuje tylko potrzebne grubości i zestawy znaków (łaciński, łaciński rozszerzony — polskie, niemieckie,
 * francuskie, hiszpańskie znaki — oraz cyrylica, gdy font ją ma, dla ankiet po ukraińsku) i przepisuje
 * zakresy unicode-range z arkuszy pakietu. Fonty są potem pakowane do motywów — nic nie jest ładowane z CDN.
 *
 * Copies OFL fonts from @fontsource packages into limesurvey-themes/fonts/ and writes fonts.json for build.mjs.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SUBSETS = ['latin', 'latin-ext', 'cyrillic'];

/**
 * slug: katalog w fonts/, family: nazwa w CSS (bez „Variable”), pkg: pakiet npm,
 * faces: [arkusz CSS pakietu, grubość w @font-face]; zmienne fonty mają zakres grubości („200 800”).
 */
export const FONTS = [
  { slug: 'literata', family: 'Literata', pkg: '@fontsource/literata', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'brygada-1918', family: 'Brygada 1918', pkg: '@fontsource/brygada-1918', faces: [['600.css'], ['700.css']] },
  { slug: 'noto-sans', family: 'Noto Sans', pkg: '@fontsource/noto-sans', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'geist', family: 'Geist', pkg: '@fontsource-variable/geist', faces: [['wght.css']] },
  { slug: 'bricolage-grotesque', family: 'Bricolage Grotesque', pkg: '@fontsource-variable/bricolage-grotesque', faces: [['wght.css']] },
  { slug: 'dm-sans', family: 'DM Sans', pkg: '@fontsource/dm-sans', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'barlow-condensed', family: 'Barlow Condensed', pkg: '@fontsource/barlow-condensed', faces: [['600.css'], ['700.css']] },
  { slug: 'barlow', family: 'Barlow', pkg: '@fontsource/barlow', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'ibm-plex-sans', family: 'IBM Plex Sans', pkg: '@fontsource/ibm-plex-sans', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'newsreader', family: 'Newsreader', pkg: '@fontsource-variable/newsreader', faces: [['wght.css'], ['wght-italic.css']] },
  { slug: 'instrument-sans', family: 'Instrument Sans', pkg: '@fontsource/instrument-sans', faces: [['400.css'], ['400-italic.css'], ['600.css'], ['700.css']] },
  { slug: 'inter', family: 'Inter', pkg: '@fontsource-variable/inter', faces: [['wght.css'], ['wght-italic.css']] },
];

/** Odczytuje bloki @font-face z arkusza fontsource. */
function parseFaces(css) {
  const out = [];
  for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const body = m[1];
    const get = (prop) => (body.match(new RegExp(`${prop}:\\s*([^;]+);`)) || [])[1]?.trim();
    const file = (get('src') || '').match(/url\(\.\/files\/([^)]+\.woff2)\)/)?.[1];
    if (!file) continue;
    out.push({ file, style: get('font-style'), weight: get('font-weight'), unicodeRange: get('unicode-range') });
  }
  return out;
}

function main(dirs) {
  if (!dirs.length) {
    console.error('Użycie: node limesurvey-themes/fonts/vendor.mjs <node_modules> [<node_modules> …]');
    process.exit(1);
  }
  const manifest = {};
  for (const f of FONTS) {
    const base = dirs.map((d) => join(d, f.pkg)).find((p) => existsSync(join(p, 'package.json')));
    if (!base) throw new Error(`Nie znaleziono pakietu ${f.pkg} w: ${dirs.join(', ')}`);
    const pkg = JSON.parse(readFileSync(join(base, 'package.json'), 'utf8'));
    if (pkg.license !== 'OFL-1.1') throw new Error(`${f.pkg}: nieoczekiwana licencja ${pkg.license}`);
    const out = join(ROOT, f.slug);
    rmSync(out, { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
    copyFileSync(join(base, 'LICENSE'), join(out, 'OFL.txt'));
    const faces = [];
    for (const [sheet] of f.faces) {
      for (const face of parseFaces(readFileSync(join(base, sheet), 'utf8'))) {
        const subset = SUBSETS.find((s) => face.file.includes(`-${s}-`));
        // „latin” pasuje też do „latin-ext” — sprawdzamy dłuższą nazwę najpierw
        const exact = face.file.includes('-latin-ext-') ? 'latin-ext' : subset;
        if (!exact || !SUBSETS.includes(exact)) continue;
        if (exact === 'cyrillic' && face.file.includes('-cyrillic-ext-')) continue;
        copyFileSync(join(base, 'files', face.file), join(out, face.file));
        faces.push({ ...face, subset: exact });
      }
    }
    manifest[f.slug] = { family: f.family, package: f.pkg, version: pkg.version, license: 'OFL-1.1', faces };
    console.log(`✓ ${f.slug} ${pkg.version}: ${faces.length} plików`);
  }
  writeFileSync(join(ROOT, 'fonts.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
