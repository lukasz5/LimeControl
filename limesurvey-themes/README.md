# Motywy ankiet LimeControl dla LimeSurvey / LimeControl survey themes

🇬🇧 Eight survey themes for LimeSurvey 6.x and 7.x built on one WCAG 2.2 AA pattern: Medical, Professional,
Social, Marketing, Eco, Minimalist, and two interviewer themes — CATI and CAPI. Download and installation
guide: <https://limecontrol.eu/en/themes.html>. The notes below are in Polish.

Osiem motywów ankiet (Medical, Professional, Social, Marketing, Eco, Minimalist, CATI, CAPI) zbudowanych na
jednym wzorcu zgodnym z WCAG 2.2 AA. Każdy motyw jest motywem potomnym wbudowanego
`fruity_twentythree` i ma dwa warianty: **LimeSurvey 7.x** i **LimeSurvey 6.x**.

Paczki: `site/szablony/pobierz/<ls7|ls6>/`. Strony pobierania (`site/szablony.html`, `site/en/themes.html`)
generuje `site-src/build.mjs` — `npm run build:site`.

## Budowanie

```bash
node limesurvey-themes/build.mjs     # albo: npm run build:themes
```

Skrypt:

1. sprawdza kontrast każdej palety (tekst ≥ 4.5:1, obramowania i fokus ≥ 3:1) i przerywa przy błędzie,
2. tworzy `dist/<ls7|ls6>/lc_<id>/` i pakuje ZIP-y (pliki w korzeniu archiwum, jak eksport z LS),
3. kopiuje zrzuty z `previews/` do `site/szablony/img/`.

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

## Podglądy

Zrzuty w `previews/` zrobiono Playwrightem na testowej instalacji LimeSurvey z ankietą demonstracyjną
(pytania: jednokrotny i wielokrotny wybór, skala 1–5, tak/nie, lista, tekst krótki i długi):
desktop 1280×900, telefon iPhone 13 (390 px), stan błędu po wysłaniu pustego pytania obowiązkowego.
Po zmianie wyglądu zrób nowe zrzuty i przytnij je do: `<id>.png` 800×600, `<id>-desktop.jpg` 960×720,
`<id>-mobile.jpg` 390×750, `<id>-errors.jpg` 960×720.

## Licencja

GPL-2.0-or-later (jak LimeSurvey; motywy dziedziczą po Fruity TwentyThree © LimeSurvey GmbH).
