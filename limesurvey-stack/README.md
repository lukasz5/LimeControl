# LimeSurvey — stack Docker do szybkiego wdrożenia

Gotowy, zabezpieczony zestaw do uruchomienia LimeSurvey na serwerze Ubuntu z Dockerem:

| Usługa | Obraz | Rola |
| --- | --- | --- |
| `traefik` | `traefik:v3.7` | HTTPS, certyfikaty Let's Encrypt, nagłówki bezpieczeństwa, limity zapytań |
| `socket-proxy` | `tecnativa/docker-socket-proxy:v0.5.0` | dostęp Traefika do Docker API tylko do odczytu |
| `limesurvey` | budowany lokalnie (PHP 8.3 + Apache) | LimeSurvey 7.10.0, kod tylko do odczytu |
| `db` | `mariadb:11.4` (LTS) | baza danych, dostępna wyłącznie w sieci wewnętrznej |
| `backup` | `mariadb:11.4` | codzienny backup bazy, plików i kluczy szyfrowania |

## Wymagania

- Ubuntu 22.04/24.04 z Docker Engine i wtyczką `docker compose`.
- Wolne porty 80 i 443 na hoście (Traefik jest jedynym kontenerem z otwartymi portami).
- Rekord DNS A/AAAA domeny wskazujący na serwer — potrzebny do wydania certyfikatu.

## Instalacja

```bash
sudo ./install.sh --firewall
```

Skrypt:

1. sprawdza Dockera, porty i DNS domeny,
2. tworzy `.env` (pyta o domenę, e-mail dla Let's Encrypt i e-mail administratora),
3. generuje losowe hasła w `secrets/` (uprawnienia 600/640),
4. opcjonalnie (`--firewall`) włącza `ufw`: SSH, 80/tcp, 443/tcp,
5. buduje obraz, uruchamia stack i czeka, aż wszystkie usługi będą zdrowe.

Tryb nieinteraktywny:

```bash
sudo LS_DOMAIN=ankiety.example.com ACME_EMAIL=it@example.com ADMIN_EMAIL=it@example.com ./install.sh --firewall --yes
```

Hasło pierwszego administratora: `sudo cat secrets/admin_password`. Zmień je po pierwszym logowaniu.

Przy testach używaj stagingu Let's Encrypt (`ACME_CA_SERVER` w `.env`), żeby nie trafić w limity.

## Zabezpieczenia

**Sieć i TLS**
- Na zewnątrz wystawione są tylko porty 80 (przekierowanie na HTTPS) i 443.
- TLS 1.2+ z wyłącznie nowoczesnymi szyframi, HSTS, `sniStrict` (brak odpowiedzi na nieznane domeny).
- Baza i backup działają w sieci `internal` bez dostępu do internetu i bez portów na hoście.
- Traefik nie widzi `docker.sock` bezpośrednio — tylko filtrowane, tylko-do-odczytu API przez `socket-proxy`.
- Dashboard Traefika jest wyłączony.

**Panel administracyjny**
- Limit zapytań na `/admin` (20/s) i ostrzejszy na logowanie (10/min na IP), niezależnie od wbudowanej blokady LimeSurvey.
- `ADMIN_ALLOW_CIDRS` w `.env` ogranicza panel do wybranych adresów IP (domyślnie otwarty). Reguła obejmuje oba style adresów: `/index.php/admin/...` i `?r=admin/...` oraz REST API. Blokuje logowanie spoza listy. Pozostałe ekrany panelu w LimeSurvey 7 (np. `/index.php/dashboard`) i tak wymagają zalogowanej sesji.

**Kontenery**
- Wszystkie: `no-new-privileges`, limity pamięci, rotacja logów.
- LimeSurvey: użytkownik `www-data`, system plików tylko do odczytu, odebrane wszystkie uprawnienia jądra (`cap_drop: ALL`). Zapisywalne są tylko `upload/`, `tmp/` (tmpfs) i katalog z wygenerowaną konfiguracją.
- W `upload/` i `tmp/` PHP jest wyłączony — wgrany plik nie może zostać wykonany.
- PHP: wyłączone `exec`/`shell_exec`/`proc_open` itp., ciasteczka sesji `Secure`/`HttpOnly`/`SameSite=Lax`, ukryta wersja.
- Obraz LimeSurvey budowany z oficjalnego wydania na GitHubie, weryfikowany sumą SHA-256. Usunięte są pliki deweloperskie i dokumentacja.

**Sekrety**
- Hasła tylko w `secrets/` (docker secrets), nigdy w obrazie, etykietach ani zmiennych środowiskowych.
- `config.php` generowany przy każdym starcie z `.env` i sekretów.
- `security.php` (klucze szyfrowania odpowiedzi) tworzony raz i trzymany na wolumenie `state`. **Nigdy go nie zmieniaj** — bez niego zaszyfrowanych danych nie da się odczytać.

## Codzienna obsługa

```bash
docker compose ps                       # stan usług
docker compose logs -f limesurvey       # logi aplikacji
docker compose logs -f traefik          # logi dostępu (JSON) i certyfikatów
docker compose exec backup /bin/bash /opt/backup/backup.sh now   # backup na żądanie
```

### Aktualizacja LimeSurvey

1. Zrób backup na żądanie.
2. W `.env` ustaw nowy `LIMESURVEY_VERSION` (tag z https://github.com/LimeSurvey/LimeSurvey/tags) i `LIMESURVEY_SHA256`:
   ```bash
   curl -fsSL "https://github.com/LimeSurvey/LimeSurvey/archive/refs/tags/<TAG>.tar.gz" | sha256sum
   ```
3. Zbuduj i uruchom ponownie. Migracje bazy wykonują się automatycznie przy starcie (`updatedb`).
   ```bash
   docker compose build --pull limesurvey && docker compose up -d --wait
   ```

Aktualizacje Traefika i MariaDB: `docker compose pull && docker compose up -d --wait`. MariaDB ma włączone `MARIADB_AUTO_UPGRADE`.

### Backup

Usługa `backup` codziennie o `BACKUP_TIME` zapisuje do `backups/RRRRMMDD-GGMMSS/`:

- `database.sql.gz` — spójny zrzut (`--single-transaction`),
- `upload.tar.gz` — pliki wgrane przez użytkowników i motywy,
- `keys.tar.gz` — `security.php` z kluczami szyfrowania,
- `SHA256SUMS`.

Kopie starsze niż `BACKUP_KEEP_DAYS` są usuwane. **Kopiuj katalog `backups/` poza serwer** (rsync, restic, S3) — backup na tym samym dysku nie chroni przed awarią serwera.

### Odtwarzanie

```bash
sudo ./scripts/restore.sh backups/20261117-031500
```

Skrypt sprawdza sumy kontrolne, pyta o potwierdzenie i zastępuje bazę, pliki i klucze. Jeśli kopia pochodzi ze starszej wersji LimeSurvey, schemat zostanie zmigrowany przy starcie. Pierwsze odtworzenie przećwicz na osobnej maszynie.

## Dostosowanie

- **Osadzanie ankiet w iframe na innej domenie:** w `traefik/dynamic/security.yml` usuń `customFrameOptionsValue`.
- **Indeksowanie ankiet przez wyszukiwarki:** usuń `X-Robots-Tag` z tego samego pliku.
- **Serwer za Cloudflare lub innym proxy:** dodaj w `compose.yaml` w Traefiku `--entrypoints.websecure.forwardedHeaders.trustedIPs=...`. Inaczej limity i lista IP zobaczą adres proxy zamiast klienta.
- **Poczta:** SMTP ustawia się w panelu LimeSurvey (Konfiguracja → Ustawienia globalne → E-mail).
- **Własne motywy:** wgrywa się je przez panel. Trafiają na wolumen `upload` i są objęte backupem.

## Zalecenia dla hosta Ubuntu

- `apt install unattended-upgrades` — automatyczne poprawki bezpieczeństwa.
- Logowanie SSH tylko kluczem (`PasswordAuthentication no`), opcjonalnie `fail2ban` dla SSH.
- `ufw` nie filtruje portów publikowanych przez Dockera. Tutaj publikuje je wyłącznie Traefik (80/443), więc to zamierzone.
