# limecontrol.eu — strona produktowa

Statyczna strona (HTML + CSS + odrobina JS) po polsku i angielsku. **Pliki `.html` w tym katalogu są
generowane** — nie edytuj ich ręcznie, tylko zmień źródła i zbuduj stronę ponownie.

> Strona nie jest częścią otwartego oprogramowania LimeControl — wszelkie prawa zastrzeżone
> (patrz [`site-src/LICENSE.md`](../site-src/LICENSE.md)). Paczki motywów i szablony ankiet w podkatalogach
> `pobierz/` zachowują własne licencje (GPL-2.0-or-later i CC0).

```bash
npm run build:site     # paczki motywów i szablonów + wszystkie podstrony → site/
npm run check:site     # linki wewnętrzne, kotwice, wersje językowe
```

| Podstrona | PL | EN | Źródło |
| --- | --- | --- | --- |
| Strona główna | `index.html` | `en/index.html` | `site-src/pages/home.<lang>.html` |
| Dokumentacja | `docs.html` | `en/docs.html` | `site-src/pages/docs.<lang>.html` |
| Wtyczki StrefaAnkiet | `wtyczki.html` | `en/plugins.html` | `site-src/pages/plugins.mjs` |
| Polityka prywatności | `prywatnosc.html` | `en/privacy.html` | `site-src/pages/privacy.<lang>.html` |
| Motywy ankiet | `szablony.html` | `en/themes.html` | `site-src/pages/themes.mjs` + dane z `limesurvey-themes/` |
| Szablony ankiet | `ankiety.html` | `en/templates.html` | `site-src/pages/templates.mjs` + dane z `survey-templates/` |

Pozostałe pliki:

```
site/
├── assets/            # style.css, site.js, logo (kopie z public/brand) — edytowane ręcznie
├── szablony/          # zrzuty i paczki ZIP motywów (generowane)
├── ankiety/           # pliki .lss, katalog i zrzuty szablonów ankiet (generowane)
├── sitemap.xml        # generowany, z wersjami językowymi (hreflang)
└── favicon.svg, apple-touch-icon.png, robots.txt
```

## Wspólny szkielet

Nagłówek, nawigacja, stopka, adresy podstron i przełącznik języka są w `site-src/chrome.mjs`, więc menu jest
identyczne na każdej podstronie. Tam też zmienisz adres aplikacji (`APP_URL`), repozytorium, dane kontaktowe,
adres publicznego wydania wtyczek (`PLUGINS_URL`) oraz linki do sklepów z aplikacją mobilną.

W plikach `site-src/pages/*.html` działają znaczniki `{{…}}`, np. `{{APP_URL}}`, `{{docs}}` (adres dokumentacji
w języku strony), `{{THEME_COUNT}}`, `{{TEMPLATE_COUNT}}`, `{{VERSION}}`. Nieznany znacznik przerywa budowanie.

Po zmianie `assets/style.css` lub `assets/site.js` podbij `ASSET_VERSION` w `site-src/chrome.mjs`
(pliki są cache'owane przez 7 dni).

## Nowa wersja językowa strony

Każda podstrona musi istnieć po polsku i angielsku — `npm run check:site` zgłosi brak odpowiednika,
niedziałający link albo kotwicę, której nie ma na stronie docelowej.

## Podgląd lokalny

```bash
python3 -m http.server 4321 --directory site
```

## Publikacja

Produkcyjnie stronę serwuje obraz z `deploy/site.Dockerfile` (nginx, konfiguracja w `deploy/nginx-site.conf`),
budowany i wdrażany przez GitHub Actions po zmianie gałęzi `main`. Katalog `site/` można też wgrać na dowolny
hosting statyczny; aplikację (Express + PWA) wdraża się osobno pod `app.limecontrol.eu`.

Logo w `assets/` to kopie plików z `public/brand/` — po zmianie brandu skopiuj je ponownie.
