#!/usr/bin/env node
/**
 * Buduje motywy ankiet LimeControl dla LimeSurvey 6.x i 7.x:
 *   node limesurvey-themes/build.mjs
 *
 * 1. Sprawdza kontrast kolorów każdego motywu (WCAG 2.2 AA) — przerywa przy błędzie.
 * 2. Tworzy limesurvey-themes/dist/<ls6|ls7>/lc_<id>/ (config.xml, css, scripts, files, views).
 * 3. Pakuje ZIP-y do site/szablony/pobierz/<ls6|ls7>/ (nazwa pliku = nazwa motywu w LS).
 * 4. Kopiuje zrzuty z previews/ do site/szablony/img/ i fonty motywów do site/szablony/fonts/ (próbki na stronie).
 * 5. Pakuje wtyczkę LimeControlBranding (logotypy w nagłówku i stopce) do site/szablony/pobierz/.
 *
 * Podstrony z motywami (PL i EN) generuje osobno site-src/build.mjs — `npm run build:site`.
 *
 * Wynik jest deterministyczny: daty w paczkach pochodzą z pola „released” w themes.json,
 * więc ponowne uruchomienie bez zmian nie zmienia ZIP-ów.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync, statSync, readdirSync, utimesSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, '..');
const DIST = join(ROOT, 'dist');
const SITE = join(REPO, 'site', 'szablony');
const cfg = JSON.parse(readFileSync(join(ROOT, 'themes.json'), 'utf8'));
// Fonty (SIL OFL 1.1) skopiowane z pakietów @fontsource przez fonts/vendor.mjs — pakowane do motywów, bez CDN.
const FONTS = JSON.parse(readFileSync(join(ROOT, 'fonts', 'fonts.json'), 'utf8'));
const PLUGIN = { name: 'LimeControlBranding', dir: join(ROOT, 'plugin', 'LimeControlBranding') };

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
  /* Strzałka list rozwijanych w kolorze tekstu */
  --lc-select-arrow: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23${k.text.replace('#', '')}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");${k.colorScheme === 'dark' ? `
  /* Motyw ciemny: jasny przycisk zamykania okien (Bootstrap rysuje go na ciemno) */
  --lc-btn-close-filter: invert(1) grayscale(100%) brightness(200%);` : ''}${typeCss(k)}${layoutCss(t.layout)}
}
`;
};

/** Opcjonalne tokeny typografii i trybu kolorów (themes.json → tokens). Brak pola = wartość domyślna z lc-base.css. */
function typeCss(k) {
  const map = [
    ['colorScheme', 'color-scheme', 'Tryb kolorów natywnych pól i pasków przewijania (light / dark)'],
    ['headingStyle', 'heading-style', 'Styl tytułu ankiety i grup (normal / italic)'],
    ['headingTransform', 'heading-transform', 'Wielkość liter tytułu ankiety i grup (none / uppercase)'],
    ['headingTracking', 'heading-tracking', 'Odstęp między literami tytułu ankiety i grup'],
    ['questionFont', 'question-font', 'Font treści pytań (domyślnie font nagłówków)'],
    ['questionWeight', 'question-weight', 'Grubość treści pytań (domyślnie grubość nagłówków)'],
    ['numeric', 'numeric', 'Cyfry w polach liczbowych i tabelach (np. tabular-nums)'],
    ['headerStripe', 'header-stripe', 'Pasek w kolorze akcentu pod nagłówkiem'],
  ].filter(([key]) => k[key]);
  if (!map.length) return '';
  return ['', '', '  /* Typografia i tryb kolorów */', ...map.map(([key, name, note]) => `  --lc-${name}: ${k[key]}; /* ${note} */`)].join('\n');
}

/** Arkusz @font-face dla fontów motywu (themes.json → fonts). Pliki leżą w katalogu fonts/ paczki. */
function themeFonts(t) {
  if (!t.fonts) return [];
  const slugs = [...new Set(Object.values(t.fonts))];
  return slugs.map((slug) => {
    const f = FONTS[slug];
    if (!f) throw new Error(`Motyw ${t.id}: nieznany font „${slug}” (brak w fonts/fonts.json)`);
    return { slug, ...f };
  });
}

function fontsCss(t, prefix = '../fonts/') {
  const fonts = themeFonts(t);
  const roles = Object.entries(t.fonts).map(([role, slug]) => `${role}: ${FONTS[slug].family}`).join(', ');
  const faces = fonts.flatMap((f) => f.faces.map((face) => `@font-face {
  font-family: '${f.family}';
  font-style: ${face.style};
  font-weight: ${face.weight};
  font-display: swap;
  src: url(${prefix}${face.file}) format('woff2');
  unicode-range: ${face.unicodeRange};
}`));
  return `/*!
 * ${t.title} — fonty motywu (lc-fonts.css): ${roles}
 * ${fonts.map((f) => `${f.family} ${f.version}`).join(', ')} — SIL Open Font License 1.1 (fonts/OFL-*.txt).
 * Pliki są w paczce motywu: przeglądarka nie łączy się z żadnym zewnętrznym serwerem fontów.
 * Pobierane są tylko potrzebne zestawy znaków (łaciński, łaciński rozszerzony, cyrylica).
 */
${faces.join('\n\n')}
`;
}

/** Opcjonalne ustawienia układu motywu (themes.json → layout) jako zmienne CSS czytane przez lc-base.css. */
function layoutCss(layout) {
  if (!layout) return '';
  const lines = ['', '', '  /* Układ */'];
  if (layout.maxWidth) lines.push(`  --lc-layout-maxw: ${layout.maxWidth};`);
  if (layout.gap) lines.push(`  --lc-layout-gap: ${layout.gap};`);
  if (layout.target) lines.push(`  --lc-layout-target: ${layout.target};`);
  if (layout.cardPadding) lines.push(`  --lc-layout-card-pad: ${layout.cardPadding};`);
  if (layout.stickyNav) {
    lines.push(
      '  /* Pasek „Wstecz / Dalej” przyklejony do dołu ekranu */',
      '  --lc-nav-position: sticky;',
      '  --lc-nav-bg: var(--lc-bg);',
      '  --lc-nav-padding: .75rem 0;',
      '  --lc-nav-border: 1px solid var(--lc-border-soft);',
      '  --lc-nav-direction-mobile: row;',
      '  --lc-nav-col-mobile: auto;',
    );
  }
  if (layout.hotkeys) lines.push('  /* Skróty klawiszowe dla ankietera (lc-a11y.js): 1 = włączone */', '  --lc-hotkeys: 1;');
  return lines.join('\n');
}

const xmlEsc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Data wydania z themes.json (nie „dziś”) — paczki są wtedy powtarzalne bit w bit.
const today = new Date(`${cfg.released}T12:00:00Z`);
if (Number.isNaN(today.getTime())) throw new Error('themes.json: pole „released” musi mieć format RRRR-MM-DD');
const dateUS = `${String(today.getUTCMonth() + 1).padStart(2, '0')}/${String(today.getUTCDate()).padStart(2, '0')}/${today.getUTCFullYear()}`;
const dateISO = today.toISOString().slice(0, 19).replace('T', ' ');

/** ZIP zapisuje czas lokalny — stała strefa daje identyczne archiwa na każdej maszynie (także w CI). */
const ZIP_ENV = { ...process.env, TZ: 'UTC' };

/** Lista plików katalogu (rekurencyjnie, posortowana) z ustawioną stałą datą modyfikacji. */
function stampedFiles(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(full).isDirectory()) out.push(...stampedFiles(full, rel));
    else { utimesSync(full, today, today); out.push(rel); }
  }
  return out;
}

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

function engineXml(t, variant) {
  const raw = readFileSync(join(ROOT, 'base', `${variant.id}-engine.xml`), 'utf8');
  let xml = raw.slice(raw.indexOf('-->') + 3).trim();
  // Edytor motywów: zamiast CSS/JS motywu bazowego pokazujemy pliki tego motywu.
  xml = xml.replace(/^[ \t]*<file type="(css|js)">[^<]*<\/file>\r?\n/gm, '');
  const own = [...(t.fonts ? ['./css/lc-fonts.css'] : []), './css/lc-theme.css', './css/lc-base.css', './scripts/lc-a11y.js']
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
        <copyright>Copyright (C) ${today.getUTCFullYear()} LimeControl. Based on Fruity TwentyThree by LimeSurvey GmbH.</copyright>
        <license>GNU General Public License version 2 or later</license>
        <version>${cfg.version}</version>
        <apiVersion>3.0</apiVersion>
        <description><![CDATA[${t.description.en} For LimeSurvey ${variant.label}. / ${t.description.pl} Wariant dla LimeSurvey ${variant.label}.]]></description>
        <lastUpdate>${dateISO}</lastUpdate>
        <extends>${cfg.extends}</extends>
    </metadata>

    <!-- LimeSurvey uznaje motyw za zgodny, gdy numer główny wersji się zgadza. -->
    <compatibility>
        <version>${variant.compat}</version>
    </compatibility>

    <!-- Pliki motywu bazowego są dziedziczone; poniższe ładowane są po nich, więc nadpisują jego style. -->
    <files>
        <css>${t.fonts ? `
            <add>css/lc-fonts.css</add>` : ''}
            <add>css/lc-theme.css</add>
            <add>css/lc-base.css</add>
        </css>
        <js>
            <add>scripts/lc-a11y.js</add>
        </js>
    </files>

    <!-- Silnik jak w fruity_twentythree z LimeSurvey ${variant.testedOn}; <optionspage>core</optionspage>
         jest wymagane, żeby formularz „Opcje motywu” pokazał opcje. -->
    ${engineXml(t, variant)}

    <!-- Opcje jak w fruity_twentythree z LimeSurvey ${variant.testedOn}, z domyślnymi wartościami dobranymi pod dostępność. -->
    ${optionsXml(t, variant)}
</config>
`;

const readme = (t, variant) => `# ${t.title} — LimeSurvey ${variant.label}

Version ${cfg.version} · GPL-2.0-or-later · https://limecontrol.eu/en/themes.html

- [English](#english)
- [Polski](#polski)

## English

${t.description.en}

A survey theme for LimeSurvey ${variant.label} (it extends the built-in "${cfg.extends}" theme).
Tested on LimeSurvey ${variant.testedOn}. For the other LimeSurvey version download the other variant.

### Installation

1. Log in to LimeSurvey as an administrator.
2. Configuration → Themes → "Upload & install" (the "Survey themes" tab).
3. Choose lc_${t.id}.zip (do not rename it) and confirm.
4. In a survey: Survey settings → General → Theme: "${t.title}" → Save.

Manual installation (FTP/SSH): unpack the ZIP into upload/themes/survey/lc_${t.id}/
(config.xml must sit directly in that directory), then click "Install" next to the theme
in Configuration → Themes.

### Customisation

- Colours and fonts: css/lc-theme.css (the --lc-* variables).${t.fonts ? `
- Typography: ${fontRoles(t, 'en')}. The font files are inside the package (fonts/, SIL Open Font License 1.1) —
  respondents' browsers do not contact any external font server.` : ''}
- Logo: in a survey, Theme options → Images → Logo: Yes (upload a PNG/JPG).
- Several logos in the header, a logo strip in the footer (e.g. partners or EU funding) and your brand
  colour: the free LimeControlBranding plugin — https://limecontrol.eu/en/themes.html#branding
- Your own CSS tweaks: Theme editor → css/custom.css.
- Interviewer instructions: give a question the CSS class "lc-interviewer"
  (Question settings → Display → CSS class) to highlight it as a script or an interviewer-only field.

### Accessibility (WCAG 2.2 AA)

Text contrast >= 4.5:1, borders and focus >= 3:1, native form controls (high-contrast mode),
touch targets >= 44 px, a "Skip to questions" link, errors marked with colour, border and text,
aria-invalid/aria-required, on-page validation messages, prefers-reduced-motion and forced-colors support.

## Polski

${t.description.pl}

Motyw ankiety dla LimeSurvey ${variant.label} (dziedziczy po wbudowanym motywie „${cfg.extends}”).
Przetestowano na LimeSurvey ${variant.testedOn}. Dla drugiej wersji LimeSurvey pobierz drugi wariant:
https://limecontrol.eu/szablony.html

### Instalacja

1. Zaloguj się do LimeSurvey jako administrator.
2. Konfiguracja → Motywy → przycisk „Prześlij i zainstaluj” (zakładka „Motywy ankiet”).
3. Wskaż plik lc_${t.id}.zip (nie zmieniaj jego nazwy) i potwierdź.
4. W ankiecie: Ustawienia ankiety → Ogólne → Motyw: „${t.title}” → Zapisz.

Instalacja ręczna (FTP/SSH): rozpakuj ZIP do katalogu upload/themes/survey/lc_${t.id}/
(plik config.xml musi leżeć bezpośrednio w tym katalogu), a następnie w
Konfiguracja → Motywy kliknij „Zainstaluj” przy motywie.

### Dostosowanie

- Kolory i fonty: css/lc-theme.css (zmienne --lc-*).${t.fonts ? `
- Typografia: ${fontRoles(t, 'pl')}. Pliki fontów są w paczce (fonts/, licencja SIL Open Font License 1.1) —
  przeglądarka respondenta nie łączy się z żadnym zewnętrznym serwerem fontów.` : ''}
- Logo: w ankiecie Opcje motywu → Obrazy → Logo: Tak (wgraj PNG/JPG).
- Kilka logotypów w nagłówku, pasek logotypów w stopce (np. partnerzy, fundusze UE) i kolor marki:
  darmowa wtyczka LimeControlBranding — https://limecontrol.eu/szablony.html#branding
- Własne poprawki CSS: Edytor motywów → css/custom.css.
- Wskazówki dla ankietera: nadaj pytaniu klasę CSS „lc-interviewer”
  (Ustawienia pytania → Wyświetlanie → Klasa CSS), aby wyróżnić je jako skrypt lub pole ankietera.

### Dostępność (WCAG 2.2 AA)

Kontrast tekstu >= 4.5:1, obramowań i fokusu >= 3:1, natywne pola wyboru
(tryb wysokiego kontrastu), cele dotykowe >= 44 px, link „Przejdź do pytań”,
błędy oznaczone kolorem, obramowaniem i tekstem, aria-invalid/aria-required,
komunikaty walidacji na stronie, obsługa prefers-reduced-motion i forced-colors.
`;

/** „nagłówki: Newsreader, tekst: Instrument Sans” — opis par fontów do README i strony. */
export function fontRoles(t, lang) {
  if (!t.fonts) return '';
  const names = { pl: { heading: 'nagłówki', body: 'tekst' }, en: { heading: 'headings', body: 'body text' }, de: { heading: 'Überschriften', body: 'Fließtext' } }[lang];
  if (t.fonts.heading === t.fonts.body) return FONTS[t.fonts.body].family;
  return Object.entries(t.fonts).map(([role, slug]) => `${names[role] || role}: ${FONTS[slug].family}`).join(', ');
}

/** Pakuje wtyczkę LimeControlBranding: ZIP z katalogiem wtyczki w korzeniu (jak oczekuje menedżer wtyczek LS). */
function buildPlugin(log) {
  if (!existsSync(PLUGIN.dir)) return null;
  const configXml = readFileSync(join(PLUGIN.dir, 'config.xml'), 'utf8');
  const version = (configXml.match(/<version>([^<]+)<\/version>/) || [])[1];
  const outDir = join(SITE, 'pobierz');
  mkdirSync(outDir, { recursive: true });
  const zip = join(outDir, `${PLUGIN.name}.zip`);
  const files = stampedFiles(PLUGIN.dir, PLUGIN.name);
  execFileSync('zip', ['-qX', zip, ...files], { cwd: dirname(PLUGIN.dir), env: ZIP_ENV });
  utimesSync(zip, today, today);
  const size = statSync(zip).size;
  log(`✓ ${PLUGIN.name}.zip ${version}  ${(size / 1024).toFixed(1)} kB`);
  return { name: PLUGIN.name, version, size, file: `/szablony/pobierz/${PLUGIN.name}.zip` };
}

// ---------- build ----------
/**
 * Buduje paczki motywów i kopiuje zrzuty do site/szablony/. Zwraca dane potrzebne podstronom
 * z motywami (generuje je site-src/build.mjs).
 */
export function build({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
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

    // Fonty motywu: do paczki (fonts/) i na stronę (próbki pisma w galerii).
    const fonts = themeFonts(t);
    for (const f of fonts) {
      mkdirSync(join(SITE, 'fonts'), { recursive: true });
      for (const face of f.faces) copyFileSync(join(ROOT, 'fonts', f.slug, face.file), join(SITE, 'fonts', face.file));
    }
    rep.fonts = t.fonts ? Object.fromEntries(Object.entries(t.fonts).map(([role, slug]) => [role, FONTS[slug].family])) : null;

    for (const variant of VARIANTS) {
      const dir = join(DIST, variant.id, `lc_${t.id}`);
      for (const d of ['css', 'scripts', 'files', 'views']) mkdirSync(join(dir, d), { recursive: true });
      writeFileSync(join(dir, 'config.xml'), configXml(t, variant));
      writeFileSync(join(dir, 'README.md'), readme(t, variant));
      // LS wymaga katalogu views/ także w motywie potomnym (widoki dziedziczone z fruity_twentythree).
      writeFileSync(join(dir, 'views/README.md'), `Views are inherited from the ${cfg.extends} theme.\nTo override a view, copy its .twig file here from the parent theme (e.g. with the LimeSurvey theme editor).\n\nWidoki są dziedziczone z motywu ${cfg.extends}.\nAby nadpisać widok, skopiuj tu plik .twig z motywu bazowego (np. przez Edytor motywów w LimeSurvey).\n`);
      writeFileSync(join(dir, 'css/lc-theme.css'), themeCss(t));
      if (fonts.length) {
        mkdirSync(join(dir, 'fonts'), { recursive: true });
        writeFileSync(join(dir, 'css/lc-fonts.css'), fontsCss(t));
        for (const f of fonts) {
          copyFileSync(join(ROOT, 'fonts', f.slug, 'OFL.txt'), join(dir, 'fonts', `OFL-${f.slug}.txt`));
          for (const face of f.faces) copyFileSync(join(ROOT, 'fonts', f.slug, face.file), join(dir, 'fonts', face.file));
        }
      }
      copyFileSync(join(ROOT, 'shared/css/lc-base.css'), join(dir, 'css/lc-base.css'));
      copyFileSync(join(ROOT, 'shared/scripts/lc-a11y.js'), join(dir, 'scripts/lc-a11y.js'));
      if (existsSync(preview)) copyFileSync(preview, join(dir, 'files/preview.png'));

      const outDir = join(SITE, 'pobierz', variant.id);
      mkdirSync(outDir, { recursive: true });
      const zip = join(outDir, `lc_${t.id}.zip`);
      // Pliki w korzeniu archiwum (jak eksport z LimeSurvey); bez metadanych macOS, w stałej kolejności i ze stałą datą.
      execFileSync('zip', ['-qX', zip, ...stampedFiles(dir)], { cwd: dir, env: ZIP_ENV });
      utimesSync(zip, today, today);
      rep.sizes[variant.id] = statSync(zip).size;
    }
    report.push(rep);
    log(`✓ lc_${t.id}  ${VARIANTS.map((v) => `${v.id}: ${(rep.sizes[v.id] / 1024).toFixed(1)} kB`).join(', ')}  min. kontrast tekstu ${worst.ratio.toFixed(2)}:1`);
  }

  // Paczki zbiorcze: ZIP-y wszystkich motywów danej wersji (każdy importuje się osobno).
  const bundles = {};
  for (const variant of VARIANTS) {
    const all = join(SITE, 'pobierz', variant.id, `limecontrol-motywy-ankiet-${variant.id}.zip`);
    execFileSync('zip', ['-qjX', all, ...cfg.themes.map((t) => join(SITE, 'pobierz', variant.id, `lc_${t.id}.zip`))], { env: ZIP_ENV });
    utimesSync(all, today, today);
    bundles[variant.id] = statSync(all).size;
    log(`✓ ${variant.id}/limecontrol-motywy-ankiet-${variant.id}.zip  ${(bundles[variant.id] / 1024).toFixed(1)} kB`);
  }

  // Arkusz z próbkami pisma dla galerii na stronie (te same pliki woff2 co w paczkach).
  // Rodziny z przedrostkiem „LC ”, żeby nie mieszały się z fontami samej strony (np. DM Sans).
  const specimen = cfg.themes.filter((t) => t.fonts).map((t) => fontsCss(t, '/szablony/fonts/')
    .replace(/^\/\*![\s\S]*?\*\/\n/, '')
    .replace(/font-family: '([^']+)'/g, "font-family: 'LC $1'"));
  const uniqueFaces = [...new Set(specimen.join('\n\n').split(/\n\n(?=@font-face)/).map((b) => b.trim()))].filter(Boolean);
  if (uniqueFaces.length) {
    writeFileSync(join(SITE, 'fonts', 'specimens.css'), `/* Fonty motywów LimeControl (SIL OFL 1.1) — próbki pisma w galerii motywów. */\n${uniqueFaces.join('\n\n')}\n`);
    utimesSync(join(SITE, 'fonts', 'specimens.css'), today, today);
  }

  const plugin = buildPlugin(log);
  // Zrzuty wtyczki (sekcja #branding na stronie): previews/branding-*.jpg → site/szablony/img/.
  if (plugin) {
    plugin.shots = readdirSync(join(ROOT, 'previews')).filter((f) => /^branding-[a-z]+\.jpg$/.test(f)).sort();
    for (const f of plugin.shots) copyFileSync(join(ROOT, 'previews', f), join(SITE, 'img', f));
  }
  return { cfg, report, bundles, plugin, fonts: FONTS };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) build();
