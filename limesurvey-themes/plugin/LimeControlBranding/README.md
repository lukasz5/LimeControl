# LimeControlBranding

Logotypy w nagłówku i stopce ankiety, pasek logotypów partnerów, tekst stopki i kolor marki — dla motywów
ankiet LimeControl w LimeSurvey 6.x i 7.x. Bez edycji szablonów Twig i bez kodu.

*English version below.*

## Co robi wtyczka

- **Nagłówek:** logo organizacji i opcjonalnie drugie logo (klient, partner, sponsor). Trzy wysokości, trzy
  układy, opcjonalna biała podkładka pod logotypami na ciemnym lub kolorowym nagłówku. Menu ankiety zostaje
  na miejscu.
- **Stopka:** nagłówek (np. „Projekt współfinansowany ze środków Unii Europejskiej”), do 12 logotypów
  (np. pasek logotypów funduszy UE), tekst (administrator danych, kontakt, numer projektu) i jeden link
  (np. polityka prywatności). Trzy style: karta jak pytania, biała karta (także w motywach ciemnych), bez tła.
- **Kolor marki:** zastępuje kolor akcentu motywu LimeControl. Jeśli kolor ma za mały kontrast, wtyczka sama
  go przyciemnia lub rozjaśnia do progów WCAG 2.2 AA (tekst 4,5:1) — także w ciemnym motywie Midnight.
  Opcjonalnie nagłówek w dokładnym kolorze marki z automatycznie dobranym kolorem tekstu.
- **Wgrywanie obrazów prosto z formularza ustawień** — z podglądem, zmianą kolejności logotypów i ostrzeżeniem
  o brakującym tekście alternatywnym.

## Instalacja

1. Pobierz `LimeControlBranding.zip`: <https://limecontrol.eu/szablony.html#branding>.
2. *Konfiguracja → Wtyczki → Wgraj i zainstaluj* → wybierz plik ZIP → *Zainstaluj*.
3. Na liście wtyczek kliknij *Aktywuj* przy **LimeControlBranding**.

Wymagania: LimeSurvey 6.x lub 7.x. Najlepiej działa z motywami LimeControl (`lc_*`); w innych motywach
logotypy i stopka też się pojawią, ale kolor marki zmienia tylko motywy LimeControl.

## Ustawienia

**Domyślne dla wszystkich ankiet:** *Konfiguracja → Wtyczki* → kliknij **LimeControlBranding** na liście →
zakładka *Ustawienia*.
Pole „Gdzie działają ustawienia domyślne” decyduje, czy domyślny branding pojawia się tylko w ankietach z
motywem LimeControl (domyślnie), czy we wszystkich ankietach.

**W jednej ankiecie:** *Ustawienia ankiety → Proste wtyczki → LimeControlBranding*. Pole „Branding w tej
ankiecie”:

| Wartość | Działanie |
| --- | --- |
| Domyślny | ankieta używa ustawień z konfiguracji wtyczki |
| Własny dla tej ankiety | ankieta ma własne logotypy, stopkę i kolor — w każdym motywie |
| Wyłączony | wtyczka nic nie dodaje do tej ankiety (nie ładuje nawet swoich plików) |

Formularz ankiety jest wstępnie wypełniony wartościami domyślnymi, więc wystarczy zmienić to, co ma być inne,
i wybrać „Własny dla tej ankiety”.

### Ankiety wielojęzyczne

Teksty (tekst alternatywny, nagłówek i tekst stopki, tekst linku) mogą mieć wersje językowe:

```text
[pl] Partnerzy badania [en] Research partners [de] Projektpartner
```

Respondent widzi wersję w języku ankiety. Gdy brakuje danego języka, wtyczka pokazuje tekst bez znacznika,
potem wersję angielską, a na końcu pierwszą podaną.

### Gdzie trafiają obrazy

- Wgrane w konfiguracji wtyczki: `upload/themes/survey/generalfiles/`.
- Wgrane w ustawieniach ankiety: `upload/surveys/<ID ankiety>/images/` (pliki ankiety, jak obrazy w pytaniach).
- Nazwy plików: `lc-logo-<losowy identyfikator>.<rozszerzenie>`.

Zamiast wgrywać plik, można wpisać adres obrazu (`https://…` albo ścieżkę od katalogu głównego, `/upload/…`).

## Dobre praktyki

- Logo w PNG z przezroczystym tłem, wysokość co najmniej 2× wyświetlanej (np. 120 px dla „Dużej”).
- Zawsze uzupełniaj tekst alternatywny — nazwę organizacji z logo. Bez niego wtyczka użyje tytułu ankiety.
- Logotypy funduszy UE: styl stopki „Biała karta”, wysokość „Duża”.
- Linki z logotypów otwierają się w nowej karcie (czytniki ekranu słyszą o tym komunikat), więc respondent nie
  traci ankiety.

## Ograniczenia

- Ustawienia wtyczek nie są częścią eksportu ankiety (`.lss`, `.lsa`). Po skopiowaniu lub imporcie ankiety
  ustaw branding ponownie albo zostaw „Domyślny”.
- SVG nie jest przyjmowany (może zawierać skrypty) — użyj PNG lub WebP.
- Przetestowano na LimeSurvey 6.15.12 z motywami LimeControl 1.2.0. Wtyczka korzysta wyłącznie z publicznego
  API wtyczek, dostępnego także w 7.x.

## Bezpieczeństwo i prywatność

- Wgrywanie obrazów: tylko dla zalogowanych użytkowników z uprawnieniem do zmiany ustawień ankiety (albo
  ustawień globalnych), z tokenem CSRF. Typ pliku jest sprawdzany po zawartości (nie tylko po rozszerzeniu):
  PNG, JPG, GIF, WebP, do 2 MB i 6000 px na bok.
- Teksty są czyszczone z HTML; linki tylko `https://`, `http://`, `/…`, `mailto:` i `tel:`. Strona ankiety
  tworzy elementy przez DOM, bez `innerHTML`.
- Wtyczka nie wysyła żadnych zapytań do zewnętrznych serwerów, nie ustawia ciasteczek i nie zapisuje niczego
  o respondentach.

## Licencja

GPL-2.0-or-later, jak LimeSurvey. © LimeControl / strefabadan.pl. „LimeSurvey” jest znakiem towarowym
LimeSurvey GmbH; LimeControl nie jest powiązany z LimeSurvey GmbH.

---

# LimeControlBranding (English)

Logos in the survey header and footer, a partner logo strip, footer text and a brand colour for the
LimeControl survey themes on LimeSurvey 6.x and 7.x. No Twig template editing, no code.

## What it does

- **Header:** your organisation's logo and an optional second logo (client, partner, sponsor). Three heights,
  three layouts, and an optional white plate behind logos on a dark or coloured header. The survey menu stays
  where it is.
- **Footer:** a heading (e.g. "Co-funded by the European Union"), up to 12 logos (e.g. an EU funding logo
  strip), text (data controller, contact, project number) and one link (e.g. a privacy policy). Three styles:
  a card like the questions, a white card (also in dark themes), or no background.
- **Brand colour:** replaces the accent colour of a LimeControl theme. If the colour has too little contrast,
  the plugin darkens or lightens it to the WCAG 2.2 AA thresholds (4.5:1 for text) — including in the dark
  Midnight theme. Optionally, the header uses the exact brand colour and the text colour is picked
  automatically.
- **Image uploads straight from the settings form**, with previews, logo reordering and a warning when
  alternative text is missing.

## Installation

1. Download `LimeControlBranding.zip`: <https://limecontrol.eu/en/themes.html#branding>.
2. *Configuration → Plugins → Upload & install* → choose the ZIP file → *Install*.
3. In the plugin list, click *Activate* next to **LimeControlBranding**.

Requirements: LimeSurvey 6.x or 7.x. It works best with the LimeControl themes (`lc_*`). Other themes still
show the logos and the footer, but the brand colour changes LimeControl themes only.

## Settings

**Defaults for all surveys:** *Configuration → Plugins* → click **LimeControlBranding** in the list → the
*Settings* tab. "Where the defaults
apply" decides whether the default branding appears only in surveys that use a LimeControl theme (the
default) or in every survey.

**For one survey:** *Survey settings → Simple plugins → LimeControlBranding*. "Branding in this survey":

| Value | Effect |
| --- | --- |
| Default | the survey uses the plugin configuration |
| Own for this survey | the survey has its own logos, footer and colour — in any theme |
| Off | the plugin adds nothing to this survey (it does not even load its files) |

The survey form is pre-filled with the defaults, so change only what should differ and choose "Own for this
survey".

### Multilingual surveys

Texts (alternative text, footer heading and text, link text) can carry language versions:

```text
[pl] Partnerzy badania [en] Research partners [de] Projektpartner
```

Respondents see the version in the survey language. If that language is missing, the plugin shows the
untagged text, then English, then the first version given.

### Where images are stored

- Uploaded in the plugin configuration: `upload/themes/survey/generalfiles/`.
- Uploaded in survey settings: `upload/surveys/<survey ID>/images/` (survey files, like images in questions).
- File names: `lc-logo-<random id>.<extension>`.

Instead of uploading, you can type an image address (`https://…` or a root-relative path, `/upload/…`).

## Good practice

- Use a PNG logo with a transparent background, at least twice the displayed height (e.g. 120 px for
  "Large").
- Always fill in the alternative text with the organisation's name. Without it, the plugin uses the survey
  title.
- EU funding logos: footer style "A white card", height "Large".
- Logo links open in a new tab (screen readers announce it), so respondents don't lose the survey.

## Limitations

- Plugin settings are not part of a survey export (`.lss`, `.lsa`). After copying or importing a survey, set
  the branding again or leave it on "Default".
- SVG is not accepted (it can contain scripts) — use PNG or WebP.
- Tested on LimeSurvey 6.15.12 with LimeControl themes 1.2.0. The plugin uses only the public plugin API,
  which LimeSurvey 7.x also provides.

## Security and privacy

- Image uploads: only for signed-in users allowed to change the survey settings (or the global settings),
  with a CSRF token. The file type is checked by content, not just the extension: PNG, JPG, GIF, WebP, up to
  2 MB and 6000 px per side.
- Texts are stripped of HTML; links accept only `https://`, `http://`, `/…`, `mailto:` and `tel:`. The survey
  page builds elements through the DOM, without `innerHTML`.
- The plugin makes no requests to external servers, sets no cookies and stores nothing about respondents.

## Licence

GPL-2.0-or-later, like LimeSurvey. © LimeControl / strefabadan.pl. "LimeSurvey" is a trademark of
LimeSurvey GmbH; LimeControl is not affiliated with LimeSurvey GmbH.
