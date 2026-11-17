# limecontrol.eu — strona produktowa

Statyczna strona (HTML + CSS + odrobina JS, bez builda) z opisem funkcji i dokumentacją LimeControl.

```
site/
├── index.html      # strona główna: funkcje, jak to działa, bezpieczeństwo, FAQ
├── docs.html       # dokumentacja (konfiguracja LimeSurvey, CORS, funkcje, API)
├── assets/         # style.css, site.js, logo (kopie z public/brand)
├── favicon.svg, apple-touch-icon.png, robots.txt, sitemap.xml
```

## Adres aplikacji

Przyciski „Otwórz aplikację” prowadzą do `https://app.limecontrol.eu`.
Aby zmienić adres, podmień go we wszystkich plikach:

```bash
grep -rl "app.limecontrol.eu" site | xargs sed -i '' 's|app.limecontrol.eu|NOWY-ADRES|g'
```

## Podgląd lokalny

```bash
python3 -m http.server 4321 --directory site
```

## Publikacja

Wgraj zawartość katalogu `site/` na dowolny hosting statyczny i skieruj na niego domenę `limecontrol.eu`
(np. Firebase Hosting, Cloudflare Pages, Netlify, GitHub Pages lub zwykły serwer WWW).
Aplikację (Express + PWA) wdróż osobno pod `app.limecontrol.eu`.

Logo w `assets/` to kopie plików z `public/brand/` — po zmianie brandu skopiuj je ponownie.
