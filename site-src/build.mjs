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
  APP_STORE_URL, APP_URL, ASSET_VERSION, AUTHOR_URL, CONTACT_EMAIL, GITHUB_URL, LANGS, PLAY_STORE_URL, PLUGINS_URL, ROUTES, STACK_URL,
  STORES_LIVE, STREFAANKIET_PRICING_URL, STREFAANKIET_URL, SUPPORT_URL,
  absolute, esc, layout, outputPath,
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
 * Zdanie o dostępności aplikacji mobilnej: linki do sklepów, gdy STORES_LIVE w chrome.mjs jest
 * włączone, a do tego czasu — informacja o publikacji i budowaniu ze źródeł.
 */
function mobileAvailability(lang) {
  if (STORES_LIVE) {
    const links = [['App Store', APP_STORE_URL], ['Google Play', PLAY_STORE_URL]]
      .map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`).join(lang === 'pl' ? ' i ' : ' and ');
    return lang === 'pl' ? `Pobierz ją bezpłatnie: ${links}.` : `Get it for free: ${links}.`;
  }
  const readme = `${GITHUB_URL}/blob/main/mobile/${lang === 'pl' ? 'README.md' : 'README.en.md'}`;
  return lang === 'pl'
    ? `Aplikacja czeka na publikację w App Store i Google Play. Do tego czasu możesz zbudować ją ze źródeł (<a href="${readme}" target="_blank" rel="noopener">instrukcja</a>) albo korzystać z wersji PWA.`
    : `The app is waiting to be published on the App Store and Google Play. Until then you can build it from source (<a href="${readme}" target="_blank" rel="noopener">instructions</a>) or use the PWA.`;
}

const APPLE_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/></svg>';
const PLAY_LOGO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#00d7fe" d="M1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087z"/><path fill="#ffce00" d="M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594z"/><path fill="#00f076" d="M13.544 10.989l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179z"/><path fill="#ff3a44" d="M13.544 13.056l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54z"/></svg>';

/** Przyciski „Pobierz z App Store / Google Play” (przed publikacją: „wkrótce”, bez linku). */
function storeButtons(lang) {
  const t = lang === 'pl'
    ? { soon: 'Wkrótce w', badge: 'wkrótce', label: 'Aplikacja mobilna' }
    : { soon: 'Coming soon to', badge: 'soon', label: 'Mobile app' };
  const stores = [
    ['App Store', APP_STORE_URL, APPLE_LOGO, lang === 'pl' ? 'Pobierz z' : 'Download on the'],
    ['Google Play', PLAY_STORE_URL, PLAY_LOGO, lang === 'pl' ? 'Pobierz z' : 'Get it on'],
  ];
  const items = stores.map(([name, url, logo, get]) => STORES_LIVE
    ? `<a class="store-btn" href="${url}" target="_blank" rel="noopener">${logo}<span><small>${get}</small><b>${name}</b></span></a>`
    : `<span class="store-btn is-soon" aria-label="${esc(`${name} — ${t.badge}`)}">${logo}<span><small>${t.soon}</small><b>${name}</b></span><em>${t.badge}</em></span>`);
  return `<div class="store-buttons" role="group" aria-label="${t.label}">${items.join('')}</div>`;
}

/** Ekrany aplikacji (site/assets/screens/<lang>/ — generuje je site-src/screens.mjs). */
const SCREEN_CAPTIONS = {
  pl: {
    surveys: ['Ankiety i statystyki', 'Liczba odpowiedzi i stan uczestników wybranej ankiety na wykresach.'],
    summary: ['Szczegóły ankiety', 'Podsumowanie odpowiedzi, odsetek ukończonych i tokeny — na żywo z serwera.'],
    list: ['Lista ankiet', 'Wszystkie ankiety instancji z filtrem aktywnych i nieaktywnych.'],
    'link-qr': ['Link, QR i tryb CAPI', 'Udostępnij link, pokaż kod QR i uruchom pętlę wywiadów na tablecie.'],
    templates: ['Biblioteka szablonów', 'Gotowe kwestionariusze PL/EN importowane jednym dotknięciem.'],
    participants: ['Uczestnicy i tokeny', 'Dodawaj respondentów, wysyłaj zaproszenia i przypomnienia.'],
    instances: ['Wiele instancji', 'Profile serwerów LimeSurvey i dziennik wywołań RPC.'],
  },
  en: {
    surveys: ['Surveys and statistics', 'Response counts and participant status of the selected survey in charts.'],
    summary: ['Survey details', 'Response summary, completion rate and tokens — live from the server.'],
    list: ['Survey list', 'Every survey on the instance, filtered by active and inactive.'],
    'link-qr': ['Link, QR and CAPI mode', 'Share the link, show a QR code and run back-to-back interviews on a tablet.'],
    templates: ['Template library', 'Ready-made PL/EN questionnaires imported with one tap.'],
    participants: ['Participants and tokens', 'Add respondents and send invitations and reminders.'],
    instances: ['Many instances', 'LimeSurvey server profiles and the RPC call log.'],
  },
};
const screenSrc = (lang, name) => `/assets/screens/${lang}/${name}.webp?v=${ASSET_VERSION}`;

/** Telefon w hero: prawdziwe ekrany aplikacji przenikające się co kilka sekund. */
function heroDevice(lang) {
  const shots = ['surveys', 'list', 'templates'];
  const label = lang === 'pl' ? 'Aplikacja LimeControl na telefonie: ' : 'The LimeControl app on a phone: ';
  const imgs = shots.map((name, i) => `<img src="${screenSrc(lang, name)}" alt="${i ? '' : esc(label + SCREEN_CAPTIONS[lang][name][0])}" width="640" height="1391"${i ? ' loading="lazy" aria-hidden="true"' : ' fetchpriority="high"'} />`).join('\n              ');
  const chips = lang === 'pl'
    ? ['<b>+23</b> nowe odpowiedzi', '<span class="dot"></span> Ankieta aktywna']
    : ['<b>+23</b> new responses', '<span class="dot"></span> Survey active'];
  return `<div class="device-stage">
          <div class="device device-phone">
            <span class="device-island" aria-hidden="true"></span>
            <div class="device-screen device-slides">
              ${imgs}
            </div>
          </div>
          <div class="float-chip chip-a" aria-hidden="true">${chips[0]}</div>
          <div class="float-chip chip-b" aria-hidden="true">${chips[1]}</div>
        </div>`;
}

/** Galeria „Zobacz aplikację”: przewijany rząd telefonów z podpisami. */
function screenGallery(lang) {
  return Object.entries(SCREEN_CAPTIONS[lang]).map(([name, [title, text]]) => `<figure class="shot">
            <div class="device device-phone device-sm">
              <span class="device-island" aria-hidden="true"></span>
              <div class="device-screen"><img src="${screenSrc(lang, name)}" alt="${esc(title)}" width="640" height="1391" loading="lazy" decoding="async" /></div>
            </div>
            <figcaption><strong>${title}</strong>${text}</figcaption>
          </figure>`).join('\n          ');
}

/** Wartości znaczników {{…}} dostępnych w pages/*.html. */
function tokens(lang) {
  return {
    MOBILE_AVAILABILITY: mobileAvailability(lang),
    STORE_BUTTONS: storeButtons(lang),
    HERO_DEVICE: heroDevice(lang),
    SCREEN_GALLERY: screenGallery(lang),
    IPAD_SCREEN: screenSrc(lang, 'ipad-surveys'),
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
