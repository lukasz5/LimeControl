# Changelog

All notable changes to LimeControl are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).
The survey themes and the survey templates carry their own version numbers, noted below.

## 1.2.0 — 2026-11-25

Convenience release for the mobile app: biometric sign-in, QR codes and links, an offline survey list,
a tablet layout and a German interface.

### Added

**Mobile app (iOS and Android)**
- Optional saved password: kept in the iOS Keychain or Android Keystore and unlocked with Face ID, Touch ID
  or a fingerprint (`BIOMETRY_ANY` access control). The profile stores only a flag; a password the server
  rejects is removed automatically, and "Forget password" removes it by hand.
- "Scan QR code" on the Instances tab fills in the server address and user name from a QR code or a plain
  server address.
- `limecontrol://open?server=…&user=…&name=…&sid=…` links open the app on a saved profile (connecting
  straight away) or fill in the new-instance form; with `sid` the survey opens after connecting.
- Pull to refresh on the survey list, and the last downloaded survey list (titles, status, dates) shown
  before connecting and offline.
- Permission texts for the camera and Face ID in Polish, English and German.

**App (all platforms)**
- German interface (`de`), chosen automatically for German-language devices and browsers; links to the
  German website pages.
- QR code for the mobile app on every instance profile card, with a copyable `limecontrol://` link
  (never containing the password).
- Tablet layout: from 768 px the survey list and details sit side by side and the details pane scrolls on
  its own; the instances, schedule and participants views use two columns from the same width.

**Store listings and website**
- German App Store and Google Play listings and German screenshots in `mobile/store/screenshots.mjs`.
- Mobile app roadmap (`mobile/ROADMAP.md`, `mobile/ROADMAP.en.md`).
- Privacy policy 1.2 (PL, EN, DE): camera, biometrics and the saved survey list in the mobile app.

### Changed

- Android 8.0 (API 26) is now the minimum version, required by the QR code scanner.
- Server messages for the German interface are in English (`X-LimeControl-Lang: de`).
- Store listings no longer say "without logging in to the admin panel", in line with the website.
- The untranslated "Signing in..." label in the instance form now follows the interface language.

## 1.1.0 — 2026-11-18

LimeControl becomes a complete set of free, open-source tools — the app, survey themes, survey templates
and deployments — with a bilingual website and a clear split between free software and paid services.

### Added

**App**
- Survey template library: import a ready-made questionnaire into the connected instance (`import_survey`),
  with a category filter and a checksum check of the bundled `.lss` files.
- “Link, CAPI mode and theme” card: public survey link per language, copy / share / open, a QR code generated
  in the browser, and a survey theme switch that verifies the theme is installed.
- CAPI mode: “Start an interview” (always a new, empty response) and an interview loop that restarts the
  survey after each completed interview.
- Scheduler operations: close a survey, send invitations, send reminders — including a repeating reminder
  series with a minimum interval and a per-person limit.
- Participant fields defined by a template (for example the CATI interview skeleton) can be created
  together with the participant table.
- Self-hosted mode without Firebase: sign-in with an access key, profiles stored in the browser
  (`AUTH_MODE=local`), with a Docker Compose kit in `deploy/selfhost/`.
- StrefaAnkiet connector (beta): read-only CATI/CAPI fieldwork status for a survey linked to a study.
- Server messages in English and Polish (`X-LimeControl-Lang`).
- A privacy policy link in the app footer.

**Mobile app (iOS and Android)**
- The same app in a native Capacitor 8 shell (`mobile/`), built with `npm run build:mobile`: no account
  and no sign-in, server profiles stored on the device only, direct connections through the native
  networking layer (no CORS, no relay), the system share sheet for links and exported files, the system
  light or dark appearance, safe-area and Android Back button support.
- An optional connection to a self-hosted LimeControl server adds the scheduler to the mobile app.
- Store release kit: listings in Polish and English, a demo-data seeder, a screenshot generator for
  every required device size, icon and splash-screen generators, fastlane commands for uploading
  listings and builds, suggested answers to the store forms and notes for reviewers
  (`mobile/README.en.md`). Not published in the stores yet.

**Survey themes 1.1.0**
- Two interviewer themes: **CATI** (wide layout, keyboard shortcuts, sticky navigation) and **CAPI**
  (large touch targets for tablets).
- Interviewer mode in every theme: the `lc-interviewer` CSS class marks scripts and interviewer-only fields.
- English descriptions in the theme metadata and README files.

**Survey templates 1.0.0**
- Twelve bilingual (Polish + English) templates in `.lss` format with conditional logic and email texts:
  NPS, CSAT, employee engagement, exit interview, training evaluation, event feedback, course feedback,
  patient satisfaction, SUS, product concept test, CATI interview and CAPI interview.
- A dependency-free generator (`survey-templates/`), unit tests and a verification script that imports
  every template into a real LimeSurvey through the API.

**Website**
- English version of every page under `/en/`, with language switch, `hreflang` and a bilingual sitemap.
- New pages: survey templates, the free StrefaAnkiet plugins for LimeSurvey, privacy policy; rewritten home
  page and documentation.
- “Free and paid”: the software is free and open source; the StrefaAnkiet account (managed Amazon SES, VoIP
  telephony, fieldwork, analysis) and survey-server deployment and maintenance are paid services.
- A shared layout generator (`site-src/`) and a link, anchor and language-version checker. The website is
  not part of the open-source software (`site-src/LICENSE.md`).

**Project**
- Licence files (GPL-2.0-or-later for the software; CC0 1.0 for survey templates; the website excluded),
  contribution guide, security policy, code of conduct, issue and pull request templates, and a CI workflow.
- Unit tests for the server (network guard, encryption, scheduler, connector) and client services.

### Changed

- The server relay (`/api/rpc-relay`) now requires sign-in, is rate-limited, accepts only HTTP/HTTPS
  targets, does not follow redirects and — in the public service — refuses private network addresses.
- Scheduled-job passwords are encrypted at rest (AES-256-GCM); passwords stored by earlier versions are
  encrypted on first start.
- Scheduled dates use the time zone of the device that created the job instead of the server's time zone.
- Theme and template packages are built reproducibly (identical input gives identical files).
- `limesurvey-stack` moved to its own repository.
- The brand tagline is now “Survey control app”. “LimeSurvey” is used only to state compatibility
  (“for LimeSurvey”, “based on the LimeSurvey engine”), never as the name of an offer; the website and the
  app carry a note that the projects are independent of LimeSurvey GmbH.

### Fixed

- Connecting to an instance with no surveys no longer fails with “No surveys found”.
- Sending invitations or reminders is no longer reported as an error when LimeSurvey answers
  “N left to send”; a mailing in which every message fails is no longer reported as a success.
- A missing participant table is recognised on LimeSurvey 6 and 7.
- Participants: after quickly switching surveys, a late answer for the previous survey could overwrite
  the view of the current one (for example “participant table is not active” next to a full list).
- Themes: array questions were rendered as broken tiles in LimeSurvey 6 and 7; stacked arrays on small
  screens now use the tile layout correctly.

## 1.0.0 — 2026-11-17

First public release.

- PWA for the LimeSurvey RemoteControl 2 API: multiple instances, survey activation and closing,
  server-side activation scheduler, participants and email template editor, statistics, comparison and
  response export, RPC log, in-app notifications.
- Google sign-in with profiles in Cloud Firestore; Polish and English interface.
- Six WCAG 2.2 AA survey themes for LimeSurvey 6 and 7.
- Product website with documentation, Docker deployment pipeline.
