# Motywy ankiet LimeControl dla LimeSurvey

Sześć motywów ankiet (Medical, Professional, Social, Marketing, Eco, Minimalist) zbudowanych na
jednym wzorcu zgodnym z WCAG 2.2 AA. Każdy motyw jest motywem potomnym wbudowanego
`fruity_twentythree` i ma dwa warianty: **LimeSurvey 7.x** i **LimeSurvey 6.x**.

Strona pobierania: `site/szablony.html` (generowana), paczki: `site/szablony/pobierz/<ls7|ls6>/`.

## Budowanie

```bash
node limesurvey-themes/build.mjs
```

Skrypt:

1. sprawdza kontrast każdej palety (tekst ≥ 4.5:1, obramowania i fokus ≥ 3:1) i przerywa przy błędzie,
2. tworzy `dist/<ls7|ls6>/lc_<id>/` i pakuje ZIP-y (pliki w korzeniu archiwum, jak eksport z LS),
3. kopiuje zrzuty z `previews/` i generuje `site/szablony.html` (`page.mjs`).

## Struktura

| Ścieżka | Zawartość |
| --- | --- |
| `themes.json` | wersja, warianty LS, palety i opisy motywów (tokeny `--lc-*`) |
| `shared/css/lc-base.css` | wspólny arkusz: układ, kafelki odpowiedzi, fokus, błędy, tabele, responsywność |
| `shared/scripts/lc-a11y.js` | link „Przejdź do pytań”, `aria-required`/`aria-invalid`, fokus na pierwszym błędzie, nazwa przycisku menu |
| `base/ls{6,7}-options.xml` | opcje `fruity_twentythree` z LS 6.15.12 / 7.10.0 (GPL, LimeSurvey GmbH) |
| `base/ls{6,7}-engine.xml` | sekcja `<engine>` z tych samych wersji |
| `previews/` | zrzuty z prawdziwego LimeSurvey: `<id>.png` (miniatura w LS), `<id>-{desktop,mobile,errors}.jpg` (strona) |

## Ważne ustalenia (sprawdzone na LS 6.15.12 i 7.10.0)

- **Nazwa ZIP = nazwa katalogu motywu** (`lc_medical.zip` → `upload/themes/survey/lc_medical`). Musi zgadzać się z `<name>` w `config.xml`.
- **Katalog `views/` jest wymagany** także w motywie potomnym — bez niego ankieta kończy się błędem Twig.
- Import przyjmuje tylko obrazy **png/jpg/gif/ico** (SVG jest odrzucany) i pliki `css, js, json, md, txt, xml, twig, fonty`.
- **`<compatibility>`**: LS uznaje motyw za zgodny tylko przy zgodnym numerze głównym wersji — stąd osobne warianty z `6.0` i `7.0`.
- **Formularz „Opcje motywu”** czyta definicje opcji wyłącznie z `config.xml` motywu i wymaga `<engine><optionspage>core</optionspage></engine>`. LS 7 ma więcej opcji niż LS 6 (kolory, zaokrąglenia, ikony), więc warianty mają różne bloki `<options>`.
- LS 7 wstrzykuje inline `<style>` z kolorami z opcji motywu; build ustawia te opcje zgodnie z paletą, a `lc-base.css` ma wyższą specyficzność.
- LS 7 pokazuje plakietkę „Wymagane” — wtedy motyw nie dodaje gwiazdki ani tekstu dla czytników (brak dublowania).
- LS 7 nie używa już identyfikatorów SGQA (`900001X1X1`) w polach — CSS/JS opierają się wyłącznie na klasach.

## Podglądy

Zrzuty w `previews/` zrobiono Playwrightem na testowej instalacji LimeSurvey z ankietą demonstracyjną
(pytania: jednokrotny i wielokrotny wybór, skala 1–5, tak/nie, lista, tekst krótki i długi):
desktop 1280×900, telefon iPhone 13 (390 px), stan błędu po wysłaniu pustego pytania obowiązkowego.
Po zmianie wyglądu zrób nowe zrzuty i przytnij je do: `<id>.png` 800×600, `<id>-desktop.jpg` 960×720,
`<id>-mobile.jpg` 390×750, `<id>-errors.jpg` 960×720.

## Licencja

GPL-2.0-or-later (jak LimeSurvey; motywy dziedziczą po Fruity TwentyThree © LimeSurvey GmbH).
