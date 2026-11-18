# Szablony ankiet LimeControl / LimeControl survey templates

🇵🇱 Gotowe kwestionariusze dla LimeSurvey w formacie struktury ankiety (`.lss`), każdy po polsku i angielsku.
🇬🇧 Ready-made questionnaires for LimeSurvey in the survey structure format (`.lss`), each in Polish and English.

- Pobieranie / download: <https://limecontrol.eu/ankiety.html> · <https://limecontrol.eu/en/templates.html>
- W aplikacji / in the app: **Ankiety → Biblioteka szablonów** (**Surveys → Template library**)
- Licencja / licence: **CC0 1.0** ([LICENSE](./LICENSE)) — bez ograniczeń, także komercyjnie / no restrictions, commercial use included

Sprawdzone importem i pełnym przejściem ankiety na LimeSurvey 6.15.12 i 7.10.0.
Tested by importing and completing every survey on LimeSurvey 6.15.12 and 7.10.0.

## Struktura / layout

| Ścieżka | Zawartość |
| --- | --- |
| `templates/*.json` | definicje szablonów — jeden plik na ankietę |
| `scales.json` | wspólne zestawy odpowiedzi (np. `@agree5`, `@nps11`), używane przez `"options": "@nazwa"` |
| `categories.json` | kategorie z nazwami PL/EN |
| `lib/lss.mjs` | generator pliku `.lss` (bez zależności) |
| `build.mjs` | buduje pliki `.lss`, katalog `catalog.json` i paczkę ZIP |
| `verify.mjs` | test na prawdziwym LimeSurvey przez API |
| `previews/` | zrzuty ekranu używane na stronie |
| `test/` | testy jednostkowe generatora |

## Budowanie / building

```bash
node survey-templates/build.mjs     # albo: npm run build:templates
npm test                            # testy generatora
```

Wynik trafia do `site/ankiety/` (strona) i `public/szablony-ankiet/` (biblioteka w aplikacji). Oba katalogi są
w repozytorium — po zmianie szablonu zatwierdź także wygenerowane pliki. Identyfikator ankiety (SID) jest
wyliczany z `id` szablonu, więc budowanie jest powtarzalne.

## Format definicji / definition format

Teksty widoczne dla respondenta to pary `["po polsku", "in English"]` w kolejności z pola `languages`.

```json
{
  "id": "moja-ankieta",
  "order": 130,
  "category": "customer-satisfaction",
  "modes": ["cawi"],
  "theme": "professional",
  "minutes": 3,
  "languages": ["pl", "en"],
  "title": ["Moja ankieta", "My survey"],
  "summary": ["Opis na stronie i w aplikacji.", "Description for the website and the app."],
  "description": ["Opis widoczny dla respondenta.", "Description shown to the respondent."],
  "welcome": ["Tekst powitalny.", "Welcome text."],
  "end": ["Dziękujemy!", "Thank you!"],
  "groups": [
    {
      "title": ["Ocena", "Rating"],
      "questions": [
        {
          "code": "OVERALL",
          "type": "radio",
          "mandatory": true,
          "text": ["Jak oceniasz naszą usługę?", "How do you rate our service?"],
          "options": "@satisfaction5"
        },
        {
          "code": "WHY",
          "type": "longtext",
          "relevance": "OVERALL.NAOK <= 2",
          "text": ["Co poszło nie tak?", "What went wrong?"]
        }
      ]
    }
  ]
}
```

| Pole | Opis |
| --- | --- |
| `id` | nazwa pliku i kotwica na stronie (małe litery, cyfry, myślniki) |
| `category` | identyfikator z `categories.json` |
| `modes` | `cawi`, `cati`, `capi` — etykiety trybu realizacji |
| `theme` | motyw LimeControl bez przedrostka (`professional` → `lc_professional`); gdy motyw nie jest zainstalowany, LimeSurvey użyje domyślnego |
| `settings` | nadpisania ustawień ankiety, np. `{ "format": "S" }` (pytanie na stronę) |
| `emails` | nadpisania treści zaproszeń i przypomnień dla języka |
| `tokenAttributes` | dodatkowe pola uczestnika: `[{ "name": ["Telefon", "Phone"] }]` |

Typy pytań (`type`): `radio`, `dropdown`, `checkbox`, `scale5`, `yesno`, `text`, `longtext`, `number`, `date`,
`array`, `ranking`, `multitext`, `info` (tekst bez odpowiedzi, np. skrypt ankietera), `equation` (pole wyliczane).

Pola pytania: `code` (litera + do 19 liter i cyfr), `text`, opcjonalnie `help`, `mandatory`, `other`,
`relevance` (wyrażenie ExpressionScript), `options` (lista `{ "code", "text" }` albo `"@zestaw"`),
`subquestions`, `attributes` (atrybuty pytania LimeSurvey), `attributesL10n` (atrybuty zależne od języka)
i `cssClass` — np. `lc-interviewer` dla pól wypełnianych przez ankietera.

Generator sprawdza definicję (unikalne kody, komplet tłumaczeń, znane typy i ustawienia) i przerywa budowanie
z czytelnym komunikatem.

## Test na LimeSurvey / verifying against LimeSurvey

```bash
LS_URL=https://test.example.com LS_USER=admin LS_PASSWORD='…' node survey-templates/verify.mjs
```

Skrypt importuje każdy plik `.lss`, porównuje strukturę z definicją, aktywuje ankietę, otwiera jej stronę
publiczną w obu językach i na koniec ją usuwa (`--keep` zostawia ankiety). **Używaj instancji testowej.**

## Jak dodać szablon / adding a template

1. Skopiuj najbliższy istniejący plik z `templates/` i zmień `id`, teksty oraz pytania.
2. Uruchom `npm run build:site` i `npm test`.
3. Zaimportuj wynik do testowego LimeSurvey (`verify.mjs` albo ręcznie) i przejdź ankietę w obu językach.
4. Zatwierdź definicję razem z wygenerowanymi plikami.

Dodawaj tylko własne treści albo treści, które wolno udostępnić na CC0. Uznane narzędzia badawcze często mają
własne warunki użycia — kwestionariusz SUS (John Brooke, 1986) jest w zestawie, bo jego autor udostępnił go
do swobodnego użytku.
