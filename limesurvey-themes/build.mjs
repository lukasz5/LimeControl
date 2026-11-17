#!/usr/bin/env node
/**
 * Buduje motywy ankiet LimeControl dla LimeSurvey 6.x+:
 *   node limesurvey-themes/build.mjs
 *
 * 1. Sprawdza kontrast kolorów każdego motywu (WCAG 2.2 AA) — przerywa przy błędzie.
 * 2. Tworzy limesurvey-themes/dist/lc_<id>/ (config.xml, css, scripts, files).
 * 3. Pakuje ZIP-y do site/szablony/pobierz/ (nazwa pliku = nazwa motywu w LS).
 * 4. Kopiuje CSS do site/szablony/assets/ (podgląd na żywo na stronie).
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

const configXml = (t) => `<?xml version="1.0" encoding="UTF-8"?>
<!--
    ${t.title} — motyw ankiety LimeSurvey (motyw potomny fruity_twentythree).
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
        <description><![CDATA[${t.description}]]></description>
        <lastUpdate>${dateISO}</lastUpdate>
        <extends>${cfg.extends}</extends>
    </metadata>

    <compatibility>
        <version>${cfg.lsMin}</version>
    </compatibility>

    <!-- Pliki motywu bazowego są dziedziczone; poniższe dodawane są na końcu, więc nadpisują jego style. -->
    <files>
        <css>
            <add>css/lc-theme.css</add>
            <add>css/lc-base.css</add>
        </css>
        <js>
            <add>scripts/lc-a11y.js</add>
        </js>
    </files>

    <!-- Domyślne opcje dobrane pod dostępność: komunikaty na stronie zamiast wyskakujących okien. -->
    <options>
        <hideprivacyinfo type="buttons" category="Simple options" width="4" title="Hide privacy info" options="on|off" optionlabels="Yes|No">off</hideprivacyinfo>
        <showpopups type="buttons" category="Simple options" width="4" title="Show popups" options="1|0|-1" optionlabels="Popup|On page|No">0</showpopups>
        <showclearall type="buttons" category="Simple options" width="4" title="Show 'Clear all' button" options="on|off" optionlabels="Yes|No">off</showclearall>
        <questionhelptextposition type="buttons" category="Simple options" width="4" title="Question help text position" options="top|bottom" optionlabels="Top|Bottom">top</questionhelptextposition>
        <fixnumauto type="buttons" category="Simple options" width="4" title="Fix automatically numeric value" options="enable|partial|disable" optionlabels="Yes|For expression|No">enable</fixnumauto>
        <backgroundimage type="buttons" category="Images" width="4" title="Background image" options="on|off" optionlabels="Yes|No">off</backgroundimage>
        <backgroundimagefile type="dropdown" category="Images" width="6" title="Background image file" parent="backgroundimage">./files/pattern.png</backgroundimagefile>
        <brandlogo type="buttons" category="Images" width="4" title="Logo" options="on|off" optionlabels="Yes|No">off</brandlogo>
        <brandlogofile type="dropdown" category="Images" width="6" title="Logo file" parent="brandlogo">./files/logo.png</brandlogofile>
        <font type="dropdown" category="Fonts" width="12" title="Fonts">arial
            <dropdownoptions>
                <optgroup label="User browser">
                    <option class="font-arial" value="arial" data-font-package="websafe">Arial</option>
                    <option class="font-georgia" value="georgia" data-font-package="websafe">Georgia</option>
                    <option class="font-trebuchet" value="trebuchet" data-font-package="websafe">Trebuchet</option>
                </optgroup>
            </dropdownoptions>
        </font>
        <cssframework type="dropdown" category="Simple options" width="12" title="Variations">Apple
            <dropdownoptions>
                <optgroup>
                    <option data-value="css/variations/theme_apple.css" value="apple">Apple</option>
                </optgroup>
            </dropdownoptions>
        </cssframework>
    </options>
</config>
`;

const readme = (t) => `# ${t.title}

${t.description}

Motyw ankiety dla LimeSurvey ${cfg.lsMin}+ (dziedziczy po wbudowanym motywie „${cfg.extends}”).
Wersja ${cfg.version} · licencja GPL-2.0-or-later · https://limecontrol.eu/szablony.html

## Instalacja

1. Zaloguj się do LimeSurvey jako administrator.
2. Konfiguracja → Motywy → zakładka „Motywy ankiet” → przycisk „Importuj”.
3. Wskaż plik lc_${t.id}.zip (nie zmieniaj jego nazwy) i kliknij „Importuj”.
4. Ankieta → Ustawienia → Ustawienia ogólne → Motyw: „${t.title}” → Zapisz.

Instalacja ręczna (FTP/SSH): rozpakuj ZIP do katalogu upload/themes/survey/lc_${t.id}/
(plik config.xml musi leżeć bezpośrednio w tym katalogu), a następnie w
Konfiguracja → Motywy kliknij „Zainstaluj” przy motywie.

## Dostosowanie

- Kolory i fonty: css/lc-theme.css (zmienne --lc-*).
- Logo: Motywy → ${t.title} → Opcje motywu → Obrazy → Logo: Tak (wgraj PNG/JPG).
- Własne poprawki CSS dodawaj w edytorze motywu do css/custom.css.

## Dostępność (WCAG 2.2 AA)

Kontrast tekstu >= 4.5:1, obramowań i fokusu >= 3:1, natywne pola wyboru
(tryb wysokiego kontrastu), cele dotykowe >= 44 px, link „Przejdź do pytań”,
błędy oznaczone kolorem, obramowaniem i tekstem, aria-invalid/aria-required,
obsługa prefers-reduced-motion i forced-colors.
`;

// ---------- build ----------
rmSync(DIST, { recursive: true, force: true });
rmSync(SITE, { recursive: true, force: true });
mkdirSync(join(SITE, 'pobierz'), { recursive: true });
mkdirSync(join(SITE, 'img'), { recursive: true });

const report = [];
for (const t of cfg.themes) {
  const results = checkContrast(t);
  const dir = join(DIST, `lc_${t.id}`);
  for (const d of ['css', 'scripts', 'files', 'views']) mkdirSync(join(dir, d), { recursive: true });
  writeFileSync(join(dir, 'config.xml'), configXml(t));
  writeFileSync(join(dir, 'README.md'), readme(t));
  // LS wymaga katalogu views/ także w motywie potomnym (widoki dziedziczone z fruity_twentythree).
  writeFileSync(join(dir, 'views/README.md'), `Widoki są dziedziczone z motywu ${cfg.extends}.\nAby nadpisać widok, skopiuj tu plik .twig z motywu bazowego (np. przez Edytor motywu w LimeSurvey).\n`);
  writeFileSync(join(dir, 'css/lc-theme.css'), themeCss(t));
  copyFileSync(join(ROOT, 'shared/css/lc-base.css'), join(dir, 'css/lc-base.css'));
  copyFileSync(join(ROOT, 'shared/scripts/lc-a11y.js'), join(dir, 'scripts/lc-a11y.js'));
  // Podglądy to zrzuty z prawdziwego LimeSurvey (patrz README.md → „Podglądy”).
  const preview = join(ROOT, 'previews', `${t.id}.png`);
  if (existsSync(preview)) copyFileSync(preview, join(dir, 'files/preview.png'));
  else console.warn(`  ! brak podglądu previews/${t.id}.png — motyw będzie bez miniatury w LimeSurvey`);
  for (const v of ['desktop', 'mobile', 'errors']) {
    const img = join(ROOT, 'previews', `${t.id}-${v}.jpg`);
    if (existsSync(img)) copyFileSync(img, join(SITE, 'img', `${t.id}-${v}.jpg`));
  }

  const zip = join(SITE, 'pobierz', `lc_${t.id}.zip`);
  rmSync(zip, { force: true });
  // Pliki w korzeniu archiwum (jak eksport z LimeSurvey); bez metadanych macOS.
  execFileSync('zip', ['-qrX', zip, '.', '-x', '.*', '-x', '__MACOSX'], { cwd: dir });
  const size = statSync(zip).size;
  const worst = results.filter((r) => r.min === 4.5).sort((a, b) => a.ratio - b.ratio)[0];
  report.push({ id: t.id, size, minText: +worst.ratio.toFixed(2), btn: +contrast(t.tokens.onPrimary, t.tokens.primary).toFixed(2), body: +contrast(t.tokens.text, t.tokens.surface).toFixed(2) });
  console.log(`✓ lc_${t.id}.zip  ${(size / 1024).toFixed(1)} kB  min. kontrast tekstu ${worst.ratio.toFixed(2)}:1 (${worst.name})`);
}

// Paczka zbiorcza: sześć ZIP-ów motywów (każdy importuje się osobno).
const all = join(SITE, 'pobierz', 'limecontrol-motywy-ankiet.zip');
execFileSync('zip', ['-qjX', all, ...cfg.themes.map((t) => join(SITE, 'pobierz', `lc_${t.id}.zip`))]);
console.log(`✓ limecontrol-motywy-ankiet.zip  ${(statSync(all).size / 1024).toFixed(1)} kB`);

// Strona pobierania generowana z themes.json, żeby opisy, rozmiary i kontrasty były zawsze aktualne.
const { renderPage } = await import('./page.mjs');
writeFileSync(join(REPO, 'site', 'szablony.html'), renderPage({ cfg, report, allSize: statSync(all).size }));
console.log('✓ site/szablony.html');
