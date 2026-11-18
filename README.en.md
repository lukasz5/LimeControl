# LimeControl

> 🇵🇱 [Wersja polska (README.md)](./README.md)

**Free, open-source tools for LimeSurvey**: an app for managing surveys from your phone, WCAG themes,
survey templates and ready-made deployments.

[limecontrol.eu](https://limecontrol.eu/en/) · [app](https://app.limecontrol.eu) ·
[documentation](https://limecontrol.eu/en/docs.html) · [changelog](./CHANGELOG.md)

| Part | What it contains | Directory |
| --- | --- | --- |
| **App** | A PWA (React + Express) for the RemoteControl 2 API: surveys, scheduler, participants, statistics, export | `src/`, `server.ts`, `server/` |
| **Survey themes** | 8 WCAG 2.2 AA themes for LimeSurvey 6 and 7, including CATI and CAPI interviewer themes | [`limesurvey-themes/`](./limesurvey-themes/) |
| **Survey templates** | 12 questionnaires in English and Polish in `.lss` format, including CATI and CAPI interview skeletons | [`survey-templates/`](./survey-templates/) |
| **Deployments** | LimeControl in your own Docker container (no Firebase) and the production service deployment | [`deploy/`](./deploy/) |
| **Mobile app** | iOS and Android (Capacitor) — the same app with no account and no CORS restrictions | [`mobile/`](./mobile/) |

A hardened LimeSurvey 7 on Docker (Traefik, Let's Encrypt, backups) lives in a separate repository:
[limesurvey-stack](https://github.com/lukasz5/limesurvey-stack).

The `site/` and `site-src/` directories hold the limecontrol.eu website. They build together with the project
but **are not part of the open-source software** — see [Licence](#licence).

## Free and paid

| Free of charge, open source | Paid services |
| --- | --- |
| the LimeControl app (browser, PWA, your own server, mobile app) | a [StrefaAnkiet](https://strefaankiet.pl) platform account: managed mailing through Amazon SES, VoIP telephony and a VoIP server for CATI interviews, interviewers in the field, analysis and reports |
| survey themes and templates | deployment and maintenance of a survey server (built on the LimeSurvey engine) — [strefabadan.pl](https://strefabadan.pl) |
| Docker deployment kits | |
| StrefaAnkiet plugins for LimeSurvey | |

The free tools need none of the paid services.

## Quick start

**Hosted service.** Open [app.limecontrol.eu](https://app.limecontrol.eu), sign in with a Google account and add
your LimeSurvey instance. The JSON-RPC interface has to be enabled in LimeSurvey
(*Configuration → Global settings → Interfaces*).

**Your own server.** No Google account and no external services — you sign in with an access key:

```bash
git clone https://github.com/lukasz5/LimeControl.git
cd LimeControl/deploy/selfhost
cp .env.example .env    # set LIMECONTROL_ACCESS_KEY (min. 16 characters)
docker compose up -d --build
```

Details: [deploy/selfhost/README.en.md](./deploy/selfhost/README.en.md).

**Locally (development).**

```bash
npm install
npm run dev             # Express + Vite at http://localhost:3000
```

Without a `firebase-applet-config.json` file the app starts in local mode and prints the access key to the console.

## The app

- **Many LimeSurvey 3.x–7.x instances** — server profiles, direct mode (browser → LimeSurvey) or a server relay
  for servers without CORS headers, an RPC call log with diagnostics.
- **Surveys** — activation (optionally with the participant table), availability window, closing, copying.
- **Template library** — import a ready-made questionnaire into the connected instance (`import_survey`).
- **Link, QR code and theme** — the public survey address, sharing, a QR code generated in the browser, and
  changing the survey theme with a check that the theme is actually installed.
- **CAPI mode** — “Start an interview” and the interview loop (when one interview ends, the survey starts the
  next, empty one).
- **Server-side scheduler** — activation, closing, invitation mailings and recurring reminders; it keeps
  working after you close the app.
- **Participants and emails** — the token table, participant fields from a template, an invitation and
  reminder editor with a preview, sending with a result summary.
- **Statistics and export** — summaries in charts, a two-survey comparison, CSV / XLS / JSON export, a column
  inspector (`get_fieldmap`, SGQA and LimeSurvey 7).
- **StrefaAnkiet connector (beta)** — read-only CATI/CAPI fieldwork status of the study linked to a survey.
- **PWA** — installs on the home screen, offline indicator, interface in English and Polish.

Full description: [documentation](https://limecontrol.eu/en/docs.html) ([po polsku](https://limecontrol.eu/docs.html)).

### Two sign-in modes

| | Hosted service (`firebase`) | Self-hosted (`local`) |
| --- | --- | --- |
| Sign-in | Google account (Firebase Authentication) | access key (`LIMECONTROL_ACCESS_KEY`) |
| Instance profiles | Cloud Firestore | browser storage, without passwords |
| RPC relay | public addresses only | private networks too (`RELAY_ALLOW_PRIVATE`) |
| External dependencies | Firebase | none |

The server picks the mode: `AUTH_MODE=local|firebase`; without that variable it is `firebase` when a
`firebase-applet-config.json` file exists and `local` otherwise. LimeSurvey passwords are not stored in either mode.

### Supported API methods (`remotecontrol_handle`)

| Area | Methods |
| --- | --- |
| Session | `get_session_key`, `release_session_key`, `get_site_settings` |
| Surveys | `list_surveys`, `get_survey_properties`, `set_survey_properties`, `activate_survey`, `copy_survey`, `import_survey` |
| Statistics and export | `get_summary`, `get_fieldmap`, `export_responses` |
| Participants | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` |
| Survey texts | `get_language_properties`, `set_language_properties` |

## Survey themes and templates

- **Themes** — Medical, Professional, Social, Marketing, Eco, Minimalist, CATI and CAPI. Child themes of
  `fruity_twentythree`, contrast checked at build time, separate packages for LimeSurvey 6.x and 7.x.
  Download: [limecontrol.eu/en/themes.html](https://limecontrol.eu/en/themes.html); sources and build notes:
  [limesurvey-themes/README.md](./limesurvey-themes/README.md).
- **Survey templates** — NPS, CSAT, employee engagement, exit interview, training evaluation, event and course
  feedback, patient satisfaction, SUS, product concept test, and CATI and CAPI interview skeletons. Each one in
  English and Polish, with conditional logic and email texts.
  Download: [limecontrol.eu/en/templates.html](https://limecontrol.eu/en/templates.html); source format:
  [survey-templates/README.md](./survey-templates/README.md).

## CATI, CAPI and StrefaAnkiet

The free tools get a survey ready for an interviewer: the CATI (keyboard shortcuts) and CAPI (large touch
targets) themes, interview skeletons and the interview loop in the app. Interviewer assignments, a call queue,
VoIP telephony and quotas across modes are provided by the [StrefaAnkiet](https://strefaankiet.pl) platform.
The **free StrefaAnkiet plugins** connect it to LimeSurvey (described at
[limecontrol.eu/en/plugins.html](https://limecontrol.eu/en/plugins.html)); the platform account and its
services are paid. The plugins are developed outside this repository, and LimeControl connects to the platform
only to read the fieldwork status.

## Development

Requirements: Node.js 22+ and npm (the Docker image is built with [Bun](https://bun.sh) from `bun.lock`).

```bash
npm run dev            # development server (Express + Vite)
npm run lint           # TypeScript type check
npm test               # unit tests (node:test)
npm run build          # production PWA build (dist/)
npm run build:mobile   # mobile app bundle (dist-mobile/) + sync of the iOS and Android projects
npm run build:themes   # survey theme packages (ZIP)
npm run build:templates # survey template files (.lss)
npm run build:site     # the above + the limecontrol.eu pages → site/, public/szablony-ankiet/
npm run check:site     # links, anchors and language versions of the generated website
```

The generated files (`site/`, `public/szablony-ankiet/`) are committed — after changing the sources run
`npm run build:site` and commit the result. Packaging the themes needs the `zip` command.

| Directory | Contents |
| --- | --- |
| `src/` | the React app: `components/`, `services/` (RPC client, templates, connector), `backend/` (sign-in layer), `i18n/` |
| `server.ts`, `server/` | the Express server: scheduler, relay, StrefaAnkiet connector, outbound request guard |
| `tests/` | tests of the server and client services |
| `limesurvey-themes/` | theme sources and the ZIP package generator |
| `survey-templates/` | template definitions (JSON) and the `.lss` generator |
| `mobile/` | the mobile app: iOS and Android projects, store listings and graphics, [release guide](./mobile/README.en.md) |
| `deploy/` | production deployment and the self-hosted kit |
| `site-src/`, `site/` | the limecontrol.eu website (not under the open-source licence) |

The interface texts are keyed by their Polish wording (`t('…')`); English translations live in
`src/i18n/en.ts`, and a test fails when a translation is missing.

Building, signing and publishing the mobile app on the App Store and Google Play is described in
[`mobile/README.en.md`](./mobile/README.en.md).

### Environment variables

| Variable | Where | Description |
| --- | --- | --- |
| `AUTH_MODE` | server | `local` or `firebase` (the default depends on the Firebase config file) |
| `LIMECONTROL_ACCESS_KEY` | server, `local` mode | the sign-in key (min. 16 characters); empty = generated into `data/access-key` |
| `LIMECONTROL_SECRET` | server | key material for encrypting scheduled-job passwords; empty = the `data/secret.key` file |
| `RELAY_ALLOW_PRIVATE` | server | `1` lets the relay and the scheduler connect to private addresses |
| `PORT`, `DATA_DIR` | server | listening port (default 3000) and data directory (`data`) |
| `VITE_AUTH_MODE` | build | `local` builds the app without any Firebase configuration |
| `VITE_SUPPORT_URL`, `VITE_APP_STORE_URL`, `VITE_PLAY_STORE_URL` | build | the support link and the app store links |

### Server endpoints

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | health check |
| `GET /api/config` | public configuration: sign-in mode, version |
| `POST /api/session` | checks the access key or token |
| `GET` / `POST /api/schedules` | list and create scheduled jobs |
| `POST /api/schedules/:id/run-now`, `PATCH /api/schedules/:id/cancel`, `DELETE /api/schedules/:id` | run, cancel and delete a job |
| `POST /api/rpc-relay` | JSON-RPC relay to LimeSurvey |
| `POST /api/strefaankiet` | read-only proxy for the StrefaAnkiet connector |

Every endpoint except `/api/health` and `/api/config` requires sign-in (a Firebase token or the access key).

## Security

- LimeSurvey passwords never reach the database or `localStorage`; in the scheduler queue they are encrypted
  (AES-256-GCM) and removed once the job has run.
- The relay and the connector require sign-in, have request limits, connect over HTTP/HTTPS only, do not
  follow redirects and pin the checked IP address (protection against SSRF and DNS rebinding).
- The Firestore rules (`firestore.rules`, described in `security_spec.md`) let only the owner read their profiles.

Please report vulnerabilities privately — see [SECURITY.md](./SECURITY.md).

## Contributing

Bug reports, ideas and pull requests are welcome — in English or Polish. Start with
[CONTRIBUTING.md](./CONTRIBUTING.md).

## Licence

- The app, the server, the mobile app, the survey themes and the deployment kits: **GPL-2.0-or-later**
  ([LICENSE](./LICENSE)). The themes inherit from Fruity TwentyThree © LimeSurvey GmbH.
- The survey templates (`survey-templates/`, the `.lss` files): **CC0 1.0**
  ([survey-templates/LICENSE](./survey-templates/LICENSE)).
- The limecontrol.eu website (`site/`, `site-src/`) and the LimeControl name and logo **are not covered by the
  open-source licence** — all rights reserved ([site-src/LICENSE.md](./site-src/LICENSE.md)). The theme
  packages and templates stored under `site/` keep the licences listed above.

LimeSurvey is a registered trademark of LimeSurvey GmbH. LimeControl and the strefabadan.pl services are independent
projects and are not affiliated with LimeSurvey GmbH.
Developed by [strefabadan.pl](https://strefabadan.pl).
