# LimeControl

> 🇬🇧 [English version (README.en.md)](./README.en.md)

**Darmowe, otwarte narzędzia dla LimeSurvey**: aplikacja do zarządzania ankietami z telefonu, motywy WCAG,
szablony ankiet i gotowe wdrożenia.

[limecontrol.eu](https://limecontrol.eu) · [aplikacja](https://app.limecontrol.eu) ·
[dokumentacja](https://limecontrol.eu/docs.html) · [historia zmian](./CHANGELOG.md)

| Element | Co zawiera | Katalog |
| --- | --- | --- |
| **Aplikacja** | PWA (React + Express) dla API RemoteControl 2: ankiety, harmonogram, uczestnicy, statystyki, eksport | `src/`, `server.ts`, `server/` |
| **Motywy ankiet** | 16 motywów WCAG 2.2 AA dla LimeSurvey 6 i 7, w tym motywy ankietera CATI i CAPI, oraz wtyczka LimeControlBranding (logotypy w nagłówku i stopce) | [`limesurvey-themes/`](./limesurvey-themes/) |
| **Szablony ankiet** | 12 kwestionariuszy PL/EN w formacie `.lss`, w tym szkielety wywiadów CATI i CAPI | [`survey-templates/`](./survey-templates/) |
| **Wdrożenia** | LimeControl we własnym kontenerze Docker (bez Firebase) i wdrożenie usługi produkcyjnej | [`deploy/`](./deploy/) |
| **Aplikacja mobilna** | iOS i Android (Capacitor) — ta sama aplikacja bez konta i bez ograniczeń CORS | [`mobile/`](./mobile/) |

Zabezpieczony LimeSurvey 7 w Dockerze (Traefik, Let's Encrypt, kopie zapasowe) jest w osobnym repozytorium:
[limesurvey-stack](https://github.com/lukasz5/limesurvey-stack).

Katalogi `site/` i `site-src/` zawierają stronę limecontrol.eu. Budują się razem z projektem, ale **nie są
częścią otwartego oprogramowania** — patrz [Licencja](#licencja).

## Darmowe i płatne

| Bezpłatnie, z otwartym kodem | Płatne usługi |
| --- | --- |
| aplikacja LimeControl (przeglądarka, PWA, własny serwer, aplikacja mobilna) | konto platformy [StrefaAnkiet](https://strefaankiet.pl): zarządzana wysyłka przez Amazon SES, telefonia VoIP i serwer VoIP do wywiadów CATI, praca ankieterów w terenie, analizy i raporty |
| motywy i szablony ankiet | wdrożenie i utrzymanie serwera ankietowego (opartego na silniku LimeSurvey) — [strefabadan.pl](https://strefabadan.pl) |
| zestawy wdrożeniowe Docker | |
| wtyczki StrefaAnkiet dla LimeSurvey | |

Darmowe narzędzia nie wymagają żadnej z płatnych usług.

## Szybki start

**Usługa.** Otwórz [app.limecontrol.eu](https://app.limecontrol.eu), zaloguj się kontem Google i dodaj swoją
instancję LimeSurvey. W LimeSurvey musi być włączony interfejs JSON-RPC
(*Konfiguracja → Ustawienia globalne → Interfejsy*).

**Własny serwer.** Bez konta Google i bez usług zewnętrznych — logowanie kluczem dostępu:

```bash
git clone https://github.com/lukasz5/LimeControl.git
cd LimeControl/deploy/selfhost
cp .env.example .env    # ustaw LIMECONTROL_ACCESS_KEY (min. 16 znaków)
docker compose up -d --build
```

Szczegóły: [deploy/selfhost/README.md](./deploy/selfhost/README.md).

**Lokalnie (rozwój).**

```bash
npm install
npm run dev             # Express + Vite na http://localhost:3000
```

Bez pliku `firebase-applet-config.json` aplikacja startuje w trybie lokalnym, a klucz dostępu wypisuje w konsoli.

## Aplikacja

- **Wiele instancji LimeSurvey 3.x–7.x** — profile serwerów, tryb bezpośredni (przeglądarka → LimeSurvey) albo
  przekaźnik serwerowy dla serwerów bez nagłówków CORS, dziennik wywołań RPC z diagnostyką.
- **Ankiety** — aktywacja (także z tabelą uczestników), okno dostępności, zamykanie, kopiowanie.
- **Biblioteka szablonów** — import gotowego kwestionariusza do połączonej instancji (`import_survey`).
- **Link, kod QR i motyw** — publiczny adres ankiety, udostępnianie, kod QR generowany w przeglądarce,
  zmiana motywu ankiety z weryfikacją, czy motyw jest zainstalowany.
- **Tryb CAPI** — „Rozpocznij wywiad” i pętla wywiadów (po zakończeniu ankieta zaczyna kolejny, pusty wywiad).
- **Harmonogram po stronie serwera** — aktywacja, zamknięcie, wysyłka zaproszeń i cykliczne przypomnienia;
  działa także po zamknięciu aplikacji.
- **Uczestnicy i e-maile** — tabela tokenów, pola uczestnika z szablonu, edytor zaproszeń i przypomnień
  z podglądem, wysyłka z podsumowaniem wyniku.
- **Statystyki i eksport** — podsumowania na wykresach, porównanie dwóch ankiet, eksport CSV / XLS / JSON,
  inspektor kolumn (`get_fieldmap`, SGQA i LimeSurvey 7).
- **Łącznik StrefaAnkiet (beta)** — stan realizacji CATI/CAPI badania powiązanego z ankietą, tylko do odczytu.
- **PWA** — instalacja na ekranie głównym, wskaźnik trybu offline, interfejs po polsku i angielsku.

Pełny opis: [dokumentacja](https://limecontrol.eu/docs.html) ([English](https://limecontrol.eu/en/docs.html)).

### Dwa tryby logowania

| | Usługa (`firebase`) | Własna instalacja (`local`) |
| --- | --- | --- |
| Logowanie | konto Google (Firebase Authentication) | klucz dostępu (`LIMECONTROL_ACCESS_KEY`) |
| Profile instancji | Cloud Firestore | pamięć przeglądarki, bez haseł |
| Przekaźnik RPC | tylko adresy publiczne | także sieć prywatna (`RELAY_ALLOW_PRIVATE`) |
| Zależności zewnętrzne | Firebase | brak |

Tryb wybiera serwer: `AUTH_MODE=local|firebase`, a bez tej zmiennej — `firebase`, gdy istnieje plik
`firebase-applet-config.json`, w przeciwnym razie `local`. Hasła do LimeSurvey nie są zapisywane w żadnym trybie.

### Obsługiwane metody API (`remotecontrol_handle`)

| Obszar | Metody |
| --- | --- |
| Sesja | `get_session_key`, `release_session_key`, `get_site_settings` |
| Ankiety | `list_surveys`, `get_survey_properties`, `set_survey_properties`, `activate_survey`, `copy_survey`, `import_survey` |
| Statystyki i eksport | `get_summary`, `get_fieldmap`, `export_responses` |
| Uczestnicy | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` |
| Teksty ankiety | `get_language_properties`, `set_language_properties` |

## Motywy i szablony ankiet

- **Motywy** — Medical, Professional, Social, Marketing, Eco, Minimalist, CATI i CAPI oraz motywy z własną
  typografią: Editorial, Civic, Product, Studio, Logistics, Finance, Hospitality i ciemny Midnight. Motywy potomne
  `fruity_twentythree`, kontrast sprawdzany przy budowaniu, osobne paczki dla LimeSurvey 6.x i 7.x. Wtyczka
  [LimeControlBranding](./limesurvey-themes/plugin/LimeControlBranding/README.md) dodaje logotypy w nagłówku
  i stopce oraz kolor marki.
  Pobieranie: [limecontrol.eu/szablony.html](https://limecontrol.eu/szablony.html), źródła i opis budowania:
  [limesurvey-themes/README.md](./limesurvey-themes/README.md).
- **Szablony ankiet** — NPS, CSAT, zaangażowanie pracowników, exit interview, ewaluacja szkolenia, ocena
  wydarzenia i zajęć, satysfakcja pacjenta, SUS, test koncepcji produktu oraz szkielety wywiadów CATI i CAPI.
  Każdy po polsku i angielsku, z logiką warunkową i treściami e-maili.
  Pobieranie: [limecontrol.eu/ankiety.html](https://limecontrol.eu/ankiety.html), format źródeł:
  [survey-templates/README.md](./survey-templates/README.md).

## CATI, CAPI i StrefaAnkiet

Darmowe narzędzia przygotowują ankietę do pracy ankietera: motywy CATI (skróty klawiszowe) i CAPI (duże pola
dotykowe), szkielety wywiadów oraz pętla wywiadów w aplikacji. Przydziały ankieterów, kolejkę rozmów, telefonię
VoIP i kwoty między trybami zapewnia platforma [StrefaAnkiet](https://strefaankiet.pl). Z LimeSurvey łączą ją
**darmowe wtyczki StrefaAnkiet** (opis: [limecontrol.eu/wtyczki.html](https://limecontrol.eu/wtyczki.html));
płatne jest konto i usługi platformy. Wtyczki są rozwijane poza tym repozytorium, a LimeControl łączy się
z platformą wyłącznie do odczytu stanu realizacji.

## Rozwój

Wymagania: Node.js 22+ i npm (obraz Dockera buduje się w [Bun](https://bun.sh) na podstawie `bun.lock`).

```bash
npm run dev            # serwer deweloperski (Express + Vite)
npm run lint           # sprawdzenie typów TypeScript
npm test               # testy jednostkowe (node:test)
npm run build          # produkcyjna wersja PWA (dist/)
npm run build:mobile   # paczka aplikacji mobilnej (dist-mobile/) + synchronizacja projektów iOS i Android
npm run build:themes   # paczki motywów ankiet (ZIP)
npm run build:templates # pliki szablonów ankiet (.lss)
npm run build:site     # powyższe + podstrony limecontrol.eu → site/, public/szablony-ankiet/
npm run check:site     # linki, kotwice i wersje językowe wygenerowanej strony
```

Wygenerowane pliki (`site/`, `public/szablony-ankiet/`) są w repozytorium — po zmianie źródeł uruchom
`npm run build:site` i zatwierdź wynik. Pakowanie motywów wymaga polecenia `zip`.

| Katalog | Zawartość |
| --- | --- |
| `src/` | aplikacja React: `components/`, `services/` (klient RPC, szablony, łącznik), `backend/` (warstwa logowania), `i18n/` |
| `server.ts`, `server/` | serwer Express: harmonogram, przekaźnik, łącznik StrefaAnkiet, ochrona zapytań wychodzących |
| `tests/` | testy serwera i usług klienta |
| `limesurvey-themes/` | źródła motywów i generator paczek ZIP |
| `survey-templates/` | definicje szablonów (JSON) i generator plików `.lss` |
| `mobile/` | aplikacja mobilna: projekty iOS i Android, opisy i grafiki do sklepów, [instrukcja wydania](./mobile/README.md) |
| `deploy/` | wdrożenie produkcyjne i zestaw self-hosted |
| `site-src/`, `site/` | strona limecontrol.eu (poza licencją open source) |

Teksty interfejsu są kluczowane polskim brzmieniem (`t('…')`); tłumaczenia angielskie są w `src/i18n/en.ts`,
a test nie przejdzie, gdy tłumaczenia brakuje.

Budowanie, podpis i publikację aplikacji mobilnej w App Store i Google Play opisuje
[`mobile/README.md`](./mobile/README.md).

### Zmienne środowiskowe

| Zmienna | Gdzie | Opis |
| --- | --- | --- |
| `AUTH_MODE` | serwer | `local` albo `firebase` (domyślnie zależnie od pliku konfiguracji Firebase) |
| `LIMECONTROL_ACCESS_KEY` | serwer, tryb `local` | klucz logowania (min. 16 znaków); pusty = generowany do `data/access-key` |
| `LIMECONTROL_SECRET` | serwer | materiał klucza szyfrującego hasła zadań harmonogramu; pusty = plik `data/secret.key` |
| `RELAY_ALLOW_PRIVATE` | serwer | `1` pozwala przekaźnikowi i harmonogramowi łączyć się z adresami prywatnymi |
| `PORT`, `DATA_DIR` | serwer | port nasłuchu (domyślnie 3000) i katalog danych (`data`) |
| `VITE_AUTH_MODE` | budowanie | `local` buduje aplikację bez konfiguracji Firebase |
| `VITE_SUPPORT_URL`, `VITE_APP_STORE_URL`, `VITE_PLAY_STORE_URL` | budowanie | link wsparcia i linki do sklepów z aplikacją |

### Endpointy serwera

| Endpoint | Opis |
| --- | --- |
| `GET /api/health` | kontrola działania |
| `GET /api/config` | publiczna konfiguracja: tryb logowania, wersja |
| `POST /api/session` | sprawdzenie klucza dostępu lub tokenu |
| `GET` / `POST /api/schedules` | lista i dodawanie zadań harmonogramu |
| `POST /api/schedules/:id/run-now`, `PATCH /api/schedules/:id/cancel`, `DELETE /api/schedules/:id` | uruchomienie, anulowanie i usunięcie zadania |
| `POST /api/rpc-relay` | przekaźnik JSON-RPC do LimeSurvey |
| `POST /api/strefaankiet` | pośrednik tylko do odczytu dla łącznika StrefaAnkiet |

Wszystkie endpointy poza `/api/health` i `/api/config` wymagają zalogowania (token Firebase albo klucz dostępu).

## Bezpieczeństwo

- Hasła do LimeSurvey nie trafiają do bazy ani do `localStorage`; w kolejce harmonogramu są szyfrowane
  (AES-256-GCM) i usuwane po wykonaniu zadania.
- Przekaźnik i łącznik wymagają zalogowania, mają limity zapytań, łączą się tylko przez HTTP/HTTPS, nie
  podążają za przekierowaniami i przypinają sprawdzony adres IP (ochrona przed SSRF i podmianą DNS).
- Reguły Firestore (`firestore.rules`, opis w `security_spec.md`) pozwalają czytać profile wyłącznie właścicielowi.

Lukę zgłoś prywatnie — patrz [SECURITY.md](./SECURITY.md).

## Współpraca

Zgłoszenia błędów, pomysły i poprawki są mile widziane — po polsku lub angielsku. Zacznij od
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Licencja

- Aplikacja, serwer, aplikacja mobilna, motywy ankiet i zestawy wdrożeniowe: **GPL-2.0-or-later**
  ([LICENSE](./LICENSE)). Motywy dziedziczą po Fruity TwentyThree © LimeSurvey GmbH.
- Szablony ankiet (`survey-templates/`, pliki `.lss`): **CC0 1.0** ([survey-templates/LICENSE](./survey-templates/LICENSE)).
- Strona limecontrol.eu (`site/`, `site-src/`) oraz nazwa i logo LimeControl **nie są objęte licencją open
  source** — wszelkie prawa zastrzeżone ([site-src/LICENSE.md](./site-src/LICENSE.md)). Paczki motywów
  i szablony przechowywane w `site/` zachowują licencje podane wyżej.

LimeSurvey jest zastrzeżonym znakiem towarowym LimeSurvey GmbH. LimeControl oraz usługi strefabadan.pl są niezależnymi
projektami i nie są powiązane z LimeSurvey GmbH.
Rozwijane przez [strefabadan.pl](https://strefabadan.pl).
