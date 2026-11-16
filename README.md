# LimeControl — LimeSurvey Mobile RC2

> 🇬🇧 [English version (README.en.md)](./README.en.md)

Mobilna aplikacja **Progressive Web App (PWA)** oraz **eksporter projektu React Native (Expo)** umożliwiające zarządzanie dowolną instancją **LimeSurvey** za pomocą oficjalnego interfejsu **RemoteControl 2 API** (`remotecontrol_handle` JSON-RPC).

Aplikacja pozwala łączyć się z wieloma serwerami LimeSurvey, aktywować i zamykać ankiety, planować automatyczne uruchamianie ankiet po stronie serwera, analizować statystyki na wykresach, zarządzać uczestnikami (tokenami) wraz z edycją szablonów wiadomości e-mail oraz eksportować wyniki.

---

## Najważniejsze funkcje

### 1. Połączenia z wieloma instancjami LimeSurvey
- Zapisywanie profili instancji lokalnie w urządzeniu (`localStorage`) z automatycznym uzupełnianiem ścieżki `/index.php/admin/remotecontrol`.
- Szybkie **wyszukiwanie i filtrowanie profili** po nazwie, adresie URL, endpoincie, loginie lub wtyczce oraz filtrowanie według trybu połączenia (`Wszystkie`, `Bezpośredni`, `Przekaźnik`).
- Obsługa własnych wtyczek uwierzytelniania (domyślnie `Authdb`) oraz opcjonalnego zapamiętywania hasła.
- Domyślne **bezpośrednie zapytania JSON-RPC** z przeglądarki, rejestr wywołań RPC z pomiarem czasu oraz diagnostyka błędów CORS wraz z opcjonalnym trybem przekaźnika serwerowego (`/api/rpc-relay`).

### 2. Ankiety, aktywacja i wizualizacja statystyk
- Przeglądanie, wyszukiwanie i filtrowanie ankiet (`Wszystkie`, `Aktywne`, `Nieaktywne`).
- Natychmiastowa aktywacja ankiety (`activate_survey`) z opcją równoczesnej inicjalizacji tabeli uczestników (`activate_tokens`).
- Zamykanie aktywnych ankiet oraz konfiguracja okna dostępności (`startdate` i `expires`) za pomocą `set_survey_properties`.
- Duplikowanie ankiet (`copy_survey`).
- Podsumowanie i **wizualizacja danych (`recharts`)** na podstawie `get_summary`: wykres liczby odpowiedzi (pełne, niepełne, łącznie) oraz statusu uczestników/tokenów (łącznie, wysłane, ukończone, oczekujące, wypisane).
- Eksport odpowiedzi (`export_responses`) z dekodowaniem Base64 do pobrania w formatach **CSV**, **Excel (.xls)** i **JSON** wraz z podglądem zawartości.

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
| **Statystyki i eksport** | `get_summary`, `export_responses` | Podsumowania odpowiedzi/tokenów, wykresy i pobieranie CSV/XLS/JSON |
| **Uczestnicy** | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` | Zarządzanie tabelą tokenów oraz wysyłka zaproszeń i przypomnień |
| **Szablony e-mail** | `get_language_properties`, `set_language_properties` | Odczyt, edycja i zapis tematów oraz treści wiadomości zaproszeń i przypomnień |

---

## Konfiguracja instancji LimeSurvey

Aby połączyć się z wybranym serwerem LimeSurvey:
1. Zaloguj się do panelu administratora LimeSurvey.
2. Przejdź do **Ustawienia globalne → Interfejsy**.
3. Włącz **Interfejs JSON-RPC** i zapisz ustawienia.
4. Jeśli łączysz się bezpośrednio z przeglądarki (PWA) z serwera na innej domenie, upewnij się, że serwer HTTP zwraca nagłówki CORS (`Access-Control-Allow-Origin`). W przeciwnym razie możesz przełączyć profil na tryb **Przekaźnik serwerowy** lub wyeksportować projekt **React Native (Expo)**.

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
