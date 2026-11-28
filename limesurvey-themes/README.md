# Motywy ankiet LimeControl dla LimeSurvey / LimeControl survey themes

🇬🇧 Sixteen survey themes for LimeSurvey 6.x and 7.x built on one WCAG 2.2 AA pattern: Medical, Professional,
Social, Marketing, Eco, Minimalist, two interviewer themes (CATI and CAPI), and eight themes with their own
self-hosted typefaces — Editorial, Civic, Product, Studio, Logistics, Finance, Hospitality and the dark
Midnight. The **LimeControlBranding** plugin adds header and footer logos and a brand colour
([plugin/LimeControlBranding/README.md](plugin/LimeControlBranding/README.md)). Download and installation
guide: <https://limecontrol.eu/en/themes.html>. The notes below are in Polish.

Szesnaście motywów ankiet zbudowanych na jednym wzorcu zgodnym z WCAG 2.2 AA:

- **1.0–1.1:** Medical, Professional, Social, Marketing, Eco, Minimalist, CATI, CAPI — fonty systemowe;
- **1.2:** Editorial, Civic, Product, Studio, Logistics, Finance, Hospitality, Midnight (ciemny) — własna
  typografia (fonty SIL OFL w paczce motywu, bez CDN).

Każdy motyw jest motywem potomnym wbudowanego `fruity_twentythree` i ma dwa warianty: **LimeSurvey 7.x**
i **LimeSurvey 6.x**. Logotypy w nagłówku i stopce oraz kolor marki dodaje wtyczka
[LimeControlBranding](plugin/LimeControlBranding/README.md).

Paczki: `site/szablony/pobierz/<ls7|ls6>/`. Strony pobierania (`site/szablony.html`, `site/en/themes.html`)
generuje `site-src/build.mjs` — `npm run build:site`.

## Budowanie

```bash
node limesurvey-themes/build.mjs     # albo: npm run build:themes
```

Skrypt:

1. sprawdza kontrast każdej palety (tekst ≥ 4.5:1, obramowania i fokus ≥ 3:1) i przerywa przy błędzie,
2. tworzy `dist/<ls7|ls6>/lc_<id>/` z fontami motywu (`fonts/`, `css/lc-fonts.css`, licencje OFL) i pakuje
   ZIP-y (pliki w korzeniu archiwum, jak eksport z LS),
3. pakuje wtyczkę do `site/szablony/pobierz/LimeControlBranding.zip`,
4. kopiuje zrzuty z `previews/` do `site/szablony/img/` i fonty do `site/szablony/fonts/` (próbki pisma na
   stronie, `specimens.css`).

Budowanie jest powtarzalne: daty w paczkach pochodzą z pola `released` w `themes.json`, więc ponowne
uruchomienie bez zmian nie zmienia plików ZIP. Po zmianie motywu podbij `version` i `released`.
Wymaga polecenia `zip`.

## Struktura

| Ścieżka | Zawartość |
| --- | --- |
| `themes.json` | wersja, data wydania, warianty LS, palety (tokeny `--lc-*`), opisy PL/EN i opcjonalny układ (`layout`) |
| `shared/css/lc-base.css` | wspólny arkusz: układ, kafelki odpowiedzi, fokus, błędy, tabele, tryb ankietera, responsywność |
| `shared/scripts/lc-a11y.js` | link „Przejdź do pytań”, `aria-required`/`aria-invalid`, fokus na pierwszym błędzie, skróty klawiszowe ankietera |
| `base/ls{6,7}-options.xml` | opcje `fruity_twentythree` z LS 6.15.12 / 7.10.0 (GPL, LimeSurvey GmbH) |
| `base/ls{6,7}-engine.xml` | sekcja `<engine>` z tych samych wersji |
| `previews/` | zrzuty z prawdziwego LimeSurvey: `<id>.png` (miniatura w LS), `<id>-{desktop,mobile,errors}.jpg` (strona) |
| `fonts/` | fonty WOFF2 (SIL OFL 1.1) z licencjami, manifest `fonts.json` i skrypt `vendor.mjs`, który je kopiuje z pakietów @fontsource |
| `plugin/LimeControlBranding/` | wtyczka: logotypy w nagłówku i stopce, tekst stopki, kolor marki ([README](plugin/LimeControlBranding/README.md)) |

## Typografia

Motywy 1.2 mają własne kroje pisma, dobrane do zastosowania. Fonty są w paczce motywu (`fonts/`) i ładują się
z serwera LimeSurvey — bez Google Fonts i innych CDN, więc ankieta nie wysyła adresu IP respondenta do
podmiotów trzecich. Każdy krój ma zestawy znaków: łaciński, łaciński rozszerzony (polski, niemiecki,
francuski, hiszpański) i cyrylicę, jeśli font ją ma; przeglądarka pobiera tylko te, których strona używa
(`unicode-range`, `font-display: swap`).

| Motyw | Nagłówki | Tekst | Charakter |
| --- | --- | --- | --- |
| Editorial | Literata | Literata | szeryfowy, czytelny w długich ankietach |
| Civic | Brygada 1918 | Noto Sans | administracja i samorządy, pasek akcentu pod nagłówkiem |
| Product | Geist | Geist | aplikacje i SaaS |
| Studio | Bricolage Grotesque | DM Sans | agencje i branże kreatywne, przyciski „pigułki” |
| Logistics | Barlow Condensed (wersaliki) | Barlow | logistyka i kurierzy, duże pola dotykowe |
| Finance | IBM Plex Sans | IBM Plex Sans | finanse, cyfry o stałej szerokości w tabelach |
| Hospitality | Newsreader (kursywa) | Instrument Sans | hotele, restauracje, turystyka |
| Midnight | Inter | Inter | ciemny motyw (`color-scheme: dark`) |

Nowy font: dopisz go do listy `FONTS` w `fonts/vendor.mjs` (tylko licencja OFL-1.1) i uruchom
`node limesurvey-themes/fonts/vendor.mjs <katalog node_modules z pakietami @fontsource>`, a potem w
`themes.json` wskaż go w polu `fonts: { "heading": "<slug>", "body": "<slug>" }`.

## Typografia i tryb kolorów (`tokens`)

Opcjonalne pola w `tokens` (brak pola = wartość domyślna z `lc-base.css`):

| Pole | Zmienna | Działanie |
| --- | --- | --- |
| `headingStyle`, `headingTransform`, `headingTracking` | `--lc-heading-*` | kursywa, wersaliki, odstępy liter w tytułach |
| `questionFont`, `questionWeight` | `--lc-question-*` | krój (stos fontów CSS) i grubość treści pytań; domyślnie jak nagłówki |
| `numeric` | `--lc-numeric` | np. `tabular-nums` — cyfry równej szerokości |
| `headerStripe` | `--lc-header-stripe` | kolor paska pod nagłówkiem (np. kolor akcentu) |
| `colorScheme` | `--lc-color-scheme` | `dark` — ciemne kontrolki przeglądarki i `data-bs-theme="dark"` (Bootstrap) |

## Układ motywu (`layout`)

Motyw może zmienić układ wspólnego arkusza bez własnego CSS — build zamienia pole `layout` na zmienne
`--lc-layout-*` i `--lc-nav-*`:

| Pole | Działanie | Przykład |
| --- | --- | --- |
| `maxWidth` | szerokość kolumny z pytaniami | CATI `68rem`, CAPI `46rem` |
| `gap`, `cardPadding` | odstępy między pytaniami i wewnątrz kart | CATI — gęstszy układ |
| `target` | minimalna wysokość pól dotykowych | CAPI `56px` |
| `stickyNav` | pasek „Wstecz / Dalej” przyklejony do dołu ekranu | CATI, CAPI |
| `hotkeys` | skróty klawiszowe ankietera | CATI |

## Tryb ankietera

- **Skróty klawiszowe** (motywy z `hotkeys`): `1`–`9` i `0` zaznaczają kolejne odpowiedzi, w tablicach fokus
  przechodzi do następnego wiersza, `Ctrl+Enter` przechodzi dalej, `Ctrl+Shift+Enter` wraca. Legenda przy
  nawigacji pozwala wyłączyć skróty (wybór zapisuje się w `localStorage`); skróty nie działają podczas pisania
  w polu tekstowym.
- **Klasa `lc-interviewer`** (*Ustawienia pytania → Wyświetlanie → Klasa CSS*) wyróżnia w każdym motywie skrypt
  do odczytania lub pole wypełniane przez ankietera.
- Gotowe kwestionariusze z tą klasą: szablony „Wywiad CATI” i „Wywiad CAPI” w `survey-templates/`.

## Ważne ustalenia (sprawdzone na LS 6.15.12 i 7.10.0)

- **Nazwa ZIP = nazwa katalogu motywu** (`lc_medical.zip` → `upload/themes/survey/lc_medical`). Musi zgadzać się z `<name>` w `config.xml`.
- **Katalog `views/` jest wymagany** także w motywie potomnym — bez niego ankieta kończy się błędem Twig.
- Import przyjmuje tylko obrazy **png/jpg/gif/ico** (SVG jest odrzucany) i pliki `css, js, json, md, txt, xml, twig, fonty`.
- **`<compatibility>`**: LS uznaje motyw za zgodny tylko przy zgodnym numerze głównym wersji — stąd osobne warianty z `6.0` i `7.0`.
- **Formularz „Opcje motywu”** czyta definicje opcji wyłącznie z `config.xml` motywu i wymaga `<engine><optionspage>core</optionspage></engine>`. LS 7 ma więcej opcji niż LS 6 (kolory, zaokrąglenia, ikony), więc warianty mają różne bloki `<options>`.
- LS 7 wstrzykuje inline `<style>` z kolorami z opcji motywu; build ustawia te opcje zgodnie z paletą, a `lc-base.css` ma wyższą specyficzność.
- LS 7 pokazuje plakietkę „Wymagane” — wtedy motyw nie dodaje gwiazdki ani tekstu dla czytników (brak dublowania).
- LS 7 nie używa już identyfikatorów SGQA (`900001X1X1`) w polach — CSS/JS opierają się wyłącznie na klasach.
- **Tablice**: komórki odpowiedzi w tablicach to `td.answer-item` — reguły kafelków muszą je pomijać (`:not(td)`),
  a układ „jeden pod drugim” na wąskich ekranach używa tego samego zapytania o media co Fruity.
- API RemoteControl przyjmuje w `set_survey_properties` nazwę motywu, który nie jest zainstalowany, i mimo to
  odpowiada sukcesem — po zmianie motywu trzeba odczytać właściwość ponownie.
- `variations/theme_apple.css` z Fruity ma reguły o wysokiej specyficzności, np. `#survey-nav.navbar
  { box-shadow: none }` i stały kolor `#1e1e1e` dla `.question-container .ls-question-message` —
  `lc-base.css` musi mieć co najmniej taką samą specyficzność (inaczej pasek Civic znika, a podpowiedzi
  walidacji są niewidoczne w motywie ciemnym).
- Fonty `woff2` i licencje `.txt` przechodzą przez import motywu bez zmian w konfiguracji LS.
- Wtyczka wgrana przez menedżera wtyczek leży w `upload/plugins/`, a `PluginBase::publish()` szuka plików w
  `plugins/` — dlatego LimeControlBranding publikuje `assets/` przez `AssetManager` z własnego katalogu.

## Podglądy

Zrzuty w `previews/` zrobiono Playwrightem na testowej instalacji LimeSurvey 6.15.12 z ankietą
demonstracyjną (pytania: jednokrotny i wielokrotny wybór, skala 1–5, tak/nie, lista, przesyłanie plików,
tekst krótki i długi), z zaznaczoną odpowiedzią „Dobrze” i wyłączoną wtyczką LimeControlBranding:

- `<id>-desktop.jpg` 960×720 — środkowy kadr okna 1280×900 (zrzut w 2×, pomniejszony),
- `<id>.png` 800×600 — ten sam kadr, miniatura motywu w LimeSurvey,
- `<id>-mobile.jpg` 390×750 — okno 390×844 (iPhone 13), górna część strony,
- `<id>-errors.jpg` 960×720 — po wysłaniu strony z pustym pytaniem obowiązkowym, pytanie z błędem na środku.

Po zmianie wyglądu zrób zrzuty wszystkich motywów od nowa, żeby strona pozostała spójna.

## Licencja

GPL-2.0-or-later (jak LimeSurvey; motywy dziedziczą po Fruity TwentyThree © LimeSurvey GmbH).
