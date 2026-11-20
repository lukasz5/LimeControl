// Wspólny szkielet strony limecontrol.eu: <head>, nawigacja, stopka, trasy i tłumaczenia.
// Używają go wszystkie generatory stron (site-src/build.mjs, limesurvey-themes/page.mjs,
// survey-templates/page.mjs), dzięki czemu menu i stopka są identyczne na każdej podstronie
// we wszystkich językach (PL, EN, DE).

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
/** Strony aplikacji mobilnej w sklepach (App Store: „LimeControl – Surveys”, Google Play: „LimeControl”). */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6836539897';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=eu.limecontrol.app';
/**
 * Czy aplikacja jest już opublikowana w danym sklepie. Do tego czasu jego przycisk pokazuje
 * „wkrótce” i nie prowadzi pod adres, który jeszcze nie działa.
 */
export const STORES_LIVE = { appStore: false, googlePlay: true };
/**
 * Google Analytics 4 (identyfikator strumienia danych, np. 'G-ABC123XYZ'). Puste = brak statystyk i brak
 * baneru cookie. GA ładuje się dopiero po zgodzie odwiedzającego (baner w stopce, obsługa w assets/site.js).
 */
export const GA_MEASUREMENT_ID = 'G-C03RCY4KMD';
/**
 * Google Search Console — wartość `content` z metatagu weryfikacyjnego (metoda „Tag HTML”). Puste = brak tagu
 * (np. gdy domena jest zweryfikowana rekordem DNS TXT, co jest zalecane dla usługi typu „Domena”).
 */
export const GSC_VERIFICATION = 'CSUXq2Z5en7Ay8OPV1Wwf4nERbD940QN_3dqoaUd2U0';
/** Domyślny obrazek podglądu linku (1200×630) dla podstron bez własnego (generuje site-src/og-image.mjs). */
export const defaultOgImage = (lang) => `/assets/og/${lang}.png?v=${ASSET_VERSION}`;
/** Podbij po zmianie site/assets/style.css lub site.js (nagłówki cache: 7 dni). */
export const ASSET_VERSION = '7';

export const LANGS = ['pl', 'en', 'de'];
/** Nazwy języków w przełączniku (każdy we własnym języku). */
export const LANG_NAMES = { pl: 'Polski', en: 'English', de: 'Deutsch' };

/** Adres każdej podstrony w każdym języku. */
export const ROUTES = {
  home: { pl: '/', en: '/en/', de: '/de/' },
  themes: { pl: '/szablony.html', en: '/en/themes.html', de: '/de/designs.html' },
  templates: { pl: '/ankiety.html', en: '/en/templates.html', de: '/de/vorlagen.html' },
  plugins: { pl: '/wtyczki.html', en: '/en/plugins.html', de: '/de/plugins.html' },
  docs: { pl: '/docs.html', en: '/en/docs.html', de: '/de/docs.html' },
  privacy: { pl: '/prywatnosc.html', en: '/en/privacy.html', de: '/de/datenschutz.html' },
};

/** Ścieżka pliku wyjściowego względem katalogu site/. */
export const outputPath = (page, lang) => {
  const route = ROUTES[page][lang];
  return route.endsWith('/') ? `${route.slice(1)}index.html` : route.slice(1);
};

/** Kotwice sekcji strony głównej (różne w każdym języku). */
export const HOME_ANCHORS = {
  features: { pl: 'funkcje', en: 'features', de: 'funktionen' },
  ecosystem: { pl: 'ekosystem', en: 'ecosystem', de: 'oekosystem' },
  how: { pl: 'jak-to-dziala', en: 'how-it-works', de: 'so-funktionierts' },
  pricing: { pl: 'darmowe-i-platne', en: 'free-and-paid', de: 'kostenlos-und-kostenpflichtig' },
  fieldwork: { pl: 'cati-capi', en: 'cati-capi', de: 'cati-capi' },
  security: { pl: 'bezpieczenstwo', en: 'security', de: 'sicherheit' },
  hosting: { pl: 'hosting', en: 'hosting', de: 'hosting' },
  faq: { pl: 'faq', en: 'faq', de: 'faq' },
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
    menuClose: 'Zamknij menu',
    language: 'Język',
    toTop: 'Wróć na górę strony',
    tagline: 'Otwarta aplikacja do zarządzania ankietami LimeSurvey — w przeglądarce i na urządzeniach mobilnych.',
    cols: { product: 'Produkt', resources: 'Zasoby', project: 'Projekt' },
    nav: { features: 'Funkcje', themes: 'Motywy', templates: 'Szablony', plugins: 'Wtyczki', hosting: 'Hosting i wdrożenia', docs: 'Dokumentacja' },
    github: 'Kod źródłowy LimeControl na GitHubie',
    openApp: 'Otwórz aplikację',
    switchLabel: 'Wersja polska',
    footer: { features: 'Funkcje', themes: 'Motywy ankiet', templates: 'Szablony ankiet', plugins: 'Wtyczki StrefaAnkiet', docs: 'Dokumentacja', hosting: 'Hosting i wdrożenia', app: 'Aplikacja', privacy: 'Prywatność' },
    coffee: 'Postaw mi kawę',
    madeBy: 'Made with ♥ by',
    rights: 'Aplikacja, motywy, wtyczki i wdrożenia są otwartym oprogramowaniem; treść i wygląd tej strony — wszelkie prawa zastrzeżone.',
    trademark: 'LimeSurvey jest zastrzeżonym znakiem towarowym LimeSurvey GmbH. LimeControl oraz usługi strefabadan.pl są niezależnymi projektami i nie są powiązane z LimeSurvey GmbH.',
    locale: 'pl_PL',
    ogAlt: 'LimeControl — aplikacja do zarządzania ankietami LimeSurvey',
    cookies: {
      label: 'Zgoda na pliki cookie',
      text: 'Chcemy używać plików cookie Google Analytics, żeby wiedzieć, które treści są przydatne. Ustawimy je tylko za Twoją zgodą — możesz ją w każdej chwili wycofać w stopce strony.',
      more: 'Polityka prywatności',
      accept: 'Akceptuję',
      reject: 'Odrzucam',
      settings: 'Ustawienia cookie',
    },
  },
  en: {
    skip: 'Skip to content',
    homeLabel: 'LimeControl — home page',
    menu: 'Menu',
    menuClose: 'Close menu',
    language: 'Language',
    toTop: 'Back to top',
    tagline: 'Open-source app for managing LimeSurvey surveys — in the browser and on mobile devices.',
    cols: { product: 'Product', resources: 'Resources', project: 'Project' },
    nav: { features: 'Features', themes: 'Themes', templates: 'Templates', plugins: 'Plugins', hosting: 'Hosting & deployment', docs: 'Docs' },
    github: 'LimeControl source code on GitHub',
    openApp: 'Open the app',
    switchLabel: 'English version',
    footer: { features: 'Features', themes: 'Survey themes', templates: 'Survey templates', plugins: 'StrefaAnkiet plugins', docs: 'Documentation', hosting: 'Hosting & deployment', app: 'App', privacy: 'Privacy' },
    coffee: 'Buy me a coffee',
    madeBy: 'Made with ♥ by',
    rights: 'The app, themes, plugins and deployment kits are open-source software; the content and design of this website — all rights reserved.',
    trademark: 'LimeSurvey is a registered trademark of LimeSurvey GmbH. LimeControl and the strefabadan.pl services are independent projects and are not affiliated with LimeSurvey GmbH.',
    locale: 'en_GB',
    ogAlt: 'LimeControl — an app for managing LimeSurvey surveys',
    cookies: {
      label: 'Cookie consent',
      text: 'We’d like to use Google Analytics cookies to learn which content is useful. They are set only if you agree — you can withdraw consent at any time in the page footer.',
      more: 'Privacy policy',
      accept: 'Accept',
      reject: 'Reject',
      settings: 'Cookie settings',
    },
  },
  de: {
    skip: 'Zum Inhalt springen',
    homeLabel: 'LimeControl — Startseite',
    menu: 'Menü',
    menuClose: 'Menü schließen',
    language: 'Sprache',
    toTop: 'Nach oben',
    tagline: 'Open-Source-App zur Verwaltung von LimeSurvey-Umfragen — im Browser und auf Mobilgeräten.',
    cols: { product: 'Produkt', resources: 'Ressourcen', project: 'Projekt' },
    nav: { features: 'Funktionen', themes: 'Designs', templates: 'Vorlagen', plugins: 'Plugins', hosting: 'Hosting & Betrieb', docs: 'Doku' },
    github: 'Quellcode von LimeControl auf GitHub',
    openApp: 'App öffnen',
    switchLabel: 'Deutsche Version',
    footer: { features: 'Funktionen', themes: 'Umfrage-Designs', templates: 'Umfragevorlagen', plugins: 'StrefaAnkiet-Plugins', docs: 'Dokumentation', hosting: 'Hosting & Betrieb', app: 'App', privacy: 'Datenschutz' },
    coffee: 'Spendier mir einen Kaffee',
    madeBy: 'Made with ♥ by',
    rights: 'App, Designs, Plugins und Deployment-Kits sind Open-Source-Software; Inhalt und Gestaltung dieser Website — alle Rechte vorbehalten.',
    trademark: 'LimeSurvey ist eine eingetragene Marke der LimeSurvey GmbH. LimeControl und die Dienste von strefabadan.pl sind unabhängige Projekte und stehen in keiner Verbindung zur LimeSurvey GmbH.',
    locale: 'de_DE',
    ogAlt: 'LimeControl — eine App zur Verwaltung von LimeSurvey-Umfragen',
    cookies: {
      label: 'Cookie-Einwilligung',
      text: 'Wir möchten Cookies von Google Analytics verwenden, um zu erfahren, welche Inhalte nützlich sind. Sie werden nur mit Ihrer Einwilligung gesetzt — widerrufen können Sie sie jederzeit in der Fußzeile.',
      more: 'Datenschutzerklärung',
      accept: 'Akzeptieren',
      reject: 'Ablehnen',
      settings: 'Cookie-Einstellungen',
    },
  },
};

const GITHUB_ICON =
  '<svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';

/**
 * <head> dokumentu.
 * @param {{ lang: 'pl'|'en'|'de', page: keyof typeof ROUTES, title: string, description: string,
 *           ogTitle?: string, ogDescription?: string, ogImage?: string, jsonLd?: object, extraHead?: string }} o
 */
export function head({ lang, page, title, description, ogTitle, ogDescription, ogImage, jsonLd, extraHead = '' }) {
  const t = T[lang];
  const canonical = absolute(ROUTES[page][lang]);
  const image = ogImage || defaultOgImage(lang);
  const imageMeta = ogImage
    ? ''
    : `\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />\n  <meta property="og:image:alt" content="${esc(t.ogAlt)}" />`;
  const alternates = LANGS.map((l) => `  <link rel="alternate" hreflang="${l}" href="${absolute(ROUTES[page][l])}" />`).join('\n');
  return `<!doctype html>
<html lang="${lang}"${GA_MEASUREMENT_ID ? ` data-ga="${esc(GA_MEASUREMENT_ID)}"` : ''}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />${GSC_VERIFICATION ? `\n  <meta name="google-site-verification" content="${esc(GSC_VERIFICATION)}" />` : ''}
  <link rel="canonical" href="${canonical}" />
${alternates}
  <link rel="alternate" hreflang="x-default" href="${absolute(ROUTES[page].en)}" />
  <meta name="theme-color" content="#1b5e36" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="LimeControl" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${esc(ogTitle || title)}" />
  <meta property="og:description" content="${esc(ogDescription || description)}" />
  <meta property="og:image" content="${absolute(image)}" />${imageMeta}
  <meta property="og:locale" content="${t.locale}" />
${LANGS.filter((l) => l !== lang).map((l) => `  <meta property="og:locale:alternate" content="${T[l].locale}" />`).join('\n')}
  <meta name="twitter:card" content="summary_large_image" />

  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/style.css?v=${ASSET_VERSION}" />
  <script>document.documentElement.classList.add('js')</script>
${[jsonLd, breadcrumbs(lang, page)].filter(Boolean).map((data) => `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/^/gm, '  ')}\n  </script>`).join('')}${extraHead}
</head>`;
}

/** Okruszki (schema.org BreadcrumbList) dla podstron: Strona główna › podstrona. */
function breadcrumbs(lang, page) {
  if (page === 'home') return null;
  const names = { ...T[lang].footer, home: 'LimeControl' };
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: ['home', page].map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: names[p],
      item: absolute(ROUTES[p][lang]),
    })),
  };
}

/** Nagłówek z nawigacją. `page` wyróżnia bieżącą podstronę. */
export function nav({ lang, page }) {
  const t = T[lang];
  const item = (href, label, current) => `        <li><a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a></li>`;
  const onHome = page === 'home';
  const featuresHref = onHome ? `#${HOME_ANCHORS.features[lang]}` : homeUrl(lang, 'features');
  const hostingHref = onHome ? `#${HOME_ANCHORS.hosting[lang]}` : homeUrl(lang, 'hosting');
  return `<body>
  <a class="skip" href="#main">${t.skip}</a>

  <header class="nav">
    <div class="container">
      <a class="nav-logo" href="${ROUTES.home[lang]}" aria-label="${t.homeLabel}">
        <img class="logo-light" src="/assets/logo.svg?v=${ASSET_VERSION}" alt="LimeControl" width="106" height="34" />
        <img class="logo-dark" src="/assets/logo-dark.svg?v=${ASSET_VERSION}" alt="LimeControl" width="106" height="34" />
      </a>
      <button class="nav-toggle" type="button" aria-label="${t.menu}" aria-expanded="false" aria-controls="nav-links" data-label-open="${t.menu}" data-label-close="${t.menuClose}">
        <span class="burger" aria-hidden="true"><span></span><span></span><span></span></span>
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
${langMenu(lang, page)}
        <li><a class="btn btn-primary btn-sm" href="${APP_URL}">${t.openApp}</a></li>
      </ul>
    </div>
    <div class="nav-progress" aria-hidden="true"></div>
  </header>
`;
}

const GLOBE_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>';
const CHEVRON_ICON =
  '<svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

/**
 * Przełącznik języka: na komputerze rozwijana lista pod przyciskiem z globusem, w menu mobilnym
 * (i bez JS) — rząd trzech przycisków. Bieżący język jest zaznaczony, a nie ukryty.
 */
function langMenu(lang, page) {
  const t = T[lang];
  const options = LANGS.map((l) => {
    const current = l === lang;
    return `            <li><a href="${ROUTES[page][l]}" hreflang="${l}" lang="${l}"${current ? ' aria-current="true"' : ` aria-label="${T[l].switchLabel}"`}><b>${l.toUpperCase()}</b><span>${LANG_NAMES[l]}</span></a></li>`;
  }).join('\n');
  return `        <li class="lang-menu">
          <button type="button" class="lang-btn" aria-expanded="false" aria-controls="lang-list" aria-label="${t.language}: ${LANG_NAMES[lang]}">${GLOBE_ICON}<span>${lang.toUpperCase()}</span>${CHEVRON_ICON}</button>
          <ul class="lang-list" id="lang-list" aria-label="${t.language}">
${options}
          </ul>
        </li>`;
}

/** Stopka + skrypt strony. `note` zastępuje domyślny dopisek o autorze (np. informacją o licencji motywów). */
export function footer({ lang, page, note, scripts = '' }) {
  const t = T[lang];
  const line = note || `${t.madeBy} <a href="${AUTHOR_URL}" rel="noopener">strefabadan.pl</a>.`;
  const link = (href, label, extra = '') => `            <li><a href="${href}"${extra}>${label}</a></li>`;
  const col = (title, items) => `        <nav class="footer-col" aria-label="${title}">
          <h2>${title}</h2>
          <ul>
${items.filter(Boolean).join('\n')}
          </ul>
        </nav>`;
  return `
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <a class="footer-logo" href="${ROUTES.home[lang]}" aria-label="${t.homeLabel}">
          <img class="logo-light" src="/assets/logo.svg?v=${ASSET_VERSION}" alt="LimeControl" width="88" height="28" loading="lazy" />
          <img class="logo-dark" src="/assets/logo-dark.svg?v=${ASSET_VERSION}" alt="LimeControl" width="88" height="28" loading="lazy" />
        </a>
        <p>${t.tagline}</p>
        <div class="footer-actions">
          <a class="btn btn-primary btn-sm" href="${APP_URL}">${t.openApp}</a>
          <a class="footer-icon" href="${GITHUB_URL}" target="_blank" rel="noopener" aria-label="${t.github}">${GITHUB_ICON}</a>
        </div>
      </div>
${col(t.cols.product, [
    link(homeUrl(lang, 'features'), t.footer.features),
    link(APP_URL, t.footer.app),
    link(homeUrl(lang, 'hosting'), t.footer.hosting),
    link(ROUTES.docs[lang], t.footer.docs),
  ])}
${col(t.cols.resources, [
    link(ROUTES.themes[lang], t.footer.themes),
    link(ROUTES.templates[lang], t.footer.templates),
    link(ROUTES.plugins[lang], t.footer.plugins),
  ])}
${col(t.cols.project, [
    link(GITHUB_URL, 'GitHub', ' rel="noopener"'),
    link(AUTHOR_URL, 'strefabadan.pl', ' rel="noopener"'),
    link(SUPPORT_URL, t.coffee, ' target="_blank" rel="noopener noreferrer"'),
    link(ROUTES.privacy[lang], t.footer.privacy),
    GA_MEASUREMENT_ID ? `            <li><button type="button" class="link-btn" data-cookie-settings>${t.cookies.settings}</button></li>` : '',
  ])}
    </div>
    <div class="container footer-bottom">
      <p>© <span id="year">2026</span> LimeControl · ${line}</p>
      <ul class="footer-langs" aria-label="${t.language}">
${LANGS.map((l) => `        <li><a href="${ROUTES[page][l]}" hreflang="${l}" lang="${l}"${l === lang ? ' aria-current="true"' : ''}>${LANG_NAMES[l]}</a></li>`).join('\n')}
      </ul>
    </div>
    <div class="container footer-legal">
      <p>${t.rights} ${t.trademark}</p>
    </div>
  </footer>

${GA_MEASUREMENT_ID ? cookieBanner(lang) : ''}
  <a class="to-top" href="#main" aria-label="${t.toTop}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></a>
  <script src="/assets/site.js?v=${ASSET_VERSION}" defer></script>${scripts}
</body>
</html>
`;
}

/** Baner zgody na cookie Google Analytics (ukryty, pokazuje go assets/site.js, gdy brak decyzji). */
function cookieBanner(lang) {
  const c = T[lang].cookies;
  return `
  <div class="cookie-banner" id="cookie-banner" role="region" aria-label="${c.label}" hidden>
    <p>${c.text} <a href="${ROUTES.privacy[lang]}#cookies">${c.more}</a></p>
    <div class="cookie-actions">
      <button type="button" class="btn btn-ghost btn-sm" data-consent="denied">${c.reject}</button>
      <button type="button" class="btn btn-primary btn-sm" data-consent="granted">${c.accept}</button>
    </div>
  </div>
`;
}

/** Cała strona: head + nawigacja + treść + stopka. */
export function layout({ body, footerNote, scripts, ...meta }) {
  return `${head(meta)}\n${nav(meta)}\n${body.trim()}\n${footer({ ...meta, note: footerNote, scripts })}`;
}
