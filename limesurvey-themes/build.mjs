#!/usr/bin/env node
/**
 * Buduje motywy ankiet LimeControl dla LimeSurvey 6.x i 7.x:
 *   node limesurvey-themes/build.mjs
 *
 * 1. Sprawdza kontrast kolorów każdego motywu (WCAG 2.2 AA) — przerywa przy błędzie.
 * 2. Tworzy limesurvey-themes/dist/<ls6|ls7>/lc_<id>/ (config.xml, css, scripts, files, views).
 * 3. Pakuje ZIP-y do site/szablony/pobierz/<ls6|ls7>/ (nazwa pliku = nazwa motywu w LS).
 * 4. Kopiuje zrzuty z previews/ i generuje stronę site/szablony.html.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, '..');
const DIST = join(ROOT, 'dist');
const SITE = join(REPO, 'site', 'szablony');
const cfg = JSON.parse(readFileSync(join(ROOT, 'themes.json'), 'utf8'));

// ---------- kontrast WCAG ----------
const hexToRgb = (h) => { const n = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)); };
const lum = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

function checkContrast(theme) {
  const k = theme.tokens;
  const rules = [
    ['tekst / tło', k.text, k.bg, 4.5],
    ['tekst / karta', k.text, k.surface, 4.5],
    ['tekst / zaznaczenie', k.text, k.accent, 4.5],
    ['tekst pomocniczy / karta', k.muted, k.surface, 4.5],
    ['tekst pomocniczy / tło', k.muted, k.bg, 4.5],
    ['link / karta', k.primary, k.surface, 4.5],
    ['link / tło', k.primary, k.bg, 4.5],
    ['przycisk: tekst / tło', k.onPrimary, k.primary, 4.5],
    ['przycisk hover: tekst / tło', k.onPrimary, k.primaryHover, 4.5],
    ['nagłówek: tekst / tło', k.headerText, k.headerBg, 4.5],
    ['błąd / karta', k.danger, k.surface, 4.5],
    ['błąd / tło błędu', k.danger, k.dangerBg, 4.5],
    ['obramowanie pól / karta (1.4.11)', k.border, k.surface, 3],
    ['obramowanie pól / tło (1.4.11)', k.border, k.bg, 3],
    ['kontrolka zaznaczona / zaznaczenie (1.4.11)', k.primary, k.accent, 3],
    ['fokus / karta (2.4.13)', k.focus, k.surface, 3],
    ['fokus / tło (2.4.13)', k.focus, k.bg, 3],
  ];
  const results = rules.map(([name, fg, bg, min]) => ({ name, fg, bg, min, ratio: contrast(fg, bg) }));
  const failed = results.filter((r) => r.ratio < r.min);
  if (failed.length) {
    failed.forEach((f) => console.error(`  ✗ ${theme.id}: ${f.name} ${f.fg} na ${f.bg} = ${f.ratio.toFixed(2)} (min ${f.min})`));
    throw new Error(`Motyw ${theme.id} nie spełnia WCAG AA`);
  }
  return results;
}

// ---------- pliki ----------
const rgb = (hex) => hexToRgb(hex).join(', ');
const themeCss = (t) => {
  const k = t.tokens;
  return `/*!
 * ${t.title} — tokeny motywu (lc-theme.css)
 * Zmień wartości poniżej, aby dopasować motyw do marki.
 * Po zmianie kolorów sprawdź kontrast (min. 4.5:1 dla tekstu, 3:1 dla obramowań).
 */
:root {
  --lc-primary: ${k.primary};
  --lc-primary-rgb: ${rgb(k.primary)};
  --lc-primary-hover: ${k.primaryHover};
  --lc-on-primary: ${k.onPrimary};
  --lc-bg: ${k.bg};
  --lc-surface: ${k.surface};
  --lc-text: ${k.text};
  --lc-muted: ${k.muted};
  --lc-border: ${k.border};
  --lc-border-soft: ${k.borderSoft};
  --lc-accent: ${k.accent};
  --lc-header-bg: ${k.headerBg};
  --lc-header-text: ${k.headerText};
  --lc-header-border: ${k.headerBg.toUpperCase() === k.bg.toUpperCase() || k.headerBg.toUpperCase() === '#FFFFFF' ? k.borderSoft : 'transparent'};
  --lc-focus: ${k.focus};
  --lc-danger: ${k.danger};
  --lc-danger-bg: ${k.dangerBg};
  --lc-radius: ${k.radius};
  --lc-radius-btn: ${k.radiusBtn};
  --lc-shadow: ${k.shadow};
  --lc-font: ${k.font};
  --lc-font-heading: ${k.fontHeading};
  --lc-heading-weight: ${k.headingWeight};
  --lc-base-size: ${k.baseSize};
}
`;
};

const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const today = new Date();
const dateUS = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
const dateISO = today.toISOString().slice(0, 19).replace('T', ' ');

// ---------- warianty dla wersji LimeSurvey ----------
// Formularz „Opcje motywu” czyta definicje opcji tylko z config.xml samego motywu, a LS 6 i LS 7
// mają różne opcje fruity_twentythree — dlatego każdy motyw ma osobną paczkę dla LS 6 i LS 7.
const VARIANTS = cfg.variants;

/** Ustawia wartość domyślną opcji (tekst przed pierwszym dzieckiem / znacznikiem zamykającym). */
function setOption(xml, name, value) {
  const re = new RegExp(`(<${name}\\b[^>]*>)[^<]*`);
  if (!re.test(xml)) return xml;
  return xml.replace(re, `$1${value}`);
}

function optionsXml(t, variant) {
  const raw = readFileSync(join(ROOT, 'base', `${variant.id}-options.xml`), 'utf8');
  let xml = raw.slice(raw.indexOf('-->') + 3).trim();
  const k = t.tokens;
  // Komunikaty walidacji na stronie zamiast okna (lepsze dla czytników ekranu i lupy).
  xml = setOption(xml, 'showpopups', '0');
  // Font i tak ustawia lc-theme.css — nie ładujemy zbędnego pakietu fontów.
  xml = setOption(xml, 'font', 'arial');
  // LS 7: kolory z opcji trafiają do inline <style>; ustawiamy je zgodnie z paletą motywu.
  xml = setOption(xml, 'bodybackgroundcolor', k.bg);
  xml = setOption(xml, 'fontcolor', k.text);
  xml = setOption(xml, 'questionbackgroundcolor', k.surface);
  const r = parseInt(k.radius, 10);
  xml = setOption(xml, 'cornerradius', r <= 2 ? '1' : r <= 10 ? '2' : '3');
  return xml.replace(/^/gm, '    ').trimStart();
}

function engineXml(variant) {
  const raw = readFileSync(join(ROOT, 'base', `${variant.id}-engine.xml`), 'utf8');
  let xml = raw.slice(raw.indexOf('-->') + 3).trim();
  // Edytor motywów: zamiast CSS/JS motywu bazowego pokazujemy pliki tego motywu.
  xml = xml.replace(/^[ \t]*<file type="(css|js)">[^<]*<\/file>\r?\n/gm, '');
  const own = ['./css/lc-theme.css', './css/lc-base.css', './scripts/lc-a11y.js']
    .map((f) => `                    <file type="${f.endsWith('.js') ? 'js' : 'css'}">${f}</file>\n`).join('');
  xml = xml.replace(/<(\w+)>(\s*<screen_title[\s\S]*?)<\/\1>/g, (m, tag, body) => `<${tag}>${body.replace(/\s*$/, '\n')}${own}                </${tag}>`);
  return xml.replace(/^/gm, '    ').trimStart();
}

const configXml = (t, variant) => `<?xml version="1.0" encoding="UTF-8"?>
<!--
    ${t.title} — motyw ankiety dla LimeSurvey ${variant.label} (motyw potomny fruity_twentythree).
    Nazwa katalogu i pliku ZIP musi brzmieć: lc_${t.id}
    https://limecontrol.eu/szablony.html
-->
<config>
    <metadata>
        <name>lc_${t.id}</name>
        <title>${xmlEsc(t.title)}</title>
        <type>theme</type>
        <creationDate>${dateUS}</creationDate>
        <author>LimeControl / strefabadan.pl</author>
        <authorEmail>kontakt@strefabadan.pl</authorEmail>
        <authorUrl>https://limecontrol.eu/szablony.html</authorUrl>
        <copyright>Copyright (C) ${today.getFullYear()} LimeControl. Based on Fruity TwentyThree by LimeSurvey GmbH.</copyright>
        <license>GNU General Public License version 2 or later</license>
        <version>${cfg.version}</version>
        <apiVersion>3.0</apiVersion>
        <description><![CDATA[${t.description} Wariant dla LimeSurvey ${variant.label}.]]></description>
        <lastUpdate>${dateISO}</lastUpdate>
        <extends>${cfg.extends}</extends>
    </metadata>

    <!-- LimeSurvey uznaje motyw za zgodny, gdy numer główny wersji się zgadza. -->
    <compatibility>
        <version>${variant.compat}</version>
    </compatibility>

    <!-- Pliki motywu bazowego są dziedziczone; poniższe ładowane są po nich, więc nadpisują jego style. -->
    <files>
        <css>
            <add>css/lc-theme.css</add>
            <add>css/lc-base.css</add>
        </css>
        <js>
            <add>scripts/lc-a11y.js</add>
        </js>
    </files>

    <!-- Silnik jak w fruity_twentythree z LimeSurvey ${variant.testedOn}; <optionspage>core</optionspage>
         jest wymagane, żeby formularz „Opcje motywu” pokazał opcje. -->
    ${engineXml(variant)}

    <!-- Opcje jak w fruity_twentythree z LimeSurvey ${variant.testedOn}, z domyślnymi wartościami dobranymi pod dostępność. -->
    ${optionsXml(t, variant)}
</config>
`;

const readme = (t, variant) => `# ${t.title} — LimeSurvey ${variant.label}

${t.description}

Motyw ankiety dla LimeSurvey ${variant.label} (dziedziczy po wbudowanym motywie „${cfg.extends}”).
Przetestowano na LimeSurvey ${variant.testedOn}. Dla drugiej wersji LimeSurvey pobierz drugi wariant:
https://limecontrol.eu/szablony.html
Wersja ${cfg.version} · licencja GPL-2.0-or-later

## Instalacja

1. Zaloguj się do LimeSurvey jako administrator.
2. Konfiguracja → Motywy → przycisk „Prześlij i zainstaluj” (zakładka „Motywy ankiet”).
3. Wskaż plik lc_${t.id}.zip (nie zmieniaj jego nazwy) i potwierdź.
4. W ankiecie: Ustawienia ankiety → Ogólne → Motyw: „${t.title}” → Zapisz.

Instalacja ręczna (FTP/SSH): rozpakuj ZIP do katalogu upload/themes/survey/lc_${t.id}/
(plik config.xml musi leżeć bezpośrednio w tym katalogu), a następnie w
Konfiguracja → Motywy kliknij „Zainstaluj” przy motywie.

## Dostosowanie

- Kolory i fonty: css/lc-theme.css (zmienne --lc-*).
- Logo: w ankiecie Opcje motywu → Obrazy → Logo: Tak (wgraj PNG/JPG).
- Własne poprawki CSS: Edytor motywów → css/custom.css.

## Dostępność (WCAG 2.2 AA)

Kontrast tekstu >= 4.5:1, obramowań i fokusu >= 3:1, natywne pola wyboru
(tryb wysokiego kontrastu), cele dotykowe >= 44 px, link „Przejdź do pytań”,
błędy oznaczone kolorem, obramowaniem i tekstem, aria-invalid/aria-required,
komunikaty walidacji na stronie, obsługa prefers-reduced-motion i forced-colors.
`;

// ---------- build ----------
rmSync(DIST, { recursive: true, force: true });
rmSync(SITE, { recursive: true, force: true });
mkdirSync(join(SITE, 'img'), { recursive: true });

const report = [];
for (const t of cfg.themes) {
  const results = checkContrast(t);
  const worst = results.filter((r) => r.min === 4.5).sort((a, b) => a.ratio - b.ratio)[0];
  const rep = { id: t.id, sizes: {}, minText: +worst.ratio.toFixed(2), btn: +contrast(t.tokens.onPrimary, t.tokens.primary).toFixed(2), body: +contrast(t.tokens.text, t.tokens.surface).toFixed(2) };

  // Podglądy to zrzuty z prawdziwego LimeSurvey (patrz README.md → „Podglądy”).
  const preview = join(ROOT, 'previews', `${t.id}.png`);
  if (!existsSync(preview)) console.warn(`  ! brak podglądu previews/${t.id}.png — motyw będzie bez miniatury w LimeSurvey`);
  for (const v of ['desktop', 'mobile', 'errors']) {
    const img = join(ROOT, 'previews', `${t.id}-${v}.jpg`);
    if (existsSync(img)) copyFileSync(img, join(SITE, 'img', `${t.id}-${v}.jpg`));
  }

  for (const variant of VARIANTS) {
    const dir = join(DIST, variant.id, `lc_${t.id}`);
    for (const d of ['css', 'scripts', 'files', 'views']) mkdirSync(join(dir, d), { recursive: true });
    writeFileSync(join(dir, 'config.xml'), configXml(t, variant));
    writeFileSync(join(dir, 'README.md'), readme(t, variant));
    // LS wymaga katalogu views/ także w motywie potomnym (widoki dziedziczone z fruity_twentythree).
    writeFileSync(join(dir, 'views/README.md'), `Widoki są dziedziczone z motywu ${cfg.extends}.\nAby nadpisać widok, skopiuj tu plik .twig z motywu bazowego (np. przez Edytor motywów w LimeSurvey).\n`);
    writeFileSync(join(dir, 'css/lc-theme.css'), themeCss(t));
    copyFileSync(join(ROOT, 'shared/css/lc-base.css'), join(dir, 'css/lc-base.css'));
    copyFileSync(join(ROOT, 'shared/scripts/lc-a11y.js'), join(dir, 'scripts/lc-a11y.js'));
    if (existsSync(preview)) copyFileSync(preview, join(dir, 'files/preview.png'));

    const outDir = join(SITE, 'pobierz', variant.id);
    mkdirSync(outDir, { recursive: true });
    const zip = join(outDir, `lc_${t.id}.zip`);
    // Pliki w korzeniu archiwum (jak eksport z LimeSurvey); bez metadanych macOS.
    execFileSync('zip', ['-qrX', zip, '.', '-x', '.*', '-x', '__MACOSX'], { cwd: dir });
    rep.sizes[variant.id] = statSync(zip).size;
  }
  report.push(rep);
  console.log(`✓ lc_${t.id}  ${VARIANTS.map((v) => `${v.id}: ${(rep.sizes[v.id] / 1024).toFixed(1)} kB`).join(', ')}  min. kontrast tekstu ${worst.ratio.toFixed(2)}:1`);
}

// Paczki zbiorcze: sześć ZIP-ów motywów danej wersji (każdy importuje się osobno).
const bundles = {};
for (const variant of VARIANTS) {
  const all = join(SITE, 'pobierz', variant.id, `limecontrol-motywy-ankiet-${variant.id}.zip`);
  execFileSync('zip', ['-qjX', all, ...cfg.themes.map((t) => join(SITE, 'pobierz', variant.id, `lc_${t.id}.zip`))]);
  bundles[variant.id] = statSync(all).size;
  console.log(`✓ ${variant.id}/limecontrol-motywy-ankiet-${variant.id}.zip  ${(bundles[variant.id] / 1024).toFixed(1)} kB`);
}

// Strona pobierania generowana z themes.json, żeby opisy, rozmiary i kontrasty były zawsze aktualne.
const { renderPage } = await import('./page.mjs');
writeFileSync(join(REPO, 'site', 'szablony.html'), renderPage({ cfg, report, bundles }));
console.log('✓ site/szablony.html');
