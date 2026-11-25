# Plan rozwoju aplikacji mobilnej LimeControl

🇬🇧 [English version](ROADMAP.en.md)

Plan z 25 listopada 2026 r. Czasy są szacunkami dla jednej osoby i nie zakładają opóźnień przy recenzjach
w sklepach. Opis budowania i wydania: [README.md](README.md).

## Punkt wyjścia (wersja 1.1.0)

- **Technologia:** ta sama aplikacja React co w przeglądarce, osadzona w powłoce Capacitor 8
  (`VITE_PLATFORM=native`). Działa w trybie „na urządzeniu” (`src/backend/device.ts`): bez konta, profile
  serwerów są w Preferences, połączenia idą natywnie, bez CORS.
- **Wtyczki natywne:** app, filesystem, preferences, share, status-bar. Na Androidzie aplikacja ma tylko
  uprawnienie `INTERNET`.
- **Sklepy:** aplikacja jest w App Store i w Google Play. W sklepach zadeklarowano, że aplikacja nie zbiera
  danych („Data Not Collected”).
- **Największe braki:**
  - hasło trzeba wpisywać przy każdym połączeniu,
  - bez własnego serwera LimeControl nie działa harmonogram,
  - nie ma powiadomień,
  - wywiady CAPI wymagają stałego dostępu do sieci,
  - brakuje testów automatycznych na platformach natywnych,
  - nikt nie sprawdził aplikacji na fizycznym telefonie z Androidem (WebView 140+, rysowanie treści
    pod paskami systemu).

## Etap 0: stabilizacja (2–3 tygodnie)

1. **Fizyczne urządzenia.** Przejść ręcznie główne ścieżki na telefonie z Androidem (WebView 140+) i na
   iPadzie: odstępy przy krawędziach ekranu, klawiatura w formularzach, przycisk „Wstecz”.
2. **Raporty awarii bez SDK.** Regularnie przeglądać Xcode Organizer i Android Vitals. Bez Crashlytics
   i analityki, żeby deklaracja „Data Not Collected” pozostała prawdziwa.
3. **CI dla aplikacji mobilnej.** Akcja GitHub Actions, która przy każdym PR uruchamia `build:mobile`,
   `assembleDebug` i build `xcodebuild` dla symulatora.
4. **Testy E2E paczki `dist-mobile/`.** Playwright z emulacją urządzenia przeciw instancji demo, tym samym
   mechanizmem co `store/screenshots.mjs`.
5. **Instancja demo dla recenzentów.** Zadanie cron z `seed-demo.mjs --reset` i monitorowanie dostępności —
   awaria demo oznacza odrzuconą aktualizację.

## Wersja 1.2: wygoda (około 6 tygodni)

**Stan:** zrealizowana w kodzie 25 listopada 2026 r. (CHANGELOG 1.2.0). Pozostaje: Universal Links /
App Links dla adresów `https://limecontrol.eu/…` (wymagają identyfikatora zespołu Apple i odcisku klucza
podpisu Google Play), test na fizycznych urządzeniach i wydanie w sklepach.

| Funkcja | Opis | Uwagi |
|---|---|---|
| **Bezpieczne zapamiętanie hasła** | Opcjonalny zapis w Keychain (iOS) lub Keystore (Android), odblokowywany Face ID, Touch ID albo odciskiem palca | Hasło nie opuszcza urządzenia, więc deklaracje prywatności zostają bez zmian. Trzeba zmienić zdanie „hasła nie są zapisywane” w README, na stronie i w notatkach dla recenzentów. |
| **Dodawanie instancji kodem QR** | Wersja przeglądarkowa pokazuje kod z adresem i loginem (bez hasła), aplikacja go skanuje | Uprawnienie do aparatu — aktualizacja formularzy sklepów i tabeli uprawnień. |
| **Linki do aplikacji** | Link otwiera aplikację na konkretnej ankiecie albo z wypełnionym formularzem nowej instancji | Universal Links / App Links wymagają plików `apple-app-site-association` i `assetlinks.json` na stronie. |
| **Szybki podgląd** | Pociągnięcie w dół odświeża listę; ostatnia lista ankiet jest zapisana na urządzeniu na wypadek braku sieci | Uzupełnia istniejący wskaźnik trybu offline. |
| **Język niemiecki** | Interfejs i wizytówki w sklepach po niemiecku, tak jak strona `/de/` | Polski i angielski nadal obowiązkowe; niemiecki dochodzi jako trzeci. |
| **Układ na tablety** | Lista i szczegóły ankiety obok siebie na iPadzie i tabletach z Androidem | Zrzuty ekranu dla tabletów są już wymagane w sklepach. |

## Wersja 1.3: aplikacja informuje użytkownika (około 6–8 tygodni)

1. **Powiadomienia lokalne** bez serwera: „ankieta wygasa jutro”, „przypomnienie o wysyłce”, liczone na
   urządzeniu z dat ankiety.
2. **Odświeżanie w tle** (BackgroundFetch / WorkManager): kilka razy dziennie sprawdzenie liczby odpowiedzi
   i powiadomienie, np. „+12 odpowiedzi w NPS Q4”. System ogranicza zadania w tle, więc powiadomienia
   przychodzą z opóźnieniem i nie są gwarantowane — aplikacja musi to mówić.
3. **Widżety na ekranie głównym** (iOS WidgetKit, Android Glance): liczba odpowiedzi i stan realizacji
   wybranych ankiet. Pierwszy natywny kod pisany ręcznie.
4. **Harmonogram na urządzeniu:** proste zadania (aktywacja, zamknięcie) wykonywane przy odświeżaniu w tle,
   z zastrzeżeniem, że nie są dokładne co do minuty. Dokładny harmonogram nadal wymaga własnego serwera.
5. **Opcjonalne powiadomienia push** przez własny serwer LimeControl i wtyczkę w LimeSurvey („nowa
   odpowiedź”). Przekazywanie push przez `app.limecontrol.eu` zmienia deklaracje prywatności, więc na start
   tylko własny serwer.

## Wersja 2.0: praca w terenie, wywiady CAPI offline (kwartał, po badaniu technicznym)

- **Badanie techniczne (2 tygodnie):** czy da się wypełnić ankietę bez sieci. Do porównania:
  - **A)** formularz budowany na urządzeniu z definicji ankiety (`.lss` lub `get_fieldmap`) i późniejsza
    wysyłka przez `add_response` — wymaga własnego silnika warunków,
  - **B)** zapisany w pamięci podręcznej widok ankiety z LimeSurvey i przechwytywanie wysyłki odpowiedzi —
    bez serwera nie obsłuży ExpressionScript.
- **Kolejka synchronizacji:** szyfrowany magazyn odpowiedzi, ponawianie wysyłki, oznaczanie konfliktów,
  stan „X wywiadów czeka na wysłanie”.
- **Tryb ankietera:** blokada ekranu na ankiecie (Guided Access / tryb kiosku), opcjonalny zapis lokalizacji
  wywiadu — nowe uprawnienie i zmiana deklaracji prywatności.
- **Integracja ze StrefaAnkiet:** przydziały ankietera tylko do odczytu; żadnych zakupów ani linków do
  płatności w aplikacji.

## Prace przekrojowe

- **Wydania:** fastlane `beta` i `internal` uruchamiane z CI po tagu, wersja z `package.json`, wpisy
  w CHANGELOG i opisy zmian w sklepach po polsku i po angielsku.
- **Dostępność:** VoiceOver, TalkBack i powiększona czcionka systemowa, ten sam standard WCAG 2.2 AA co
  motywy ankiet.
- **Wydajność:** dzielenie paczki (wykresy i edytor e-maili ładowane przy pierwszym użyciu), pomiar czasu
  startu na słabszym telefonie z Androidem.
- **Nazewnictwo i zasady sklepów:** „dla LimeSurvey”, nigdy jako nazwa oferty. Przy każdej nowej funkcji
  sprawdzić tabelę „Odpowiedzi do formularzy sklepów” w [README.md](README.md).

## Decyzje do podjęcia

1. **Powiadomienia push:** tylko przez własny serwer czy także przez usługę `app.limecontrol.eu` (zmiana
   deklaracji prywatności).
2. **Kolejność:** czy wywiady CAPI offline mają wyprzedzić wersję 1.3, jeśli ważniejsi są klienci
   StrefaAnkiet niż samodzielni administratorzy LimeSurvey.
