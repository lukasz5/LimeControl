# LimeControl mobile app roadmap

🇵🇱 [Wersja polska](ROADMAP.md)

Plan as of 25 November 2026. Durations are estimates for one person and do not include store review delays.
Building and releasing: [README.en.md](README.en.md).

## Starting point (version 1.1.0)

- **Technology:** the same React app as in the browser, in a Capacitor 8 shell (`VITE_PLATFORM=native`).
  It runs in "on device" mode (`src/backend/device.ts`): no account, server profiles in Preferences,
  native networking without CORS.
- **Native plugins:** app, filesystem, preferences, share, status-bar. On Android the only permission is
  `INTERNET`.
- **Stores:** the app is live on the App Store and Google Play, declared as "Data Not Collected".
- **Main gaps:**
  - the password has to be typed in for every connection,
  - the scheduler needs a self-hosted LimeControl server,
  - there are no notifications,
  - CAPI interviews need a network connection all the time,
  - no automated tests on the native platforms,
  - not yet checked on a physical Android phone (WebView 140+, drawing under the system bars).

## Stage 0: stabilisation (2–3 weeks)

1. **Physical devices.** Walk the main paths on an Android phone (WebView 140+) and an iPad: edge
   insets, the keyboard in forms, the Back button.
2. **Crash reports without an SDK.** Review Xcode Organizer and Android Vitals regularly. No Crashlytics
   and no analytics, so that "Data Not Collected" stays true.
3. **Mobile CI.** A GitHub Actions workflow running `build:mobile`, `assembleDebug` and a simulator
   `xcodebuild` on every PR.
4. **E2E tests of `dist-mobile/`.** Playwright with device emulation against the demo instance, the same
   way `store/screenshots.mjs` works.
5. **Reviewer demo instance.** A cron job running `seed-demo.mjs --reset` and uptime monitoring — a broken
   demo means a rejected update.

## Version 1.2: convenience (about 6 weeks)

**Status:** implemented in code on 25 November 2026 (CHANGELOG 1.2.0). Still to do: Universal Links /
App Links for `https://limecontrol.eu/…` addresses (they need the Apple team ID and the Google Play signing
key fingerprint), testing on physical devices and the store release.

| Feature | Description | Notes |
|---|---|---|
| **Saved password, securely** | Optional storage in the Keychain (iOS) or Keystore (Android), unlocked with Face ID, Touch ID or a fingerprint | The password never leaves the device, so the privacy declarations stay the same. The "passwords are not stored" wording in the README, website and reviewer notes must change. |
| **Add an instance by QR code** | The browser version shows a code with the address and user name (no password); the app scans it | Camera permission — update the store forms and the permission table. |
| **Links into the app** | A link opens the app on a given survey, or with the new-instance form filled in | Universal Links / App Links need `apple-app-site-association` and `assetlinks.json` on the website. |
| **Quick refresh** | Pull to refresh; the last survey list is kept on the device for when there is no network | Complements the existing offline indicator. |
| **German** | Interface and store listings in German, like the `/de/` website | Polish and English stay mandatory; German is a third language. |
| **Tablet layout** | Survey list and details side by side on iPad and Android tablets | Tablet screenshots are already required by the stores. |

## Version 1.3: the app keeps you informed (about 6–8 weeks)

1. **Local notifications** without a server: "survey expires tomorrow", "reminder due", computed on the
   device from survey dates.
2. **Background refresh** (BackgroundFetch / WorkManager): a few times a day, check response counts and
   notify, e.g. "+12 responses in NPS Q4". The OS limits background work, so notifications are delayed and
   not guaranteed — the app must say so.
3. **Home-screen widgets** (iOS WidgetKit, Android Glance): response counts and fieldwork status for chosen
   surveys. The first hand-written native code.
4. **On-device scheduling:** simple jobs (activate, close) run during background refresh, with the caveat
   that they are not minute-accurate. Exact scheduling still needs a self-hosted server.
5. **Optional push notifications** through a self-hosted LimeControl server and a LimeSurvey plugin ("new
   response"). Relaying push through `app.limecontrol.eu` changes the privacy declarations, so self-hosted
   only to start with.

## Version 2.0: fieldwork, offline CAPI interviews (a quarter, after a technical spike)

- **Spike (2 weeks):** can a survey be filled in without a network? Compare:
  - **A)** a form built on the device from the survey definition (`.lss` or `get_fieldmap`), sent later
    through `add_response` — needs our own condition engine,
  - **B)** a cached LimeSurvey survey page with the submission intercepted — cannot run ExpressionScript
    without the server.
- **Sync queue:** encrypted response store, retries, conflict marking, an "X interviews waiting to be sent"
  status.
- **Interviewer mode:** lock the screen to the survey (Guided Access / kiosk mode), optional interview
  location — a new permission and a change to the privacy declarations.
- **StrefaAnkiet integration:** interviewer assignments, read-only; no purchases or payment links in the app.

## Cross-cutting work

- **Releases:** fastlane `beta` and `internal` from CI on a tag, the version from `package.json`,
  CHANGELOG entries and store release notes in Polish and English.
- **Accessibility:** VoiceOver, TalkBack and larger system text, to the same WCAG 2.2 AA standard as the
  survey themes.
- **Performance:** split the bundle (charts and the email editor loaded on first use), measure start-up time
  on a slower Android phone.
- **Naming and store rules:** "for LimeSurvey", never as the name of an offer. For every new feature, check
  the "Answers for the store forms" table in [README.en.md](README.en.md).

## Open decisions

1. **Push notifications:** self-hosted server only, or also through the `app.limecontrol.eu` service
   (changes the privacy declarations).
2. **Order:** should offline CAPI come before 1.3, if StrefaAnkiet customers matter more than standalone
   LimeSurvey administrators?
