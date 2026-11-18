# LimeControl — self-hosting

> 🇵🇱 [Wersja polska (README.md)](./README.md)

Run LimeControl on your own server, without a Google account and without Firebase. You sign in with an
**access key**, LimeSurvey instance profiles are stored in the browser, and the scheduler and relay run in your container.

| | The app.limecontrol.eu service | Self-hosted |
| --- | --- | --- |
| Sign-in | Google account | access key (`LIMECONTROL_ACCESS_KEY`) |
| Instance profiles | Cloud Firestore, synced across devices | browser storage (`localStorage`), no passwords |
| LimeSurvey passwords | only in the memory of the open tab | only in the memory of the open tab |
| Scheduler | the service's server | your container (queue in the `app-data` volume, passwords encrypted) |
| RPC relay | public addresses only | private networks too (`RELAY_ALLOW_PRIVATE=1`) |

## Requirements

- Docker Engine with the `docker compose` plugin.
- For anything beyond `localhost` — **HTTPS** (a reverse proxy with a certificate). Without HTTPS the browser will not
  install the PWA, and the access key and passwords would travel in clear text.

## Quick start

```bash
git clone https://github.com/lukasz5/LimeControl.git
cd LimeControl/deploy/selfhost
cp .env.example .env
# set your own key (at least 16 characters), e.g. the output of: openssl rand -base64 24
nano .env
docker compose up -d --build
```

The app is available at `http://127.0.0.1:8080`. If you leave `LIMECONTROL_ACCESS_KEY` empty, a key is generated on
first start — read it with `docker compose logs app`.

Then publish the app through your reverse proxy (nginx, Caddy, Traefik) with a TLS certificate.

## Next to limesurvey-stack (one server, shared Traefik)

If your LimeSurvey runs from [limesurvey-stack](https://github.com/lukasz5/limesurvey-stack), LimeControl can use the
same Traefik and Let's Encrypt certificates:

```bash
# in .env set LIMECONTROL_DOMAIN (its DNS record must point at the server) and STACK_NAME if you changed the default
docker compose -f compose.yaml -f compose.with-stack.yaml up -d --build
```

In LimeControl add the instance with the address `http://limesurvey:8080` and the **Server relay** connection mode.
Requests then stay inside the Docker network — they bypass the rate limit and the IP allow-list of the admin panel.

In LimeSurvey enable the JSON-RPC interface: *Configuration → Global settings → Interfaces → JSON-RPC*.
If *Force HTTPS* is switched on in the LimeSurvey global settings, the internal `http://` address is redirected —
use the public `https://` address of the instance instead (direct mode or relay).

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `AUTH_MODE` | `local` in this setup | `local` (access key) or `firebase` (requires `firebase-applet-config.json`) |
| `LIMECONTROL_ACCESS_KEY` | generated | sign-in key, at least 16 characters |
| `LIMECONTROL_SECRET` | the `data/secret.key` file | key material for encrypting scheduled-job passwords (AES-256-GCM) |
| `RELAY_ALLOW_PRIVATE` | `1` | whether the relay and scheduler may connect to private addresses and `localhost` |
| `PORT` | `8080` | listening port inside the container |
| `DATA_DIR` | `data` | data directory (scheduler queue, keys) |

## Security

- All `/api/*` endpoints except `/api/health` and `/api/config` require the access key; sign-in attempts are rate-limited.
- The relay and scheduler connect over HTTP/HTTPS only, do not follow redirects and pin the validated IP address
  (protection against SSRF and DNS rebinding). Set `RELAY_ALLOW_PRIVATE=0` if the app is reachable from the internet
  and LimeSurvey has a public address.
- Scheduled-job passwords are encrypted in the queue file and removed once the job has run.
- The container runs as the `node` user, with a read-only file system and no kernel capabilities (`cap_drop: ALL`).
- There is a single access key per installation — this mode is meant for one person or a trusted team.

## Updating and backup

```bash
git pull
docker compose up -d --build
```

Data (the scheduler queue and keys) lives in the `limecontrol_app-data` volume. Backup:

```bash
docker run --rm -v limecontrol_app-data:/data -v "$PWD":/backup alpine tar czf /backup/limecontrol-data.tgz -C /data .
```

Instance profiles are stored in the browser — they are not part of the server backup.

## Without Docker

```bash
npm install
VITE_AUTH_MODE=local npm run build
AUTH_MODE=local NODE_ENV=production PORT=8080 LIMECONTROL_ACCESS_KEY='…' npx tsx server.ts
```
