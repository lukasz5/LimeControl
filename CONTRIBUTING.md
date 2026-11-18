# Contributing to LimeControl

Thank you for helping! Issues and pull requests are welcome **in English or Polish**
(zgłoszenia i poprawki po polsku są równie mile widziane).

## Ways to help

- **Report a bug** or propose a feature in [GitHub Issues](https://github.com/lukasz5/LimeControl/issues).
  For a bug, include the LimeSurvey version, the connection mode (direct / relay) and the relevant lines of
  the app's *RPC log* panel — with passwords, tokens and participant data removed.
- **Add a survey template** — one JSON file, see [survey-templates/README.md](./survey-templates/README.md).
- **Improve a theme** or add a new one — see [limesurvey-themes/README.md](./limesurvey-themes/README.md).
- **Translate** — the interface texts are in `src/i18n/en.ts`.
- **Spot a mistake on limecontrol.eu?** Open an issue. The website (`site/`, `site-src/`) is maintained by
  the authors and is not open source, so please do not send pull requests that rewrite its content.
- **Report a security problem privately** — see [SECURITY.md](./SECURITY.md); please do not open a public issue.

## Development setup

```bash
git clone https://github.com/lukasz5/LimeControl.git
cd LimeControl
npm install
npm run dev        # http://localhost:3000
```

Without `firebase-applet-config.json` the app runs in local mode: the server prints an access key on start
and stores it in `data/access-key`. To test against LimeSurvey you need an instance with JSON-RPC enabled —
[limesurvey-stack](https://github.com/lukasz5/limesurvey-stack) gives you one in a few minutes. Use a test
instance: several features create, change or delete surveys.

## Before you open a pull request

```bash
npm run lint          # TypeScript
npm test              # unit tests
npm run build         # the app still builds
npm run build:site    # only if you touched themes, templates or the website
npm run check:site    # links, anchors and language versions
npm run build:mobile  # only if you touched the mobile app (mobile/, capacitor.config.ts); see mobile/README.en.md
```

- Keep a pull request focused on one change; describe what you tested and on which LimeSurvey version.
- **Both languages.** Every user-visible text needs Polish and English: `t('Polski tekst')` in the code plus a
  key in `src/i18n/en.ts` (a test fails when it is missing), and both `pl` and `en` in templates and themes.
- **Generated files are committed.** `site/` and `public/szablony-ankiet/` are build output — change the
  sources (`limesurvey-themes/`, `survey-templates/`), run `npm run build:site` and commit both.
- **Accessibility.** The themes target WCAG 2.2 AA; the theme build fails on insufficient contrast. Keep
  touch targets at 44 px or more in the app and label every control.
- **Security.** Never log or store LimeSurvey passwords, session keys or access tokens. Outbound requests
  from the server go through `server/netguard.ts`.
- Add or update tests in `tests/` for server and service logic.

## Commit messages

Short, imperative, in English, with a conventional prefix where it fits:
`feat: …`, `fix: …`, `docs: …`, `style: …`, `test: …`, `chore: …` (optionally with a scope, e.g. `feat(site): …`).

## Licensing of contributions

By contributing you agree that your work is released under the licence of the part you change:
**GPL-2.0-or-later** for the app, the server, the mobile app, the themes and the deployment kits, and
**CC0 1.0** for survey templates (`survey-templates/`). The website (`site/`, `site-src/`) is not open
source — see `site-src/LICENSE.md`. Only submit content you have the right to share —
in particular, do not copy questionnaires that are under someone else's copyright.
