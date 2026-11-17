# LimeControl — LimeSurvey Mobile RC2

> 🇵🇱 [Wersja polska (README.md)](./README.md)

A mobile **Progressive Web App (PWA)** and **React Native (Expo) project exporter** for managing any **LimeSurvey** instance through the official **RemoteControl 2 API** (`remotecontrol_handle` JSON-RPC).

The application lets you connect to multiple LimeSurvey servers, activate and close surveys, schedule automated server-side survey activation, inspect response statistics with charts, manage participants (tokens) with an email template editor, and export survey results.

---

## Key Features

### 1. Google Sign-In, Cloud Firestore & Multi-Instance LimeSurvey
- **Google Sign-In (Firebase Auth)** gate before accessing the dashboard, storing server profiles securely in **Cloud Firestore** rather than browser `localStorage`.
- **Credential safety**: LimeSurvey passwords are never written to Firestore or `localStorage` (optional retention only keeps the password in active tab memory).
- **LimeSurvey 3.x–7.x compatibility**: per-profile version selector (`Auto`, `LimeSurvey 7.x UTC`, `LimeSurvey 3–6`), machine-readable JSON-RPC error code parsing, and automatic UTC conversion for `startdate`/`expires`.
- Quick **search and filtering** across saved profiles by name, URL, endpoint, username, or auth plugin, plus filtering by connection mode (`All`, `Direct`, `Relay`).
- Default **direct browser JSON-RPC** requests, live RPC call trace with latency measurement, CORS error diagnostics, and an optional server relay mode (`/api/rpc-relay`).

### 2. Surveys, Activation, Fieldmap & Data Visualization
- Browse, search, and filter surveys (`All`, `Active`, `Inactive`) with a per-row **Quick Actions** menu.
- Instant survey activation (`activate_survey`) with optional simultaneous participant token table initialization (`activate_tokens`).
- Close active surveys and configure availability windows (`startdate` and `expires`) via `set_survey_properties` (with UTC handling for LimeSurvey 7).
- Duplicate surveys (`copy_survey`).
- Summary, **data visualization (`recharts`)**, and **two-survey side-by-side comparison chart** powered by `get_summary`.
- Export responses (`export_responses`) to **CSV**, **Excel (.xls)**, and **JSON** alongside a **`get_fieldmap` column inspector** supporting both legacy SGQA and LimeSurvey 7 field identifiers.

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
| **Stats & Export** | `get_summary`, `get_fieldmap`, `export_responses` | Response/token summaries, comparison charts, SGQA/LS 7 fieldmap inspection, and CSV/XLS/JSON downloads |
| **Participants** | `activate_tokens`, `list_participants`, `add_participants`, `delete_participants`, `invite_participants`, `remind_participants` | Token table management and invitation/reminder delivery |
| **Email Templates** | `get_language_properties`, `set_language_properties` | Reading, editing, and saving invitation and reminder subjects and bodies |

---

## LimeSurvey Instance Setup

To connect **LimeControl** to your LimeSurvey server (versions **3.x / 5.x / 6.x / 7.x**):

### 1. Enable the RemoteControl 2 (JSON-RPC) Interface
1. Sign in to the LimeSurvey admin panel as a Superadministrator.
2. Go to **Configuration → Global settings → Interfaces**.
3. Set **RPC interface** to **JSON-RPC**.
4. Optionally configure **Publish API** according to your security policy (JSON-RPC itself is enough for API calls) and click **Save**.
5. The default endpoint path is:
   - `https://your-instance.com/index.php/admin/remotecontrol` (when clean/pretty URLs are enabled), or
   - `https://your-instance.com/index.php?r=admin/remotecontrol` (when URL rewriting is disabled).
   - In the app, entering just the base URL (e.g. `https://your-instance.com`) automatically appends `/index.php/admin/remotecontrol`.

### 2. User Permissions & Auth Plugin
- The LimeSurvey account used in the connection profile needs permissions to:
  - view, update, create, and activate surveys (**Surveys**: *View/Read*, *Update*, *Create*, *Activate*),
  - manage participant token tables and send invitations (**Survey participants / Tokens**),
  - export survey data (**Responses**: *Export*).
- Keep the **Auth plugin** set to `Authdb` for standard LimeSurvey accounts, or enter the name of your configured plugin (such as `AuthLDAP`).

### 3. Connection Mode (CORS & HTTPS)
- **Direct Mode (Browser PWA)**:
  - When the app runs over `https://...`, your LimeSurvey instance must also use **HTTPS** (browsers block Mixed Content).
  - The HTTP server hosting LimeSurvey must return **CORS** headers for the app origin (including `OPTIONS` preflight requests):
    ```apache
    # Apache example (.htaccess or VirtualHost)
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Accept"
    ```
    ```nginx
    # Nginx example
    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Accept" always;
    ```
- **Server Relay Mode (`/api/rpc-relay`)**:
  - If you cannot modify CORS headers on your LimeSurvey server, switch the profile connection mode to **Server Relay** in the **Instances** tab so JSON-RPC calls are proxied through the Express backend.
- **Native React Native (Expo) App**:
  - The exported mobile project runs natively on iOS/Android, is not subject to browser CORS restrictions, and connects directly to any LimeSurvey server.

### 4. LimeSurvey 7.x Specifics
- Select **LimeSurvey 7.x (UTC dates + new error codes)** in the instance profile — the app automatically converts `startdate`/`expires` and scheduled activation dates to **UTC**, parses explicit RemoteControl 2 error codes, and lets you inspect refactored field identifiers via `get_fieldmap`.
- In LimeSurvey 7.9+, you can enable built-in server-side API call logging in `application/config/config.php`:
  ```php
  'config' => array(
      'rpc_log' => true,
  )
  ```
  Logs are written to `tmp/runtime/remotecontrol.log` with passwords and session keys automatically obfuscated.

### 5. Testing the Connection
1. Sign in with Google, open the **Instances** tab, and create a server profile.
2. Enter a profile name, LimeSurvey URL, username, and password.
3. Click **Connect** — once authenticated, the app reads the instance name (`get_site_settings`) and loads your surveys. Any network or server errors can be inspected in the **RPC Log** panel.

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
