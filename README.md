# LimeControl — LimeSurvey Mobile RC2

> 🇬🇧 [English version (README.en.md)](./README.en.md)

Mobilna aplikacja **Progressive Web App (PWA)** oraz **eksporter projektu React Native (Expo)** umożliwiające zarządzanie dowolną instancją **LimeSurvey** za pomocą oficjalnego interfejsu **RemoteControl 2 API** (`remotecontrol_handle` JSON-RPC).

Aplikacja pozwala łączyć się z wieloma serwerami LimeSurvey, aktywować i zamykać ankiety, planować automatyczne uruchamianie ankiet po stronie serwera, analizować statystyki na wykresach, zarządzać uczestnikami (tokenami) wraz z edycją szablonów wiadomości e-mail oraz eksportować wyniki.

---

## Najważniejsze funkcje

### 1. Logowanie Google, Cloud Firestore i wiele instancji LimeSurvey
- **Logowanie przez Google (Firebase Auth)** przed dostępem do panelu oraz zapisywanie profili instancji w bazie **Cloud Firestore** zamiast w pamięci przeglądarki (`localStorage`).
- **Bezpieczeństwo haseł**: hasła do LimeSurvey nie są zapisywane w bazie ani w `localStorage` (opcjonalne zapamiętanie działa wyłącznie w pamięci aktywnej sesji).
- **Wsparcie LimeSurvey 3.x–7.x**: wybór wersji serwera (`Auto`, `LimeSurvey 7.x UTC`, `LimeSurvey 3–6`), obsługa nowych kodów błędów JSON-RPC z LS 7 oraz automatyczna konwersja dat (`startdate`/`expires`) do UTC.
- Szybkie **wyszukiwanie i filtrowanie profili** po nazwie, adresie URL, endpoincie, loginie lub wtyczce oraz filtrowanie według trybu połączenia (`Wszystkie`, `Bezpośredni`, `Przekaźnik`).
- Domyślne **bezpośrednie zapytania JSON-RPC** z przeglądarki, rejestr wywołań RPC z pomiarem czasu oraz diagnostyka błędów CORS wraz z opcjonalnym trybem przekaźnika serwerowego (`/api/rpc-relay`).

### 2. Ankiety, aktywacja, mapa pól i wizualizacja statystyk
- Przeglądanie, wyszukiwanie i filtrowanie ankiet (`Wszystkie`, `Aktywne`, `Nieaktywne`) z menu **Szybkie akcje** przy każdej pozycji.
- Natychmiastowa aktywacja ankiety (`activate_survey`) z opcją równoczesnej inicjalizacji tabeli uczestników (`activate_tokens`).
- Zamykanie aktywnych ankiet oraz konfiguracja okna dostępności (`startdate` i `expires`) za pomocą `set_survey_properties` (w tym konwersja UTC dla LimeSurvey 7).
- Duplikowanie ankiet (`copy_survey`).
- Podsumowanie, **wizualizacja danych (`recharts`)** oraz **zbiorczy wykres porównawczy dwóch ankiet** na podstawie `get_summary`.
- Eksport odpowiedzi (`export_responses`) w formatach **CSV**, **Excel (.xls)** i **JSON** wraz z inspektorem struktury pól **`get_fieldmap`** (obsługa zarówno SGQA, jak i nowych kodów pól LimeSurvey 7).

### 3. Serwerowy harmonogram aktywowania ankiet
- Planowanie automatycznego wywołania `activate_survey` na konkretny dzień i godzinę, nawet po zamknięciu aplikacji na telefonie.
- Cykliczny worker na serwerze Express (sprawdzanie co 15 sekund) wykonujący sekwencję: `get_session_key` → `activate_survey` → opcjonalnie `activate_tokens` i `set_survey_properties` (`expires`) → `release_session_key`.
- Trwała kolejka zadań zapisywana w `data/schedules.json`, szczegółowy log kroków RPC, opcja natychmiastowego uruchomienia testowego oraz automatyczne usuwanie hasła po wykonaniu zadania.

### 4. Uczestnicy, tokeny i edytor szablonów e-mail
- Inicjalizacja tabeli tokenów jednym kliknięciem (`activate_tokens`).
- Lista uczestników (`list_participants`) z filtrem tokenów niewykorzystanych oraz dodawaniem i usuwaniem respondentów (`add_participants`, `delete_participants`).
- **Edytor szablonów wiadomości e-mail** (`get_language_properties`, `set_language_properties`) dla zaproszeń i przypomnień z przełącznikiem języków ankiety, szybkim wstawianiem zmiennych (`{FIRSTNAME}`, `{LASTNAME}`, `{EMAIL}`, `{TOKEN}`, `{SURVEYURL}`, `{OPTOUTURL}`, `{SURVEYNAME}`), podglądem wiadomości z podstawionymi danymi oraz akcją zapisu i natychmiastowej wysyłki (`invite_participants`, `remind_participants`).

### 5. System powiadomień, PWA i eksport React Native
- **Powiadomienia wewnątrz aplikacji**: toasty informujące w czasie rzeczywistym o zakończeniu lub błędzie zaplanowanych zadań harmonogramu oraz o błędach komunikacji z API LimeSurvey.
- **PWA**: manifest aplikacji, ikony `192x192`, `512x512`, `maskable` oraz `apple-touch-icon.png`, obsługa trybu offline (`OfflineIndicator`) i przycisk instalacji w interfejsie (`PWAInstallButton`).
- **Eksporter React Native (Expo)**: generuje gotowy projekt TypeScript (`App.tsx`, klient `limeSurveyRpc.ts`, magazyn `AsyncStorage`, `package.json`, `app.json`) do pobrania jako archiwum ZIP — w aplikacji natywnej zapytania nie podlegają ograniczeniom CORS przeglądarki.

---

## Obsługiwane metody API LimeSurvey (`remotecontrol_handle`)

| Kategoria | Metody API | Zastosowanie w aplikacji |
| :--- | :--- | :--- |
| **Sesja i instancja** | `get_session_key`, `release_session_key`, `get_site_settings` | Logowanie, zamykanie sesji i odczyt nazwy instancji |
| **Ankiety i daty** | `list_surveys`, `get_survey_properties`, `set_survey_properties`, `activate_survey`, `copy_survey` | Lista ankiet, aktywacja, ustawianie `startdate`/`expires`, zamykanie i kopiowanie |
| **Statystyki i eksport** | `get_summary`, `get_fieldmap`, `export_responses` | Podsumowania odpowiedzi/tokenów, porównania na wykresach, mapa pól (SGQA / LS 7) i pobieranie CSV/XLS/JSON |
| **Uczestnicy** | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` | Zarządzanie tabelą tokenów oraz wysyłka zaproszeń i przypomnień |
| **Szablony e-mail** | `get_language_properties`, `set_language_properties` | Odczyt, edycja i zapis tematów oraz treści wiadomości zaproszeń i przypomnień |

---

## Konfiguracja instancji LimeSurvey

Aby połączyć aplikację **LimeControl** z własnym serwerem LimeSurvey (wersje **3.x / 5.x / 6.x / 7.x**):

### 1. Włączenie interfejsu RemoteControl 2 (JSON-RPC)
1. Zaloguj się do panelu administratora LimeSurvey jako superadministrator.
2. Przejdź do **Konfiguracja → Ustawienia globalne → Interfejsy** (*Configuration → Global settings → Interfaces*).
3. W opcji **Interfejs RPC** wybierz **JSON-RPC**.
4. Opcjonalnie ustaw **Publikuj interfejs API** zgodnie z polityką bezpieczeństwa (włączenie publikuje opis metod w przeglądarce; do samego działania RPC wystarczy włączenie JSON-RPC) i kliknij **Zapisz**.
5. Domyślny adres endpointu to:
   - `https://twoja-instancia.pl/index.php/admin/remotecontrol` (gdy włączone są przyjazne adresy URL), lub
   - `https://twoja-instancia.pl/index.php?r=admin/remotecontrol` (gdy przyjazne adresy URL są wyłączone).
   - W aplikacji wystarczy wpisać sam adres bazowy serwera (np. `https://twoja-instancia.pl`) — ścieżka `/index.php/admin/remotecontrol` zostanie uzupełniona automatycznie.

### 2. Uprawnienia konta użytkownika i wtyczka logowania
- Użytkownik podawany w profilu połączenia musi mieć uprawnienia w LimeSurvey do:
  - przeglądania, edycji, aktywowania i kopiowania ankiet (**Ankiety**: *View/Read*, *Update*, *Create*, *Activate*),
  - zarządzania tabelą tokenów i wysyłki zaproszeń (**Uczestnicy ankiety / Tokeny**),
  - eksportu wyników (**Odpowiedzi**: *Export*).
- W polu **Wtyczka uwierzytelniania** pozostaw domyślne `Authdb` dla standardowych kont LimeSurvey lub wpisz nazwę używanej wtyczki (np. `AuthLDAP`).

### 3. Wybór trybu połączenia (CORS i HTTPS)
- **Tryb bezpośredni (PWA w przeglądarce)**:
  - Gdy aplikacja działa pod adresem `https://...`, serwer LimeSurvey również musi być dostępny przez **HTTPS** (przeglądarki blokują tzw. *Mixed Content*).
  - Serwer HTTP obsługujący LimeSurvey musi zwracać nagłówki **CORS** dla domeny aplikacji (w tym odpowiedzi na żądania wstępne `OPTIONS`):
    ```apache
    # Przykład dla Apache (.htaccess lub VirtualHost)
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Accept"
    ```
    ```nginx
    # Przykład dla Nginx
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Accept" always;
    ```
- **Tryb przekaźnika serwerowego (`/api/rpc-relay`)**:
  - Jeśli nie masz dostępu do konfiguracji nagłówków CORS na serwerze LimeSurvey, w formularzu profilu w zakładce **Instancje** wybierz tryb **Przekaźnik serwerowy**. Zapytania JSON-RPC zostaną przekazane przez lokalny backend Express.
- **Aplikacja natywna React Native (Expo)**:
  - Wyeksportowany projekt mobilny uruchamiany na iOS/Androidzie nie podlega ograniczeniom CORS przeglądarki i łączy się bezpośrednio z każdym serwerem LimeSurvey.

### 4. Specyfika LimeSurvey 7.x
- W formularzu profilu wybierz wersję **LimeSurvey 7.x (daty UTC + nowe kody błędów)** — aplikacja automatycznie przeliczy daty `startdate`/`expires` oraz zadania harmonogramu do formatu **UTC**, obsłuży nowe kody błędów RemoteControl 2 i umożliwi podgląd nowej struktury pól przez `get_fieldmap`.
- W LimeSurvey 7.9+ możesz dodatkowo włączyć wbudowany rejestr wywołań API na serwerze w pliku `application/config/config.php`:
  ```php
  'config' => array(
      'rpc_log' => true,
  )
  ```
  Logi trafiają do `tmp/runtime/remotecontrol.log` z automatycznym maskowaniem haseł i kluczy sesji.

### 5. Weryfikacja połączenia w aplikacji
1. Zaloguj się w aplikacji przez Google, otwórz zakładkę **Instancje** i dodaj profil serwera.
2. Wpisz nazwę profilu, adres URL serwera LimeSurvey, login i hasło.
3. Kliknij **Połącz** — po poprawnym uwierzytelnieniu aplikacja pobierze nazwę instancji (`get_site_settings`) i załaduje listę ankiet. Ewentualne błędy sieciowe lub komunikaty serwera sprawdzisz w panelu **Log RPC**.

---

## Uruchomienie lokalne

### Wymagania
- Node.js 20+ (zalecane Node.js 22+)
- npm

### Instalacja i start

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera deweloperskiego (Express + Vite na porcie 3000)
npm run dev
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

### Pozostałe polecenia

```bash
# Sprawdzenie typów TypeScript
npm run lint

# Budowanie wersji produkcyjnej PWA (katalog dist/)
npm run build

# Uruchomienie w trybie produkcyjnym (NODE_ENV=production)
NODE_ENV=production npm start
```

---

## Endpointy serwera Express (`server.ts`)

- `GET /api/health` — kontrola działania serwera.
- `GET /api/schedules` — lista zaplanowanych i wykonanych zadań harmonogramu (bez zwracania haseł).
- `POST /api/schedules` — utworzenie nowego zadania automatycznej aktywacji ankiety.
- `POST /api/schedules/:id/run-now` — natychmiastowe uruchomienie zadania z kolejki.
- `PATCH /api/schedules/:id/cancel` — anulowanie zaplanowanego zadania.
- `DELETE /api/schedules/:id` — usunięcie wpisu z historii zadań.
- `POST /api/rpc-relay` — opcjonalny przekaźnik JSON-RPC dla serwerów LimeSurvey blokujących zapytania CORS z przeglądarki.
