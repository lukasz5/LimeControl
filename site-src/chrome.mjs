// Wspólny szkielet strony limecontrol.eu: <head>, nawigacja, stopka, trasy i tłumaczenia.
// Używają go wszystkie generatory stron (site-src/build.mjs, limesurvey-themes/page.mjs,
// survey-templates/page.mjs), dzięki czemu menu i stopka są identyczne na każdej podstronie
// w obu językach.

export const SITE_URL = 'https://limecontrol.eu';
export const APP_URL = 'https://app.limecontrol.eu';
export const GITHUB_URL = 'https://github.com/lukasz5/LimeControl';
export const STACK_URL = 'https://github.com/lukasz5/limesurvey-stack';
/**
 * Publiczne wydanie wtyczek StrefaAnkiet dla LimeSurvey (repozytorium lub strona wydań).
 * Puste = wydanie w przygotowaniu: strona wtyczek pokazuje wtedy kontakt zamiast przycisku pobierania.
 */
export const PLUGINS_URL = '';
export const AUTHOR_URL = 'https://strefabadan.pl';
export const STREFAANKIET_URL = 'https://strefaankiet.pl';
export const CONTACT_EMAIL = 'info@strefabadan.pl';
export const SUPPORT_URL = 'https://www.paypal.com/biz/profile/strefabadan';
/** Cennik platformy StrefaAnkiet (abonament i usługi dodatkowe). */
export const STREFAANKIET_PRICING_URL = 'https://strefaankiet.pl/#cena';
/** Linki do sklepów z aplikacją mobilną; puste = „wkrótce”. */
export const APP_STORE_URL = '';
export const PLAY_STORE_URL = '';
/** Podbij po zmianie site/assets/style.css lub site.js (nagłówki cache: 7 dni). */
export const ASSET_VERSION = '3';

export const LANGS = ['pl', 'en'];

/** Adres każdej podstrony w obu językach. */
export const ROUTES = {
  home: { pl: '/', en: '/en/' },
  themes: { pl: '/szablony.html', en: '/en/themes.html' },
  templates: { pl: '/ankiety.html', en: '/en/templates.html' },
  plugins: { pl: '/wtyczki.html', en: '/en/plugins.html' },
  docs: { pl: '/docs.html', en: '/en/docs.html' },
  privacy: { pl: '/prywatnosc.html', en: '/en/privacy.html' },
};

/** Ścieżka pliku wyjściowego względem katalogu site/. */
export const outputPath = (page, lang) => {
  const route = ROUTES[page][lang];
  return route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
};

/** Kotwice sekcji strony głównej (różne w PL i EN). */
export const HOME_ANCHORS = {
  features: { pl: 'funkcje', en: 'features' },
  ecosystem: { pl: 'ekosystem', en: 'ecosystem' },
  how: { pl: 'jak-to-dziala', en: 'how-it-works' },
  pricing: { pl: 'darmowe-i-platne', en: 'free-and-paid' },
  fieldwork: { pl: 'cati-capi', en: 'cati-capi' },
  security: { pl: 'bezpieczenstwo', en: 'security' },
  hosting: { pl: 'hosting', en: 'hosting' },
  faq: { pl: 'faq', en: 'faq' },
};

export const url = (page, lang, anchor) => `${ROUTES[page][lang]}${anchor ? `#${anchor}` : ''}`;
export const homeUrl = (lang, anchor) => url('home', lang, HOME_ANCHORS[anchor]?.[lang] ?? anchor);
export const absolute = (path) => `${SITE_URL}${path}`;

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  pl: {
    skip: 'Przejdź do treści',
    homeLabel: 'LimeControl — strona główna',
    menu: 'Menu',
    nav: { features: 'Funkcje', themes: 'Motywy', templates: 'Szablony', plugins: 'Wtyczki', hosting: 'Hosting i wdrożenia', docs: 'Dokumentacja' },
    github: 'Kod źródłowy LimeControl na GitHubie',
    openApp: 'Otwórz aplikację',
    switchTo: 'English',
    switchLabel: 'Switch to English',
    footer: { themes: 'Motywy ankiet', templates: 'Szablony ankiet', plugins: 'Wtyczki StrefaAnkiet', docs: 'Dokumentacja', hosting: 'Hosting i wdrożenia', app: 'Aplikacja', privacy: 'Prywatność' },
    coffee: 'Postaw mi kawę',
    madeBy: 'Made with ♥ by',
    rights: 'Aplikacja, motywy, wtyczki i wdrożenia są otwartym oprogramowaniem; treść i wygląd tej strony — wszelkie prawa zastrzeżone.',
    trademark: 'LimeSurvey jest zastrzeżonym znakiem towarowym LimeSurvey GmbH. LimeControl oraz usługi strefabadan.pl są niezależnymi projektami i nie są powiązane z LimeSurvey GmbH.',
    locale: 'pl_PL',
  },
  en: {
    skip: 'Skip to content',
    homeLabel: 'LimeControl — home page',
    menu: 'Menu',
    nav: { features: 'Features', themes: 'Themes', templates: 'Templates', plugins: 'Plugins', hosting: 'Hosting & deployment', docs: 'Docs' },
    github: 'LimeControl source code on GitHub',
    openApp: 'Open the app',
    switchTo: 'Polski',
    switchLabel: 'Przełącz na polski',
    footer: { themes: 'Survey themes', templates: 'Survey templates', plugins: 'StrefaAnkiet plugins', docs: 'Documentation', hosting: 'Hosting & deployment', app: 'App', privacy: 'Privacy' },
    coffee: 'Buy me a coffee',
    madeBy: 'Made with ♥ by',
    rights: 'The app, themes, plugins and deployment kits are open-source software; the content and design of this website — all rights reserved.',
    trademark: 'LimeSurvey is a registered trademark of LimeSurvey GmbH. LimeControl and the strefabadan.pl services are independent projects and are not affiliated with LimeSurvey GmbH.',
    locale: 'en_GB',
  },
};

const GITHUB_ICON =
  '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

/**
 * <head> dokumentu.
 * @param {{ lang: 'pl'|'en', page: keyof typeof ROUTES, title: string, description: string,
 *           ogTitle?: string, ogDescription?: string, ogImage?: string, jsonLd?: object, extraHead?: string }} o
 */
export function head({ lang, page, title, description, ogTitle, ogDescription, ogImage, jsonLd, extraHead = '' }) {
  const t = T[lang];
  const canonical = absolute(ROUTES[page][lang]);
  const alternates = LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="${absolute(ROUTES[page][l])}" />`).join('\n');
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
${alternates}
  <link rel="alternate" hreflang="x-default" href="${absolute(ROUTES[page].en)}" />
  <meta name="theme-color" content="#1b5e36" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="LimeControl" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${esc(ogTitle || title)}" />
  <meta property="og:description" content="${esc(ogDescription || description)}" />${ogImage ? `\n  <meta property="og:image" content="${absolute(ogImage)}" />` : ''}
  <meta property="og:locale" content="${t.locale}" />
  <meta property="og:locale:alternate" content="${T[lang === 'pl' ? 'en' : 'pl'].locale}" />
  <meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/style.css?v=${ASSET_VERSION}" />
${jsonLd ? `\n  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2).replace(/^/gm, '  ')}\n  </script>` : ''}${extraHead}
</head>`;
}

/** Nagłówek z nawigacją. `page` wyróżnia bieżącą podstronę. */
export function nav({ lang, page }) {
  const t = T[lang];
  const other = lang === 'pl' ? 'en' : 'pl';
  const item = (href, label, current) => `        <li><a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  const onHome = page === 'home';
  const featuresHref = onHome ? `#${HOME_ANCHORS.features[lang]}` : homeUrl(lang, 'features');
  const hostingHref = onHome ? `#${HOME_ANCHORS.hosting[lang]}` : homeUrl(lang, 'hosting');
  return `<body>
  <a class="skip" href="#main">${t.skip}</a>

  <header class="nav">
    <div class="container">
      <a class="nav-logo" href="${ROUTES.home[lang]}" aria-label="${t.homeLabel}">
        <img class="logo-light" src="/assets/logo.svg?v=${ASSET_VERSION}" alt="LimeControl" width="104" height="34" />
        <img class="logo-dark" src="/assets/logo-dark.svg?v=${ASSET_VERSION}" alt="LimeControl" width="104" height="34" />
      </a>
      <button class="nav-toggle" aria-label="${t.menu}" aria-expanded="false" aria-controls="nav-links">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <ul class="nav-links" id="nav-links">
${[
    item(featuresHref, t.nav.features, false),
    item(ROUTES.themes[lang], t.nav.themes, page === 'themes'),
    item(ROUTES.templates[lang], t.nav.templates, page === 'templates'),
    item(ROUTES.plugins[lang], t.nav.plugins, page === 'plugins'),
    item(hostingHref, t.nav.hosting, false),
    item(ROUTES.docs[lang], t.nav.docs, page === 'docs'),
  ].join('\n')}
        <li><a class="nav-gh" href="${GITHUB_URL}" target="_blank" rel="noopener" aria-label="${t.github}">${GITHUB_ICON}<span>GitHub</span></a></li>
        <li><a class="nav-lang" href="${ROUTES[page][other]}" hreflang="${other}" lang="${other}" aria-label="${t.switchLabel}">${other.toUpperCase()}<span> — ${t.switchTo}</span></a></li>
        <li><a class="btn btn-primary btn-sm" href="${APP_URL}">${t.openApp}</a></li>
      </ul>
    </div>
  </header>
`;
}

/** Stopka + skrypt strony. `note` zastępuje domyślny dopisek o autorze (np. informacją o licencji motywów). */
export function footer({ lang, page, note, scripts = '' }) {
  const t = T[lang];
  const other = lang === 'pl' ? 'en' : 'pl';
  const line = note || `${t.madeBy} <a href="${AUTHOR_URL}" rel="noopener">strefabadan.pl</a>.`;
  return `
  <footer class="footer">
    <div class="container">
      <a href="${ROUTES.home[lang]}" aria-label="LimeControl">
        <img class="logo-light" src="/assets/logo.svg?v=${ASSET_VERSION}" alt="LimeControl" width="86" height="28" />
        <img class="logo-dark" src="/assets/logo-dark.svg?v=${ASSET_VERSION}" alt="LimeControl" width="86" height="28" />
      </a>
      <ul class="footer-links">
        <li><a href="${ROUTES.themes[lang]}">${t.footer.themes}</a></li>
        <li><a href="${ROUTES.templates[lang]}">${t.footer.templates}</a></li>
        <li><a href="${ROUTES.plugins[lang]}">${t.footer.plugins}</a></li>
        <li><a href="${homeUrl(lang, 'hosting')}">${t.footer.hosting}</a></li>
        <li><a href="${ROUTES.docs[lang]}">${t.footer.docs}</a></li>
        <li><a href="${ROUTES.privacy[lang]}">${t.footer.privacy}</a></li>
        <li><a href="${APP_URL}">${t.footer.app}</a></li>
        <li><a href="${GITHUB_URL}" rel="noopener">GitHub</a></li>
        <li><a href="${AUTHOR_URL}" rel="noopener">strefabadan.pl</a></li>
        <li><a href="${ROUTES[page][other]}" hreflang="${other}" lang="${other}">${t.switchTo}</a></li>
      </ul>
      <a class="coffee" href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer">${t.coffee}</a>
    </div>
    <div class="container" style="margin-top:20px">
      <p style="margin:0">© <span id="year">2026</span> LimeControl · ${line} ${t.rights} ${t.trademark}</p>
    </div>
  </footer>

  <script src="/assets/site.js?v=${ASSET_VERSION}" defer></script>${scripts}
</body>
</html>
`;
}

/** Cała strona: head + nawigacja + treść + stopka. */
export function layout({ body, footerNote, scripts, ...meta }) {
  return `${head(meta)}\n${nav(meta)}\n${body.trim()}\n${footer({ ...meta, note: footerNote, scripts })}`;
}
