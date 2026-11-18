# LimeControl — własna instalacja (self-hosting)

> 🇬🇧 [English version (README.en.md)](./README.en.md)

Uruchom LimeControl na własnym serwerze, bez konta Google i bez Firebase. Logujesz się **kluczem dostępu**,
profile instancji LimeSurvey są zapisywane w przeglądarce, a harmonogram i przekaźnik działają w Twoim kontenerze.

| | Usługa app.limecontrol.eu | Własna instalacja |
| --- | --- | --- |
| Logowanie | konto Google | klucz dostępu (`LIMECONTROL_ACCESS_KEY`) |
| Profile instancji | Cloud Firestore, synchronizowane między urządzeniami | pamięć przeglądarki (`localStorage`), bez haseł |
| Hasła LimeSurvey | tylko w pamięci otwartej karty | tylko w pamięci otwartej karty |
| Harmonogram | serwer usługi | Twój kontener (kolejka w wolumenie `app-data`, hasła zaszyfrowane) |
| Przekaźnik RPC | tylko publiczne adresy | także sieć prywatna (`RELAY_ALLOW_PRIVATE=1`) |

## Wymagania

- Docker Engine z wtyczką `docker compose`.
- Do pracy poza `localhost` — **HTTPS** (reverse proxy z certyfikatem). Bez HTTPS przeglądarka nie zainstaluje PWA,
  a klucz dostępu i hasła szłyby otwartym tekstem.

## Szybki start

```bash
git clone https://github.com/lukasz5/LimeControl.git
cd LimeControl/deploy/selfhost
cp .env.example .env
# wpisz własny klucz (min. 16 znaków), np. wynik polecenia: openssl rand -base64 24
nano .env
docker compose up -d --build
```

Aplikacja działa pod `http://127.0.0.1:8080`. Jeśli zostawisz `LIMECONTROL_ACCESS_KEY` puste, klucz zostanie
wygenerowany przy pierwszym starcie — odczytasz go poleceniem `docker compose logs app`.

Następnie wystaw aplikację przez swój reverse proxy (nginx, Caddy, Traefik) z certyfikatem TLS.

## Obok limesurvey-stack (jeden serwer, wspólny Traefik)

Jeśli LimeSurvey działa z zestawu [limesurvey-stack](https://github.com/lukasz5/limesurvey-stack), LimeControl może
korzystać z tego samego Traefika i certyfikatów Let's Encrypt:

```bash
# w .env ustaw LIMECONTROL_DOMAIN (rekord DNS musi wskazywać na serwer) i STACK_NAME, jeśli zmieniono domyślną nazwę
docker compose -f compose.yaml -f compose.with-stack.yaml up -d --build
```

W LimeControl dodaj instancję z adresem `http://limesurvey:8080` i trybem połączenia **Przekaźnik serwerowy**.
Zapytania zostają wtedy w sieci Dockera — nie przechodzą przez limit zapytań ani listę dozwolonych adresów IP
panelu administracyjnego.

W LimeSurvey włącz interfejs JSON-RPC: *Konfiguracja → Ustawienia globalne → Interfejsy → JSON-RPC*.
Jeśli w ustawieniach globalnych LimeSurvey włączono *Wymuś HTTPS*, wewnętrzny adres `http://` jest przekierowywany —
użyj wtedy publicznego adresu `https://` instancji (tryb bezpośredni albo przekaźnik).

## Zmienne środowiskowe

| Zmienna | Domyślnie | Opis |
| --- | --- | --- |
| `AUTH_MODE` | `local` w tym zestawie | `local` (klucz dostępu) albo `firebase` (wymaga pliku `firebase-applet-config.json`) |
| `LIMECONTROL_ACCESS_KEY` | generowany | klucz logowania, minimum 16 znaków |
| `LIMECONTROL_SECRET` | plik `data/secret.key` | materiał klucza do szyfrowania haseł zadań harmonogramu (AES-256-GCM) |
| `RELAY_ALLOW_PRIVATE` | `1` | czy przekaźnik i harmonogram mogą łączyć się z adresami prywatnymi i `localhost` |
| `PORT` | `8080` | port nasłuchu w kontenerze |
| `DATA_DIR` | `data` | katalog danych (kolejka harmonogramu, klucze) |

## Bezpieczeństwo

- Wszystkie endpointy `/api/*` poza `/api/health` i `/api/config` wymagają klucza dostępu; próby logowania są limitowane.
- Przekaźnik i harmonogram łączą się wyłącznie przez HTTP/HTTPS, nie śledzą przekierowań i przypinają sprawdzony adres IP
  (ochrona przed SSRF i podmianą DNS). Ustaw `RELAY_ALLOW_PRIVATE=0`, jeśli aplikacja jest dostępna z internetu,
  a LimeSurvey ma adres publiczny.
- Hasła zadań harmonogramu są szyfrowane w pliku kolejki i usuwane po wykonaniu zadania.
- Kontener działa jako użytkownik `node`, z systemem plików tylko do odczytu i bez uprawnień jądra (`cap_drop: ALL`).
- Klucz dostępu jest jeden dla całej instalacji — to tryb dla jednej osoby lub zaufanego zespołu.

## Aktualizacja i kopia zapasowa

```bash
git pull
docker compose up -d --build
```

Dane (kolejka harmonogramu i klucze) są w wolumenie `limecontrol_app-data`. Kopia:

```bash
docker run --rm -v limecontrol_app-data:/data -v "$PWD":/backup alpine tar czf /backup/limecontrol-data.tgz -C /data .
```

Profile instancji są w przeglądarce — nie ma ich w kopii serwera.

## Bez Dockera

```bash
npm install
VITE_AUTH_MODE=local npm run build
AUTH_MODE=local NODE_ENV=production PORT=8080 LIMECONTROL_ACCESS_KEY='…' npx tsx server.ts
```
