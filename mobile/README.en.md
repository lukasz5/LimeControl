# LimeControl mobile app (iOS and Android)

🇵🇱 [Wersja polska](README.md)

The same app as in the browser, embedded in a native [Capacitor 8](https://capacitorjs.com) shell
and prepared for the App Store and Google Play. This document covers building, signing and
releasing — step by step, including suggested answers to both stores' forms.

- App identifier (Bundle ID / package name): `eu.limecontrol.app`
- iOS 15 or later, iPhone and iPad · Android 7.0 (API 24) or later, target API 36
- Languages: Polish and English (interface, store listings, screenshots)

## How it differs from the browser version

| | Browser / PWA | Mobile app |
|---|---|---|
| Account | Google account (hosted service) or access key (self-hosted) | none — no registration, no sign-in |
| Server profiles | in the cloud or in the browser | on the device only (native app storage), without passwords |
| Connection to the survey server | direct (needs CORS) or through the relay | direct through the native networking layer — no CORS, no relay |
| Scheduler | LimeControl server | after connecting your own LimeControl server (optional) |
| Export and sharing | file download | system share sheet |
| Light / dark theme | switch in the header | follows the system until you pick one |

The mobile bundle is built with `VITE_PLATFORM=native` — without Firebase, without a service worker
and without fonts loaded from the internet.

## Directory layout

```
capacitor.config.ts        Capacitor configuration (in the repository root)
mobile/
  ios/                     Xcode project (App/App.xcodeproj, dependencies via Swift Package Manager)
  android/                 Gradle project
  assets/                  sources of icons, splash screen and the Google Play graphic (SVG → PNG)
  scripts/sync-version.mjs version from package.json → native projects
  store/                   demo data, screenshots, notes for reviewers
  fastlane/                store listings (PL/EN) and upload commands
```

## Requirements

- Node.js 22 or later and the project dependencies (`npm install` or `bun install`).
- **iOS:** macOS with Xcode (verified on Xcode 27.2; Capacitor 8 needs at least Xcode 26).
- **Android:** Android SDK with platform 36 and **JDK 21** — with a newer JDK Gradle fails with
  “Unsupported class file major version”. Point `JAVA_HOME` at JDK 21.
- Optional: [fastlane](https://fastlane.tools) (store uploads), Python 3 with Pillow (icons),
  Playwright and Chrome (screenshots, rendering graphics).

## Building and running

```bash
npm run build:mobile
```

The command syncs the version number, builds the bundle into `dist-mobile/` and copies it into both
native projects (`cap sync`). Run it after every change in `src/`.

**iOS — simulator**

```bash
xcodebuild -project mobile/ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath mobile/build/ios build
```

```bash
xcrun simctl install booted mobile/build/ios/Build/Products/Debug-iphonesimulator/App.app
```

```bash
xcrun simctl launch booted eu.limecontrol.app
```

More convenient: `npx cap open ios` opens the project in Xcode, where you pick a device and press Run.

**Android — emulator or phone**

```bash
cd mobile/android && ./gradlew assembleDebug
```

```bash
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

The `debug` build may connect to test servers over `http://`. The Android release build requires
HTTPS; on iOS an unencrypted connection is allowed only to addresses on the local network.

## Version and build number

- The **version** shown in the stores is `version` from `package.json`. `npm run build:mobile`
  copies it to `MARKETING_VERSION` (iOS) and `versionName` (Android).
- The **build number** must grow with every package sent to a store:
  - iOS: `CURRENT_PROJECT_VERSION` — in Xcode (target App → General → Build) or the
    `LIMECONTROL_BUILD` variable in the fastlane commands,
  - Android: `./gradlew bundleRelease -PlimecontrolVersionCode=2` or `LIMECONTROL_BUILD`.

## Icons, splash screen and store graphics

The sources are the SVG files in `mobile/assets/`. After changing them:

```bash
node mobile/assets/render.mjs
```

```bash
python3 mobile/assets/generate.py
```

The first command renders SVG to PNG (needs Playwright; pass its path with `--playwright`). The
second one generates the iOS and Android icons and splash screens, plus the 512 px icon and the
1024×500 feature graphic for the Google Play listing.

## Demo instance for reviewers

The app has no accounts of its own, so App Store and Google Play reviewers need a **publicly
reachable demo server**: a LimeSurvey installation with HTTPS, the JSON-RPC interface enabled and
an account used for this purpose only. The server has to stay online after publication too — every
update is reviewed again.

Demo data (five surveys from the templates, fictitious responses and `@example.com` participants):

```bash
LS_URL=https://demo.example.com LS_USER=reviewer LS_PASSWORD='…' node mobile/store/seed-demo.mjs --lang en --reset
```

> ⚠️ `--reset` **deletes every survey** on that instance. Use it only on an instance dedicated to
> the demo.

A reviewer may change or delete the data, so it is worth restoring it periodically (for example
with a cron job). Ready-to-paste text for reviewers is in [`store/review-notes.md`](store/review-notes.md).

## Screenshots

```bash
SHOTS_PL_ENDPOINT='https://demo-pl.example.com/index.php/admin/remotecontrol' SHOTS_EN_ENDPOINT='https://demo-en.example.com/index.php/admin/remotecontrol' LS_USER=reviewer LS_PASSWORD='…' node mobile/store/screenshots.mjs
```

The script opens the `dist-mobile/` bundle in Chrome at the sizes the stores require and saves the
screenshots in the fastlane layout — in Polish and in English:

| Store | Device | Size | Directory |
|---|---|---|---|
| App Store | iPhone 6.9″ | 1320×2868 | `fastlane/screenshots/<pl\|en-US>/` |
| App Store | iPad 13″ | 2064×2752 | `fastlane/screenshots/<pl\|en-US>/` |
| Google Play | phone | 1080×1920 | `fastlane/metadata/android/<pl-PL\|en-US>/images/phoneScreenshots/` |
| Google Play | 7″ tablet | 1920×1080 | `…/images/sevenInchScreenshots/` |
| Google Play | 10″ tablet | 2560×1440 | `…/images/tenInchScreenshots/` |

The instance address is replaced with an example address in the screenshots. Screenshots are not
kept in the repository (`.gitignore`) — recreate them with this command. Survey titles in Polish
and in English need two instances, or one that is seeded and captured in turn:
`seed-demo.mjs --lang pl` and `screenshots.mjs --lang pl`, then the same with `--lang en`. The
`--only` option limits a run to chosen devices (for example `--only ios-phone,ios-tablet`).

## Release signing

**iOS.** The project uses automatic signing. Pick the Team in Xcode (target App → Signing &
Capabilities) or pass it to fastlane in `APPLE_TEAM_ID`. The team identifier does not have to be
stored in the repository.

**Android.** Generate an upload key and keep a backup of it — without it you cannot ship updates:

```bash
keytool -genkeypair -v -keystore ~/keys/limecontrol-upload.jks -alias limecontrol-upload -keyalg RSA -keysize 2048 -validity 10000
```

Then create `mobile/android/keystore.properties` (the file is in `.gitignore`):

```properties
storeFile=/full/path/to/limecontrol-upload.jks
storePassword=…
keyAlias=limecontrol-upload
keyPassword=…
```

Without this file `bundleRelease` builds an unsigned package, which Google Play rejects. The actual
app signing key is held by Google (Play App Signing).

## Releasing on the App Store

1. **Account.** Apple Developer Program membership. For distribution in the EU, fill in the trader
   status in App Store Connect (Digital Services Act) — without it the app is not available in EU
   countries.
2. **Identifier.** Register the App ID `eu.limecontrol.app` in the developer portal.
3. **App record.** App Store Connect → Apps → New App: platform iOS, name `LimeControl`, Bundle ID
   as above. Choose English (U.S.) as the primary language and add Polish — the primary-language
   listing is shown in every country without its own translation.
4. **API key.** Users and Access → Integrations → App Store Connect API. The *Admin* role allows
   automatic signing; *App Manager* is enough for uploading listings. Keep the `.p8` file outside
   the repository.
5. **Listings and screenshots:**

   ```bash
   cd mobile && ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=~/keys/AuthKey.p8 fastlane ios metadata
   ```

6. **Build to TestFlight:**

   ```bash
   cd mobile && ASC_KEY_ID=… ASC_ISSUER_ID=… ASC_KEY_PATH=~/keys/AuthKey.p8 APPLE_TEAM_ID=… LIMECONTROL_BUILD=1 fastlane ios beta
   ```

   Or by hand: `npm run build:mobile`, then in Xcode Product → Archive → Distribute App →
   App Store Connect.
7. **Forms in App Store Connect** — see the [answers below](#suggested-answers-to-the-store-forms):
   App Privacy, age rating, price (free) and availability, App Review Information (demo account and
   the notes from [`store/review-notes.md`](store/review-notes.md)).
8. **Test on a real device** through TestFlight, then **Submit for Review** — by hand.

## Releasing on Google Play

1. **Account.** Google Play Console with identity verification completed. A personal account
   created after 13 November 2023 has to run a closed test (at least 12 testers for 14 days) before
   production access — the console shows the current requirement. An organisation account needs a
   D-U-N-S number.
2. **App.** Create app: name `LimeControl`, type *App*, *Free*. Choose English (U.S.) as the default
   language and add the Polish translation.
3. **Signing.** Prepare the upload key and `keystore.properties` ([Release signing](#release-signing)).
4. **First package — by hand.** The Google Play API works only after the first package has been
   uploaded manually:

   ```bash
   npm run build:mobile && cd mobile/android && ./gradlew bundleRelease -PlimecontrolVersionCode=1
   ```

   Upload `mobile/android/app/build/outputs/bundle/release/app-release.aab` in the console: Testing →
   Internal testing → Create new release, and enable Play App Signing.
5. **Service account.** In Google Cloud create a service account with a JSON key, enable the
   “Google Play Android Developer API” and invite the account in Play Console (Users and
   permissions). Keep the JSON file outside the repository.
6. **Listings, graphics and screenshots:**

   ```bash
   cd mobile && SUPPLY_JSON_KEY=~/keys/play.json fastlane android metadata
   ```

7. **Later packages:**

   ```bash
   cd mobile && SUPPLY_JSON_KEY=~/keys/play.json LIMECONTROL_BUILD=2 fastlane android internal
   ```

   The package lands as a draft on the internal testing track.
8. **“App content” forms** — see the [answers below](#suggested-answers-to-the-store-forms).
9. **Testing, promotion to production and sending for review** — by hand in the console.

The fastlane commands never publish anything to users and never send the app for review.

## Suggested answers to the store forms

Suggestions that follow from how the app works. The declarations are made by the publisher — read
the definitions in each form before confirming them.

| Form | Answer | Why |
|---|---|---|
| App Store: App Privacy | **Data Not Collected** | The publisher receives no data: no accounts, analytics or ads. The app connects only to the server the user enters. |
| Google Play: Data safety | Collects and shares no data | As above. Sign-in details go only to the user's own server, at the user's request; the publisher has no access to them. |
| Privacy policy | `https://limecontrol.eu/en/privacy.html` · `https://limecontrol.eu/prywatnosc.html` | The link is also in the app footer. |
| Encryption (App Store) | No proprietary cryptography | `ITSAppUsesNonExemptEncryption = false` in `Info.plist`; the app only uses the system's HTTPS. |
| Age rating | Lowest (every answer “no”) | No sensitive content, chat, user-generated content, gambling or web browser. |
| Target audience (Google Play) | 18 and over | A professional tool; not directed at children. |
| Ads | No | — |
| In-app purchases | No | The app is free; it sells and unlocks nothing. |
| App access / demo account | Sign-in required — provide the demo instance details | Text: [`store/review-notes.md`](store/review-notes.md). |
| Category | Business (secondary: Productivity) | — |
| Permissions (Android) | `INTERNET` only | No access to location, contacts, camera or files. |

## Store rules reflected in the app

- **Trademark.** The name, subtitle and keywords do not contain the word “LimeSurvey”. The
  description uses it only to state compatibility and ends with a note about independence from
  LimeSurvey GmbH; the same note is in the app footer.
- **Payments.** The “Buy me a coffee” link is hidden in the mobile app and the StrefaAnkiet card
  leads to the documentation, not to an offer — the stores do not allow external payments.
- **Privacy.** A privacy policy link in the footer, the iOS privacy manifest
  (`PrivacyInfo.xcprivacy`), no cloud backup of app data on Android.
- **Security.** Server passwords are never stored; the Android release build blocks unencrypted
  connections.
- **Listings.** The App Store description does not mention other platforms.

## Verification status

Verified locally: launch and the main paths in the iOS simulator (iPhone, iOS 27.2) and in an
Android 16 emulator — connecting to a server, survey list and details, sharing, CSV export, import
from the template library, the Back button, light and dark appearance following the system. The
`Release` configuration compiles on both platforms (iOS without signing, Android as an unsigned AAB).

Not verified yet:

- **Android with a current WebView.** The emulator ships WebView 133, where Capacitor leaves room
  for the system bars. Devices with WebView 140 or later (most phones) draw the content under the
  system bars and use the same CSS rules (`env(safe-area-inset-*)`) as iOS, where they were
  verified. Look at the app on a physical Android phone before publishing.
- **Whatever needs the publisher's accounts:** signed builds, testing on physical devices, the
  fastlane commands against real accounts (their syntax, the missing-credential messages and the
  option names, file names and screenshot sizes were checked against fastlane 2.238) and the store
  review itself.
