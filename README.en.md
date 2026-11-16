# LimeControl — LimeSurvey Mobile RC2

> 🇵🇱 [Wersja polska (README.md)](./README.md)

A mobile **Progressive Web App (PWA)** and **React Native (Expo) project exporter** for managing any **LimeSurvey** instance through the official **RemoteControl 2 API** (`remotecontrol_handle` JSON-RPC).

The application lets you connect to multiple LimeSurvey servers, activate and close surveys, schedule automated server-side survey activation, inspect response statistics with charts, manage participants (tokens) with an email template editor, and export survey results.

---

## Key Features

### 1. Multi-Instance LimeSurvey Connections
- Save multiple server profiles locally (`localStorage`) with automatic normalization of the `/index.php/admin/remotecontrol` endpoint.
- Quick **search and filtering** across saved profiles by name, URL, endpoint, username, or auth plugin, plus filtering by connection mode (`All`, `Direct`, `Relay`).
- Support for custom authentication plugins (default: `Authdb`) and optional local password storage.
- Default **direct browser JSON-RPC** requests, live RPC call trace with latency measurement, CORS error diagnostics, and an optional server relay mode (`/api/rpc-relay`).

### 2. Surveys, Activation & Data Visualization
- Browse, search, and filter surveys (`All`, `Active`, `Inactive`).
- Instant survey activation (`activate_survey`) with optional simultaneous participant token table initialization (`activate_tokens`).
- Close active surveys and configure availability windows (`startdate` and `expires`) via `set_survey_properties`.
- Duplicate surveys (`copy_survey`).
- Summary and **data visualization (`recharts`)** powered by `get_summary`: bar charts for response counts (completed, incomplete, total) and participant/token statuses (total, sent, completed, pending, opted out).
- Export responses (`export_responses`) with Base64 decoding to download **CSV**, **Excel (.xls)**, and **JSON** files with an in-app preview.

### 3. Server-Side Activation Scheduler
- Schedule automatic `activate_survey` execution for a specific date and time, running reliably even after closing the mobile app.
- Express server background worker (15-second polling interval) executing: `get_session_key` → `activate_survey` → optional `activate_tokens` and `set_survey_properties` (`expires`) → `release_session_key`.
- Persistent job queue stored in `data/schedules.json`, detailed RPC step logs, instant test execution (`Run now`), and automatic password stripping after completion.

### 4. Participants, Tokens & Email Template Editor
- One-tap token table initialization (`activate_tokens`).
- Participant list (`list_participants`) with unused-token filtering plus adding and deleting respondents (`add_participants`, `delete_participants`).
- **Email template editor** (`get_language_properties`, `set_language_properties`) for invitations and reminders with survey language switching, quick placeholder insertion (`{FIRSTNAME}`, `{LASTNAME}`, `{EMAIL}`, `{TOKEN}`, `{SURVEYURL}`, `{OPTOUTURL}`, `{SURVEYNAME}`), live message preview with sample data, and Save + Send actions (`invite_participants`, `remind_participants`).

### 5. In-App Notifications, PWA & React Native Export
- **In-app notifications**: real-time toasts informing you about completed or failed scheduled jobs as well as LimeSurvey API communication errors.
- **PWA**: Web App Manifest, `192x192`, `512x512`, `maskable`, and `apple-touch-icon.png` icons, offline indicator (`OfflineIndicator`), and an in-app install prompt (`PWAInstallButton`).
- **React Native (Expo) Exporter**: generates a ready-to-run TypeScript project (`App.tsx`, `limeSurveyRpc.ts` client, `AsyncStorage` profile store, `package.json`, `app.json`) downloadable as a ZIP archive — native mobile requests are not restricted by browser CORS rules.

---

## Supported LimeSurvey API Methods (`remotecontrol_handle`)

| Category | API Methods | Usage in App |
| :--- | :--- | :--- |
| **Session & Instance** | `get_session_key`, `release_session_key`, `get_site_settings` | Authentication, session cleanup, and site name lookup |
| **Surveys & Dates** | `list_surveys`, `get_survey_properties`, `set_survey_properties`, `activate_survey`, `copy_survey` | Survey listing, activation, `startdate`/`expires` updates, closing, and copying |
| **Stats & Export** | `get_summary`, `export_responses` | Response/token summaries, charts, and CSV/XLS/JSON downloads |
| **Participants** | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` | Token table management and invitation/reminder delivery |
| **Email Templates** | `get_language_properties`, `set_language_properties` | Reading, editing, and saving invitation and reminder subjects and bodies |

---

## LimeSurvey Instance Setup

To connect to your LimeSurvey server:
1. Sign in to the LimeSurvey admin panel.
2. Go to **Global Settings → Interfaces**.
3. Enable the **JSON-RPC Interface** and save your settings.
4. When connecting directly from the browser (PWA) to a server on another domain, make sure the HTTP server returns CORS headers (`Access-Control-Allow-Origin`). Otherwise, switch the profile to **Server Relay** mode or export the **React Native (Expo)** project.

---

## Local Development

### Prerequisites
- Node.js 20+ (Node.js 22+ recommended)
- npm

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (Express + Vite on port 3000)
npm run dev
```

The application will be available at `http://localhost:3000`.

### Additional Scripts

```bash
# Run TypeScript type checking
npm run lint

# Build the production PWA bundle (dist/)
npm run build

# Start in production mode (NODE_ENV=production)
NODE_ENV=production npm start
```

---

## Express Server Endpoints (`server.ts`)

- `GET /api/health` — server health check.
- `GET /api/schedules` — list scheduled and completed activation jobs (passwords omitted).
- `POST /api/schedules` — create a new automated survey activation job.
- `POST /api/schedules/:id/run-now` — immediately execute a queued job.
- `PATCH /api/schedules/:id/cancel` — cancel a pending scheduled job.
- `DELETE /api/schedules/:id` — delete a job from history.
- `POST /api/rpc-relay` — optional JSON-RPC relay for LimeSurvey servers that block browser CORS requests.
