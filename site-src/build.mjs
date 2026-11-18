#!/usr/bin/env node
/**
 * Buduje całą stronę limecontrol.eu w obu językach:
 *   node site-src/build.mjs          (to samo: npm run build:site)
 *
 *   1. paczki motywów ankiet            → site/szablony/        (limesurvey-themes/build.mjs)
 *   2. pliki szablonów ankiet (.lss)    → site/ankiety/, public/szablony-ankiet/ (survey-templates/build.mjs)
 *   3. podstrony:
 *        pages/home.<lang>.html         → site/index.html,     site/en/index.html
 *        pages/docs.<lang>.html         → site/docs.html,      site/en/docs.html
 *        pages/privacy.<lang>.html      → site/prywatnosc.html, site/en/privacy.html
 *        pages/plugins.mjs              → site/wtyczki.html,   site/en/plugins.html
 *        pages/themes.mjs               → site/szablony.html,  site/en/themes.html
 *        pages/templates.mjs            → site/ankiety.html,   site/en/templates.html
 *   4. site/sitemap.xml ze wszystkimi podstronami i ich wersjami językowymi
 *
 * Kroki 1–2 to otwarte oprogramowanie (motywy i szablony); krok 3 — treść i szkielet strony — jest
 * w całości w tym katalogu i nie jest częścią otwartego kodu (patrz LICENSE.md obok).
 *
 * Każdy plik pages/*.html zaczyna się od komentarza z metadanymi w JSON:
 *   <!--meta
 *   { "title": "…", "description": "…", "ogTitle": "…", "ogDescription": "…", "jsonLd": { … } }
 *   -->
 * a dalej zawiera wszystko, co ma się znaleźć między nagłówkiem a stopką.
 *
 * W treści (i w metadanych) działają znaczniki {{NAZWA}} — patrz tokens() niżej. Nieznany znacznik
 * przerywa budowanie, więc literówka nie trafi na stronę.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as buildThemes } from '../limesurvey-themes/build.mjs';
import { build as buildTemplates } from '../survey-templates/build.mjs';
import {
  APP_STORE_URL, APP_URL, AUTHOR_URL, CONTACT_EMAIL, GITHUB_URL, LANGS, PLAY_STORE_URL, PLUGINS_URL, ROUTES, STACK_URL,
  STREFAANKIET_PRICING_URL, STREFAANKIET_URL, SUPPORT_URL,
  absolute, layout, outputPath,
} from './chrome.mjs';
import { renderPluginsPage } from './pages/plugins.mjs';
import { renderTemplatesPage } from './pages/templates.mjs';
import { renderPage as renderThemesPage } from './pages/themes.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, '..');
const SITE = join(REPO, 'site');

const readJson = (path) => JSON.parse(readFileSync(join(REPO, path), 'utf8'));

function write(path, html) {
  mkdirSync(dirname(join(SITE, path)), { recursive: true });
  writeFileSync(join(SITE, path), html);
  console.log(`✓ site/${path}`);
}

// ---------- 1–2: otwarte paczki do pobrania ----------
const themes = buildThemes();
const templates = buildTemplates();

/**
 * Zdanie o dostępności aplikacji mobilnej: linki do sklepów, gdy APP_STORE_URL / PLAY_STORE_URL
 * są ustawione w chrome.mjs, a do tego czasu — informacja o publikacji i budowaniu ze źródeł.
 */
function mobileAvailability(lang) {
  const stores = [['App Store', APP_STORE_URL], ['Google Play', PLAY_STORE_URL]].filter(([, url]) => url);
  if (stores.length) {
    const links = stores.map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`).join(lang === 'pl' ? ' i ' : ' and ');
    return lang === 'pl' ? `Pobierz ją bezpłatnie: ${links}.` : `Get it for free: ${links}.`;
  }
  const readme = `${GITHUB_URL}/blob/main/mobile/${lang === 'pl' ? 'README.md' : 'README.en.md'}`;
  return lang === 'pl'
    ? `Aplikacja czeka na publikację w App Store i Google Play. Do tego czasu możesz zbudować ją ze źródeł (<a href="${readme}" target="_blank" rel="noopener">instrukcja</a>) albo korzystać z wersji PWA.`
    : `The app is waiting to be published on the App Store and Google Play. Until then you can build it from source (<a href="${readme}" target="_blank" rel="noopener">instructions</a>) or use the PWA.`;
}

/** Wartości znaczników {{…}} dostępnych w pages/*.html. */
function tokens(lang) {
  return {
    MOBILE_AVAILABILITY: mobileAvailability(lang),
    APP_URL,
    GITHUB_URL,
    STACK_URL,
    PLUGINS_URL,
    AUTHOR_URL,
    STREFAANKIET_URL,
    STREFAANKIET_PRICING_URL,
    CONTACT_EMAIL,
    SUPPORT_URL,
    // adresy podstron w bieżącym języku: {{home}}, {{themes}}, {{templates}}, {{plugins}}, {{docs}}, {{privacy}}
    ...Object.fromEntries(Object.keys(ROUTES).map((page) => [page, ROUTES[page][lang]])),
    VERSION: readJson('package.json').version,
    THEMES_VERSION: themes.cfg.version,
    THEME_COUNT: String(themes.cfg.themes.length),
    TEMPLATE_COUNT: String(templates.catalog.templates.length),
  };
}

function applyTokens(text, lang, file) {
  const values = tokens(lang);
  return text.replace(/\{\{([A-Za-z_]+)\}\}/g, (_m, key) => {
    if (!(key in values)) throw new Error(`${file}: nieznany znacznik {{${key}}}`);
    return values[key];
  });
}

function renderFragment(page, lang) {
  const file = join(ROOT, 'pages', `${page}.${lang}.html`);
  const raw = applyTokens(readFileSync(file, 'utf8'), lang, file);
  const match = raw.match(/^<!--meta\s*([\s\S]*?)\s*-->\s*/);
  if (!match) throw new Error(`${file}: brak bloku <!--meta … --> na początku pliku`);
  let meta;
  try {
    meta = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(`${file}: nieprawidłowy JSON w bloku meta — ${err.message}`);
  }
  for (const key of ['title', 'description']) if (!meta[key]) throw new Error(`${file}: brak pola „${key}” w bloku meta`);
  return layout({ lang, page, ...meta, body: raw.slice(match[0].length) });
}

// ---------- 3: podstrony ----------
for (const lang of LANGS) {
  for (const page of ['home', 'docs', 'privacy']) write(outputPath(page, lang), renderFragment(page, lang));
  for (const rendered of [
    renderPluginsPage(lang),
    renderThemesPage({ ...themes, lang }),
    renderTemplatesPage({ ...templates, lang }),
  ]) write(rendered.path, rendered.html);
}

// ---------- 4: sitemap.xml — każda podstrona w obu językach, z alternatywami hreflang ----------
const PRIORITY = { home: '1.0', themes: '0.9', templates: '0.9', plugins: '0.8', docs: '0.8', privacy: '0.3' };
const urls = Object.keys(ROUTES).flatMap((page) =>
  LANGS.map((lang) => `  <url>
    <loc>${absolute(ROUTES[page][lang])}</loc>
${LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(ROUTES[page][l])}" />`).join('\n')}
    <changefreq>monthly</changefreq>
    <priority>${lang === 'pl' ? PRIORITY[page] : (Number(PRIORITY[page]) - 0.1).toFixed(1)}</priority>
  </url>`));
writeFileSync(join(SITE, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`);
console.log('✓ site/sitemap.xml');
