# Aplikacja mobilna LimeControl (iOS i Android)

🇬🇧 [English version](README.en.md)

Ta sama aplikacja co w przeglądarce, osadzona w natywnej powłoce [Capacitor 8](https://capacitorjs.com)
i przygotowana do publikacji w App Store oraz Google Play. Ten dokument opisuje budowanie, podpis
i wydanie — krok po kroku, razem z odpowiedziami do formularzy obu sklepów.

- Identyfikator aplikacji (Bundle ID / nazwa pakietu): `eu.limecontrol.app`
- iOS 15 lub nowszy, iPhone i iPad · Android 7.0 (API 24) lub nowszy, docelowe API 36
- Języki: polski i angielski (interfejs, opisy w sklepach, zrzuty ekranu)

## Czym różni się od wersji przeglądarkowej

| | Przeglądarka / PWA | Aplikacja mobilna |
|---|---|---|
| Konto | konto Google (usługa) lub klucz dostępu (własna instalacja) | brak — bez rejestracji i logowania |
| Profile serwerów | w chmurze lub w przeglądarce | tylko na urządzeniu (natywna pamięć aplikacji), bez haseł |
| Połączenie z serwerem ankiet | bezpośrednie (wymaga CORS) albo przez przekaźnik | bezpośrednie przez natywną warstwę sieciową — bez CORS i bez przekaźnika |
| Harmonogram | serwer LimeControl | po połączeniu z własnym serwerem LimeControl (opcjonalnie) |
| Eksport i udostępnianie | pobieranie pliku | systemowe okno udostępniania |
| Motyw jasny / ciemny | przełącznik w nagłówku | motyw systemu, dopóki nie wybierzesz własnego |

Paczkę dla aplikacji mobilnej buduje `VITE_PLATFORM=native` — bez Firebase, bez service workera
i bez czcionek pobieranych z internetu.

## Układ katalogów

```
capacitor.config.ts        konfiguracja Capacitora (w katalogu głównym repozytorium)
mobile/
  ios/                     projekt Xcode (App/App.xcodeproj, zależności przez Swift Package Manager)
  android/                 projekt Gradle
  assets/                  źródła ikon, ekranu startowego i grafiki Google Play (SVG → PNG)
  scripts/sync-version.mjs wersja z package.json → projekty natywne
  store/                   dane demo, zrzuty ekranu, notatki dla recenzentów
  fastlane/                opisy do sklepów (PL/EN) i polecenia wysyłki
```

## Wymagania

- Node.js 22 lub nowszy i zależności projektu (`npm install` albo `bun install`).
- **iOS:** macOS z Xcode (sprawdzone na Xcode 27.2; Capacitor 8 wymaga co najmniej Xcode 26).
- **Android:** Android SDK z platformą 36 oraz **JDK 21** — z nowszym JDK Gradle zgłasza błąd
  „Unsupported class file major version”. Ustaw `JAVA_HOME` na JDK 21.
- Opcjonalnie: [fastlane](https://fastlane.tools) (wysyłka do sklepów), Python 3 z biblioteką Pillow
  (ikony), Playwright i Chrome (zrzuty ekranu, rendering grafik).

## Budowanie i uruchamianie

```bash
npm run build:mobile
```

Polecenie synchronizuje numer wersji, buduje paczkę do `dist-mobile/` i kopiuje ją do obu projektów
natywnych (`cap sync`). Uruchamiaj je po każdej zmianie w `src/`.

**iOS — symulator**

```bash
xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath mobile/build/ios build
```

```bash
xcrun simctl install booted mobile/build/ios/Build/Products/Debug-iphonesimulator/App.app
```

```bash
xcrun simctl launch booted eu.limecontrol.app
```

Wygodniej: `npx cap open ios` otwiera projekt w Xcode, gdzie wybierasz urządzenie i klikasz Run.

**Android — emulator lub telefon**

```bash
cd mobile/android && ./gradlew assembleDebug
```

```bash
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

Wersja `debug` pozwala łączyć się z serwerami testowymi przez `http://`. Wersja wydania na Androidzie
wymaga HTTPS; na iOS nieszyfrowane połączenie jest dozwolone tylko z adresami w sieci lokalnej.

## Wersja i numer builda

- **Wersja** widoczna w sklepach to `version` z `package.json`. `npm run build:mobile` przenosi ją
  do `MARKETING_VERSION` (iOS) i `versionName` (Android).
- **Numer builda** musi rosnąć przy każdej paczce wysyłanej do sklepu:
  - iOS: `CURRENT_PROJECT_VERSION` — w Xcode (cel App → General → Build) albo zmienna
    `LIMECONTROL_BUILD` w poleceniach fastlane,
  - Android: `./gradlew bundleRelease -PlimecontrolVersionCode=2` albo `LIMECONTROL_BUILD`.

## Ikony, ekran startowy i grafiki sklepów

Źródłami są pliki SVG w `mobile/assets/`. Po ich zmianie:

```bash
node mobile/assets/render.mjs
```

```bash
python3 mobile/assets/generate.py
```

Pierwsze polecenie renderuje SVG do PNG (wymaga Playwrighta; ścieżkę do niego podasz opcją
`--playwright`). Drugie generuje ikony i ekrany startowe iOS oraz Androida, a także ikonę 512 px
i grafikę główną 1024×500 do wizytówki w Google Play.

## Instancja demonstracyjna dla recenzentów

Aplikacja nie ma własnych kont, więc recenzenci App Store i Google Play potrzebują **publicznie
dostępnego serwera demonstracyjnego**: instalacji LimeSurvey z HTTPS, włączonym interfejsem JSON-RPC
i osobnym kontem tylko do tego celu. Serwer musi działać także po publikacji — każda aktualizacja
jest sprawdzana ponownie.

Dane demonstracyjne (pięć ankiet z szablonów, fikcyjne odpowiedzi i uczestnicy `@example.com`):

```bash
LS_URL=https://demo.example.com LS_USER=recenzent LS_PASSWORD='…' node mobile/store/seed-demo.mjs --lang en --reset
```

> ⚠️ `--reset` **usuwa wszystkie ankiety** na wskazanej instancji. Używaj wyłącznie na instancji
> przeznaczonej na demo.

Recenzent może zmienić lub usunąć dane, dlatego warto odtwarzać je cyklicznie (np. zadaniem cron).
Gotowy tekst dla recenzentów jest w [`store/review-notes.md`](store/review-notes.md).

## Zrzuty ekranu

```bash
SHOTS_PL_ENDPOINT='https://demo-pl.example.com/index.php/admin/remotecontrol' SHOTS_EN_ENDPOINT='https://demo-en.example.com/index.php/admin/remotecontrol' LS_USER=recenzent LS_PASSWORD='…' node mobile/store/screenshots.mjs
```

Skrypt otwiera paczkę `dist-mobile/` w Chrome w rozmiarach wymaganych przez sklepy i zapisuje
zrzuty w układzie fastlane — po polsku i po angielsku:

| Sklep | Urządzenie | Rozmiar | Katalog |
|---|---|---|---|
| App Store | iPhone 6,9″ | 1320×2868 | `fastlane/screenshots/<pl\|en-US>/` |
| App Store | iPad 13″ | 2064×2752 | `fastlane/screenshots/<pl\|en-US>/` |
| Google Play | telefon | 1080×1920 | `fastlane/metadata/android/<pl-PL\|en-US>/images/phoneScreenshots/` |
| Google Play | tablet 7″ | 1920×1080 | `…/images/sevenInchScreenshots/` |
| Google Play | tablet 10″ | 2560×1440 | `…/images/tenInchScreenshots/` |

Adres instancji jest na zrzutach zastępowany adresem przykładowym. Zrzuty nie są przechowywane
w repozytorium (`.gitignore`) — odtworzysz je tym poleceniem. Tytuły ankiet po polsku i po angielsku
wymagają dwóch instancji albo jednej, zasilanej i fotografowanej po kolei: `seed-demo.mjs --lang pl`
i `screenshots.mjs --lang pl`, a potem to samo z `--lang en`. Opcja `--only` ogranicza przebieg do
wybranych urządzeń (np. `--only ios-phone,ios-tablet`).

## Podpis wydania

**iOS.** Projekt używa podpisu automatycznego. Zespół (Team) wybierasz w Xcode (cel App → Signing
& Capabilities) albo podajesz w zmiennej `APPLE_TEAM_ID` dla fastlane. Identyfikatora zespołu nie
trzeba zapisywać w repozytorium.

**Android.** Wygeneruj klucz wysyłania (upload key) i zachowaj jego kopię zapasową — bez niego nie
wyślesz aktualizacji:

```bash
keytool -genkeypair -v -keystore ~/klucze/limecontrol-upload.jks -alias limecontrol-upload -keyalg RSA -keysize 2048 -validity 10000
```

Następnie utwórz `mobile/android/keystore.properties` (plik jest w `.gitignore`):

```properties
storeFile=/pełna/ścieżka/do/limecontrol-upload.jks
storePassword=…
keyAlias=limecontrol-upload
keyPassword=…
```

Bez tego pliku `bundleRelease` buduje paczkę niepodpisaną, której Google Play nie przyjmie.
Właściwy klucz podpisu aplikacji przechowuje Google (Play App Signing).

## Wydanie w App Store

1. **Konto.** Członkostwo w Apple Developer Program. Dla dystrybucji w UE uzupełnij w App Store
   Connect status przedsiębiorcy (akt o usługach cyfrowych, DSA) — bez niego aplikacja nie będzie
   dostępna w krajach UE.
2. **Identyfikator.** W portalu deweloperskim zarejestruj App ID `eu.limecontrol.app`.
3. **Rekord aplikacji.** App Store Connect → Apps → New App: platforma iOS, nazwa `LimeControl`,
   Bundle ID jak wyżej. Jako język podstawowy wybierz angielski (USA) i dodaj polski — wizytówka
   w języku podstawowym trafia do wszystkich krajów bez własnego tłumaczenia.
4. **Klucz API.** Users and Access → Integrations → App Store Connect API. Rola *Admin* pozwala
   na automatyczny podpis; do samej wysyłki opisów wystarczy *App Manager*. Plik `.p8` trzymaj poza
   repozytorium.
5. **Opisy i zrzuty ekranu:**

   ```bash
   cd mobile && ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=~/klucze/AuthKey.p8 fastlane ios metadata
   ```

6. **Build do TestFlight:**

   ```bash
   cd mobile && ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=~/klucze/AuthKey.p8 APPLE_TEAM_ID=… LIMECONTROL_BUILD=1 fastlane ios beta
   ```

   Albo ręcznie: `npm run build:mobile`, potem w Xcode Product → Archive → Distribute App →
   App Store Connect.
7. **Formularze w App Store Connect** — patrz [odpowiedzi poniżej](#odpowiedzi-do-formularzy-sklepów):
   App Privacy, klasyfikacja wiekowa, cena (bezpłatna) i dostępność, App Review Information
   (konto demo i notatki z [`store/review-notes.md`](store/review-notes.md)).
8. **Test na prawdziwym urządzeniu** przez TestFlight, a potem **Submit for Review** — ręcznie.

## Wydanie w Google Play

1. **Konto.** Google Play Console z zakończoną weryfikacją tożsamości. Konto osobiste założone po
   13 listopada 2023 r. musi przed publikacją produkcyjną przeprowadzić test zamknięty (co najmniej
   12 testerów przez 14 dni) — aktualny wymóg pokazuje konsola. Konto firmowe wymaga numeru D-U-N-S.
2. **Aplikacja.** Create app: nazwa `LimeControl`, typ *App*, *Free*. Jako język domyślny wybierz
   angielski (USA) i dodaj tłumaczenie polskie.
3. **Podpis.** Przygotuj klucz wysyłania i `keystore.properties` ([Podpis wydania](#podpis-wydania)).
4. **Pierwsza paczka — ręcznie.** Interfejs API Google Play działa dopiero po ręcznym przesłaniu
   pierwszej paczki:

   ```bash
   npm run build:mobile && cd mobile/android && ./gradlew bundleRelease -PlimecontrolVersionCode=1
   ```

   Prześlij `mobile/android/app/build/outputs/bundle/release/app-release.aab` w konsoli: Testing →
   Internal testing → Create new release, i włącz Play App Signing.
5. **Konto usługi.** W Google Cloud utwórz konto usługi z kluczem JSON, włącz „Google Play Android
   Developer API” i zaproś konto w Play Console (Users and permissions). Plik JSON trzymaj poza
   repozytorium.
6. **Opisy, grafiki i zrzuty ekranu:**

   ```bash
   cd mobile && SUPPLY_JSON_KEY=~/klucze/play.json fastlane android metadata
   ```

7. **Kolejne paczki:**

   ```bash
   cd mobile && SUPPLY_JSON_KEY=~/klucze/play.json LIMECONTROL_BUILD=2 fastlane android internal
   ```

   Paczka trafia jako wersja robocza na ścieżkę testów wewnętrznych.
8. **Formularze „Zawartość aplikacji”** — patrz [odpowiedzi poniżej](#odpowiedzi-do-formularzy-sklepów).
9. **Test, promocja do produkcji i wysyłka do recenzji** — ręcznie w konsoli.

Polecenia fastlane niczego nie publikują użytkownikom i nie wysyłają aplikacji do recenzji.

## Odpowiedzi do formularzy sklepów

Propozycje wynikające z tego, jak działa aplikacja. Oświadczenia składa wydawca — przeczytaj
definicje w formularzu, zanim je potwierdzisz.

| Formularz | Odpowiedź | Uzasadnienie |
|---|---|---|
| App Store: App Privacy | **Data Not Collected** | Wydawca nie otrzymuje żadnych danych: brak kont, analityki i reklam. Aplikacja łączy się wyłącznie z serwerem podanym przez użytkownika. |
| Google Play: Data safety | Nie zbiera i nie udostępnia danych | Jak wyżej. Dane logowania trafiają tylko do serwera użytkownika, na jego żądanie; wydawca nie ma do nich dostępu. |
| Polityka prywatności | `https://limecontrol.eu/prywatnosc.html` · `https://limecontrol.eu/en/privacy.html` | Link jest też w stopce aplikacji. |
| Szyfrowanie (App Store) | Brak własnej kryptografii | `ITSAppUsesNonExemptEncryption = false` w `Info.plist`; aplikacja używa wyłącznie HTTPS systemu. |
| Klasyfikacja wiekowa | Najniższa (wszystkie odpowiedzi „nie”) | Brak treści wrażliwych, czatu, treści użytkowników, hazardu i przeglądarki. |
| Grupa docelowa (Google Play) | 18 lat i więcej | Narzędzie zawodowe; nie jest kierowane do dzieci. |
| Reklamy | Nie | — |
| Zakupy w aplikacji | Nie | Aplikacja jest bezpłatna; nie sprzedaje i nie odblokowuje niczego. |
| Dostęp do aplikacji / konto demo | Wymaga logowania — podaj dane instancji demonstracyjnej | Tekst: [`store/review-notes.md`](store/review-notes.md). |
| Kategoria | Biznes (dodatkowa: Produktywność) | — |
| Uprawnienia (Android) | tylko `INTERNET` | Brak dostępu do lokalizacji, kontaktów, aparatu i plików. |

## Zasady sklepów uwzględnione w aplikacji

- **Znak towarowy.** Nazwa, podtytuł i słowa kluczowe nie zawierają słowa „LimeSurvey”. Opis używa
  go wyłącznie do wskazania zgodności i kończy się notą o niezależności od LimeSurvey GmbH; ta sama
  nota jest w stopce aplikacji.
- **Płatności.** Link „Postaw mi kawę” jest w aplikacji mobilnej ukryty, a karta StrefaAnkiet
  prowadzi do dokumentacji, nie do oferty — sklepy nie dopuszczają zewnętrznych płatności.
- **Prywatność.** Link do polityki prywatności w stopce, manifest prywatności iOS
  (`PrivacyInfo.xcprivacy`), brak kopii zapasowej danych aplikacji w chmurze na Androidzie.
- **Bezpieczeństwo.** Hasła do serwera nie są zapisywane; wydanie na Androida blokuje nieszyfrowane
  połączenia.
- **Opisy.** Opis w App Store nie wspomina o innych platformach.

## Stan weryfikacji

Sprawdzone lokalnie: uruchomienie i główne ścieżki w symulatorze iOS (iPhone, iOS 27.2) oraz
w emulatorze Androida 16 — połączenie z serwerem, lista i szczegóły ankiet, udostępnianie, eksport
CSV, import z biblioteki szablonów, przycisk „Wstecz”, motyw jasny i ciemny zgodny z systemem.
Konfiguracja `Release` kompiluje się na obu platformach (iOS bez podpisu, Android jako niepodpisany
plik AAB).

Jeszcze niesprawdzone:

- **Android z aktualnym WebView.** Emulator ma WebView 133, w którym Capacitor zostawia odstęp na
  paski systemu. Urządzenia z WebView 140 lub nowszym (czyli większość telefonów) rysują treść pod
  paskami systemu i korzystają z tych samych reguł CSS (`env(safe-area-inset-*)`) co iOS, gdzie
  zostały sprawdzone. Przed publikacją obejrzyj aplikację na fizycznym telefonie z Androidem.
- **To, co wymaga kont wydawcy:** podpisane buildy, test na fizycznych urządzeniach, polecenia
  fastlane na prawdziwych kontach (sprawdzono ich składnię, komunikaty o brakujących danych oraz
  zgodność nazw opcji, plików i rozmiarów zrzutów z fastlane 2.238) i sama recenzja w sklepach.
