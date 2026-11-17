// Generator strony site/szablony.html (wywoływany z build.mjs).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const kb = (n) => `${Math.max(1, Math.round(n / 1024))} kB`;
const ratio = (r) => `${r.toFixed(1).replace('.', ',')}:1`;

const swatch = (hex, label) =>
  `<li><span class="sw" style="background:${hex}" aria-hidden="true"></span><span>${esc(label)}<code>${hex}</code></span></li>`;

function themeCard(t, rep, variants) {
  const k = t.tokens;
  const views = [
    ['desktop', 'Komputer', `Motyw ${t.label} na komputerze: pytanie jednokrotnego wyboru z zaznaczoną odpowiedzią`],
    ['mobile', 'Telefon', `Motyw ${t.label} na telefonie (szerokość 390 px)`],
    ['errors', 'Błąd', `Motyw ${t.label}: pytanie obowiązkowe bez odpowiedzi — czerwone obramowanie, ikona i komunikat`],
  ];
  return `
          <article class="tcard" id="${t.id}" aria-labelledby="${t.id}-title">
            <div class="tshot" data-theme="${t.id}">
              <img src="/szablony/img/${t.id}-desktop.jpg" width="960" height="720" loading="lazy" decoding="async"
                   alt="${esc(views[0][2])}" data-alts='${esc(JSON.stringify(Object.fromEntries(views.map(([v, , a]) => [v, a]))))}' />
            </div>
            <div class="tview" role="group" aria-label="Podgląd motywu ${esc(t.label)}">
              ${views.map(([v, l], i) => `<button type="button" data-view="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}
            </div>
            <div class="tbody">
              <h3 id="${t.id}-title">${esc(t.label)}</h3>
              <p>${esc(t.summary)}</p>
              <ul class="tags" aria-label="Zastosowania">${t.useCases.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>
              <ul class="swatches" aria-label="Paleta kolorów">
                ${swatch(k.primary, 'Akcent')}${swatch(k.text, 'Tekst')}${swatch(k.bg, 'Tło')}
              </ul>
              <p class="contrast"><strong>Kontrast:</strong> tekst ${ratio(rep.body)} · przycisk ${ratio(rep.btn)} · minimum ${ratio(rep.minText)}</p>
              <div class="tdl-group">
                ${variants.map((v, i) => `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'} tdl" href="/szablony/pobierz/${v.id}/lc_${t.id}.zip" download aria-label="Pobierz ${esc(t.label)} dla LimeSurvey ${v.label} (lc_${t.id}.zip, ${kb(rep.sizes[v.id])})">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
                  LimeSurvey ${v.label} <span class="size">${kb(rep.sizes[v.id])}</span>
                </a>`).join('\n                ')}
              </div>
            </div>
          </article>`;
}

export function renderPage({ cfg, report, bundles }) {
  const variants = cfg.variants;
  const tested = variants.map((v) => v.testedOn).join(' i ');
  const cards = cfg.themes.map((t) => themeCard(t, report.find((r) => r.id === t.id), variants)).join('\n');
  const names = cfg.themes.map((t) => `<code>lc_${t.id}</code>`).join(', ');
  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Darmowe motywy ankiet LimeSurvey zgodne z WCAG 2.2 — LimeControl</title>
  <meta name="description" content="Sześć darmowych, responsywnych motywów ankiet dla LimeSurvey 6 i 7: Medical, Professional, Social, Marketing, Eco i Minimalist. Zgodne z WCAG 2.2 AA. Pobierz ZIP i zainstaluj w swojej instancji." />
  <link rel="canonical" href="https://limecontrol.eu/szablony.html" />
  <meta name="theme-color" content="#1b5e36" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://limecontrol.eu/szablony.html" />
  <meta property="og:title" content="Darmowe motywy ankiet LimeSurvey — WCAG 2.2 AA" />
  <meta property="og:description" content="Medical, Professional, Social, Marketing, Eco, Minimalist. Responsywne, czytelne, gotowe do importu." />
  <meta property="og:image" content="https://limecontrol.eu/szablony/img/medical-desktop.jpg" />
  <meta property="og:locale" content="pl_PL" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/style.css" />
  <script type="application/ld+json">
  ${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Motywy ankiet LimeSurvey od LimeControl',
    itemListElement: cfg.themes.map((t, i) => ({
      '@type': 'ListItem', position: i + 1,
      item: { '@type': 'SoftwareSourceCode', name: t.title, description: t.description, license: 'https://www.gnu.org/licenses/gpl-2.0.html',
        downloadUrl: `https://limecontrol.eu/szablony/pobierz/${variants[0].id}/lc_${t.id}.zip`, programmingLanguage: 'CSS', version: cfg.version },
    })),
  })}
  </script>
</head>
<body>
  <a class="skip" href="#main">Przejdź do treści</a>

  <header class="nav">
    <div class="container">
      <a class="nav-logo" href="/" aria-label="LimeControl — strona główna">
        <img class="logo-light" src="/assets/logo.svg" alt="LimeControl" width="104" height="34" />
        <img class="logo-dark" src="/assets/logo-dark.svg" alt="LimeControl" width="104" height="34" />
      </a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
      <ul class="nav-links" id="nav-links">
        <li><a href="/#funkcje">Funkcje</a></li>
        <li><a href="/szablony.html" aria-current="page">Motywy ankiet</a></li>
        <li><a href="#instalacja">Instalacja</a></li>
        <li><a href="/docs.html">Dokumentacja</a></li>
        <li><a class="btn btn-primary btn-sm" href="https://app.limecontrol.eu">Otwórz aplikację</a></li>
      </ul>
    </div>
  </header>

  <main id="main">
    <section class="hero hero-themes">
      <div class="container">
        <div>
          <span class="eyebrow">Motywy ankiet LimeSurvey</span>
          <h1>Ankiety, które <span class="lime">każdy przeczyta</span> — na telefonie i&nbsp;komputerze.</h1>
          <p class="lead">Sześć darmowych motywów dla LimeSurvey&nbsp;6 i&nbsp;7 zbudowanych na jednym, przetestowanym wzorcu: duże pola odpowiedzi, wyraźny fokus, czytelne błędy i&nbsp;kontrast zgodny z&nbsp;WCAG&nbsp;2.2&nbsp;AA. Pobierz ZIP dla swojej wersji, zaimportuj w&nbsp;panelu i&nbsp;gotowe. <a href="#instalacja">Instrukcja instalacji</a>.</p>
          <div class="hero-cta">
            ${variants.map((v, i) => `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}" href="/szablony/pobierz/${v.id}/limecontrol-motywy-ankiet-${v.id}.zip" download>
              Wszystkie dla LimeSurvey ${v.label} (${kb(bundles[v.id])})
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>
            </a>`).join('\n            ')}
          </div>
          <ul class="hero-meta">
            <li>WCAG 2.2 AA</li>
            <li>LimeSurvey ${variants.map((v) => v.label).reverse().join(' i ')}</li>
            <li>Responsywne od 320 px</li>
            <li>Bez zewnętrznych fontów i skryptów</li>
            <li>Licencja GPL</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="motywy" class="section-soft" aria-labelledby="motywy-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Galeria</span>
          <h2 id="motywy-h">Wybierz motyw</h2>
          <p>Zrzuty pochodzą z prawdziwej instalacji LimeSurvey. Każdy motyw sprawdziliśmy na LimeSurvey ${tested}. Przełącz podgląd, żeby zobaczyć widok na telefonie i komunikat o&nbsp;błędzie.</p>
        </div>
        <div class="tgrid">
${cards}
        </div>
      </div>
    </section>

    <section id="dostepnosc" aria-labelledby="a11y-h">
      <div class="container split">
        <div>
          <span class="eyebrow">Dostępność</span>
          <h2 id="a11y-h">Wspólny, sprawdzony wzorzec</h2>
          <p class="muted">Wszystkie motywy dzielą jeden arkusz bazowy (<code>lc-base.css</code>) i skrypt <code>lc-a11y.js</code>. Różnią się tylko kolorami, typografią i zaokrągleniami — dlatego zachowują się tak samo i są tak samo dostępne.</p>
          <p class="muted">Kontrast każdej palety jest sprawdzany automatycznie przy budowaniu paczek — motyw, który nie spełnia progów, nie zostanie wydany.</p>
        </div>
        <ul class="checklist">
          <li><span><strong>Kontrast</strong> tekstu min. 4,5:1, obramowań pól i&nbsp;fokusu min. 3:1 (WCAG 1.4.3, 1.4.11).</span></li>
          <li><span><strong>Widoczny fokus</strong> — 3&nbsp;px obrys z&nbsp;odstępem przy nawigacji klawiaturą (2.4.7, 2.4.13).</span></li>
          <li><span><strong>Cele dotykowe ≥&nbsp;44&nbsp;px</strong>; cały kafelek odpowiedzi jest klikalny (2.5.8).</span></li>
          <li><span><strong>Błędy nie tylko kolorem</strong> — obramowanie, ikona i&nbsp;tekst; fokus przenosi się na pierwsze pytanie z&nbsp;błędem, pole dostaje <code>aria-invalid</code> (1.4.1, 3.3.1).</span></li>
          <li><span><strong>Natywne pola wyboru</strong> — działają w&nbsp;trybie wysokiego kontrastu Windows i&nbsp;z&nbsp;czytnikami ekranu.</span></li>
          <li><span><strong>Reflow</strong> — brak przewijania w&nbsp;poziomie od 320&nbsp;px; szerokie tabele przewijają się w&nbsp;swoim kontenerze (1.4.10).</span></li>
          <li><span><strong>Link „Przejdź do pytań”</strong>, opisane pytania obowiązkowe, nazwa przycisku menu (2.4.1, 4.1.2).</span></li>
          <li><span><strong>Preferencje użytkownika</strong> — <code>prefers-reduced-motion</code>, <code>forced-colors</code>, druk.</span></li>
          <li><span><strong>RODO-friendly</strong> — fonty systemowe, żadnych CDN ani skryptów śledzących.</span></li>
        </ul>
      </div>
    </section>

    <section id="instalacja" class="section-soft" aria-labelledby="inst-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Instalacja</span>
          <h2 id="inst-h">Zainstaluj motyw w swoim LimeSurvey</h2>
          <p>Potrzebujesz konta superadministratora (lub uprawnienia do importu motywów) i&nbsp;LimeSurvey 6.x albo 7.x z&nbsp;wbudowanym motywem <em>Fruity TwentyThree</em>.</p>
        </div>

        <ol class="steps">
          <li>
            <h3>Pobierz ZIP dla swojej wersji</h3>
            <p>Wersję LimeSurvey widać w&nbsp;stopce panelu administracyjnego. Pobierz wariant <strong>7.x</strong> albo <strong>6.x</strong> i&nbsp;<strong>nie zmieniaj nazwy pliku</strong> — LimeSurvey nazywa katalog motywu tak jak plik (np. <code>lc_medical</code>).</p>
          </li>
          <li>
            <h3>Prześlij do LimeSurvey</h3>
            <p><em>Konfiguracja → Motywy</em>, zakładka <em>Motywy ankiet</em>, przycisk <strong>Prześlij i&nbsp;zainstaluj</strong>. Wskaż plik ZIP i&nbsp;potwierdź.</p>
          </li>
          <li>
            <h3>Wybierz w ankiecie</h3>
            <p>W&nbsp;ankiecie: <em>Ustawienia ankiety → Ogólne → Motyw</em>, wybierz np. „LimeControl Medical” i&nbsp;zapisz.</p>
          </li>
          <li>
            <h3>Dodaj logo</h3>
            <p>W&nbsp;ankiecie <em>Opcje motywu → Obrazy</em>: ustaw <em>Logo: Tak</em> i&nbsp;wgraj plik PNG lub JPG.</p>
          </li>
        </ol>

        <div class="callout">
          <p><strong>Dlaczego dwa warianty?</strong> LimeSurvey&nbsp;7 dodał do motywu bazowego nowe opcje (kolory, zaokrąglenia, ikony, zawijanie tabel), a&nbsp;formularz <em>Opcje motywu</em> pokazuje tylko opcje opisane w&nbsp;paczce. Wygląd i&nbsp;dostępność są w&nbsp;obu wariantach identyczne — różni się tylko lista opcji w&nbsp;panelu. Wariant 6.x nie jest oznaczony jako zgodny z&nbsp;LimeSurvey&nbsp;7 i&nbsp;odwrotnie.</p>
        </div>

        <div class="install-more">
          <div class="card">
            <h3>Instalacja ręczna (FTP / SSH)</h3>
            <p>Gdy przesyłanie przez panel jest zablokowane (np. limit <code>upload_max_filesize</code> lub uprawnienia katalogu):</p>
            <pre><code><span class="c"># na serwerze, w katalogu głównym LimeSurvey</span>
mkdir -p upload/themes/survey/lc_medical
unzip lc_medical.zip -d upload/themes/survey/lc_medical</code></pre>
            <p>Plik <code>config.xml</code> musi leżeć bezpośrednio w&nbsp;<code>upload/themes/survey/lc_medical/</code>. Następnie w&nbsp;<em>Konfiguracja → Motywy</em> znajdź motyw na liście dostępnych i&nbsp;kliknij <strong>Zainstaluj</strong>.</p>
          </div>
          <div class="card">
            <h3>Motyw domyślny dla nowych ankiet</h3>
            <p><em>Konfiguracja → Globalne → Ogólne → Domyślny motyw</em>. Istniejące ankiety zachowują swój motyw — zmień go w&nbsp;ustawieniach każdej z&nbsp;nich.</p>
            <h3>Własne kolory i fonty</h3>
            <p>Otwórz <em>Konfiguracja → Motywy → Edytor motywów</em> przy wybranym motywie i&nbsp;edytuj <code>css/lc-theme.css</code> — wszystkie kolory to zmienne <code>--lc-*</code> na początku pliku. Po zmianie sprawdź kontrast (tekst ≥&nbsp;4,5:1, obramowania ≥&nbsp;3:1).</p>
          </div>
          <div class="card">
            <h3>Aktualizacja do nowej wersji</h3>
            <p>LimeSurvey nie nadpisze istniejącego motywu przy imporcie. Najprościej podmienić pliki przez FTP w&nbsp;katalogu <code>upload/themes/survey/lc_…</code>, a&nbsp;potem w&nbsp;<em>Konfiguracja → Globalne → Ogólne</em> kliknąć <strong>Wyczyść pamięć podręczną zasobów</strong>.</p>
            <p>Alternatywnie: <em>Odinstaluj</em> motyw, usuń jego katalog z&nbsp;serwera i&nbsp;zaimportuj nowy ZIP (ankiety trzeba potem ponownie przypisać do motywu).</p>
          </div>
        </div>

        <h3 class="faq-title">Rozwiązywanie problemów</h3>
        <div class="faq">
          <details>
            <summary>„Nie można zaimportować motywu, który już istnieje”</summary>
            <p>Motyw o&nbsp;tej nazwie jest już na serwerze (także po odinstalowaniu katalog zostaje). Usuń katalog <code>upload/themes/survey/lc_…</code> albo zaktualizuj pliki ręcznie — patrz „Aktualizacja do nowej wersji”.</p>
          </details>
          <details>
            <summary>Motyw ma dziwną nazwę, np. <code>lc_medical_1</code>, albo nie działa po imporcie</summary>
            <p>Przeglądarka dopisała do pobranego pliku „(1)”. Usuń taki motyw, zmień nazwę pliku z&nbsp;powrotem na <code>lc_medical.zip</code> i&nbsp;zaimportuj ponownie. Nazwa pliku musi być zgodna z&nbsp;nazwą w&nbsp;<code>config.xml</code> (${names}).</p>
          </details>
          <details>
            <summary>Zaktualizowałem LimeSurvey z&nbsp;6 do 7 — co z&nbsp;motywem?</summary>
            <p>Podmień pliki motywu na wariant 7.x (przez FTP w&nbsp;<code>upload/themes/survey/lc_…</code>), a&nbsp;potem w&nbsp;<em>Konfiguracja → Motywy</em> użyj <strong>Resetuj</strong> przy motywie, żeby wczytać nową listę opcji, i&nbsp;wyczyść pamięć podręczną zasobów. Ustawienia logo trzeba wtedy wybrać ponownie.</p>
          </details>
          <details>
            <summary>Błędy pokazują się w&nbsp;okienku zamiast przy pytaniu</summary>
            <p>Motywy domyślnie wyświetlają komunikaty na stronie. Jeśli w&nbsp;Twojej ankiecie jest inaczej, ustaw w&nbsp;<em>Opcje motywu → Opcje podstawowe</em> pole <em>Pokaż okna wyskakujące</em> na <strong>Na stronie</strong>.</p>
          </details>
          <details>
            <summary>„Nie można zaimportować motywu, ponieważ fruity_twentythree nie jest zainstalowany”</summary>
            <p>Motywy dziedziczą po wbudowanym motywie <em>Fruity TwentyThree</em>, dostępnym w&nbsp;LimeSurvey 6 i&nbsp;7. Zainstaluj go w&nbsp;<em>Konfiguracja → Motywy</em> albo zaktualizuj LimeSurvey. Wersje 5.x i&nbsp;starsze nie są obsługiwane.</p>
          </details>
          <details>
            <summary>Po zmianach w&nbsp;CSS ankieta wygląda tak samo</summary>
            <p>LimeSurvey buforuje pliki motywów. Kliknij <strong>Wyczyść pamięć podręczną zasobów</strong> w&nbsp;<em>Konfiguracja → Globalne → Ogólne</em> i&nbsp;odśwież stronę ankiety z&nbsp;pominięciem cache przeglądarki.</p>
          </details>
          <details>
            <summary>Czy mogę używać motywów komercyjnie i&nbsp;je modyfikować?</summary>
            <p>Tak. Motywy są na licencji GPL-2.0-or-later (jak LimeSurvey) — możesz je zmieniać, rebrandować i&nbsp;używać w&nbsp;projektach komercyjnych.</p>
          </details>
          <details>
            <summary>Czy motywy działają z&nbsp;LimeControl?</summary>
            <p>Tak — motyw jest ustawieniem ankiety po stronie LimeSurvey, więc działa niezależnie od tego, czy zarządzasz ankietą w&nbsp;panelu, czy w&nbsp;aplikacji <a href="https://app.limecontrol.eu">LimeControl</a>.</p>
          </details>
        </div>
      </div>
    </section>

    <section style="padding-top:48px">
      <div class="container">
        <div class="cta">
          <h2>Zarządzaj ankietami z telefonu</h2>
          <p>LimeControl aktywuje ankiety, planuje starty i&nbsp;pokazuje wyniki z&nbsp;wielu instancji LimeSurvey — za darmo.</p>
          <div class="cta-actions">
            <a class="btn btn-primary" href="https://app.limecontrol.eu">Otwórz aplikację</a>
            <a class="btn btn-ghost" href="/">Poznaj LimeControl</a>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container">
      <a href="/" aria-label="LimeControl">
        <img class="logo-light" src="/assets/logo.svg" alt="LimeControl" width="86" height="28" />
        <img class="logo-dark" src="/assets/logo-dark.svg" alt="LimeControl" width="86" height="28" />
      </a>
      <ul class="footer-links">
        <li><a href="/szablony.html">Motywy ankiet</a></li>
        <li><a href="/docs.html">Dokumentacja</a></li>
        <li><a href="https://app.limecontrol.eu">Aplikacja</a></li>
        <li><a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a></li>
      </ul>
      <a class="coffee" href="https://www.paypal.com/biz/profile/strefabadan" target="_blank" rel="noopener noreferrer">Postaw mi kawę</a>
    </div>
    <div class="container" style="margin-top:20px">
      <p style="margin:0">© <span id="year">2026</span> LimeControl · Motywy w wersji ${cfg.version}, licencja GPL-2.0-or-later, oparte na Fruity TwentyThree (LimeSurvey GmbH). LimeSurvey jest znakiem towarowym LimeSurvey GmbH; LimeControl nie jest z nią powiązany.</p>
    </div>
  </footer>

  <script src="/assets/site.js" defer></script>
  <script>
    // Przełącznik podglądu: Komputer / Telefon / Błąd
    document.querySelectorAll('.tcard').forEach(function (card) {
      var img = card.querySelector('.tshot img');
      var alts = JSON.parse(img.getAttribute('data-alts'));
      var id = card.id;
      card.querySelectorAll('.tview button').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = b.getAttribute('data-view');
          card.querySelectorAll('.tview button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          card.querySelector('.tshot').classList.toggle('is-mobile', v === 'mobile');
          img.src = '/szablony/img/' + id + '-' + v + '.jpg';
          img.alt = alts[v];
          img.width = v === 'mobile' ? 390 : 960;
          img.height = v === 'mobile' ? 750 : 720;
        });
      });
    });
  </script>
</body>
</html>
`;
}
