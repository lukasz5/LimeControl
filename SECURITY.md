# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately by email to **info@strefabadan.pl** with the subject `LimeControl security`
(English or Polish). If private vulnerability reporting is enabled for this repository, you can also use
*Security → Report a vulnerability* on GitHub.

Include, as far as you can:

- the affected part (app, server relay, scheduler, StrefaAnkiet connector, a theme, a deployment kit),
- the version or commit, and whether it concerns the hosted service or a self-hosted installation,
- steps to reproduce and the impact you expect.

Do not include real passwords, access keys or participant data — test values are enough.
You will get a reply as soon as possible; please allow time for a fix before publishing details.

## Supported versions

Security fixes go into the latest release on the `main` branch. The hosted service at
`app.limecontrol.eu` is always deployed from `main`. If you self-host, update with
`git pull && docker compose up -d --build`.

## Scope notes

- LimeControl talks to LimeSurvey through the RemoteControl 2 API. Vulnerabilities in LimeSurvey itself
  should be reported to the [LimeSurvey project](https://www.limesurvey.org).
- The StrefaAnkiet plugins and platform are separate, closed-source products and are not covered by this
  repository.
- The self-hosted mode uses a single access key for the whole installation. Anyone who has the key has
  full access to that installation — treat it like a password and always serve the app over HTTPS.

## How the app protects data (summary)

- LimeSurvey passwords are never written to the database or to `localStorage`.
- Scheduled-job passwords are encrypted at rest (AES-256-GCM) and removed after the job runs.
- The relay and the connector require sign-in, are rate-limited, allow HTTP/HTTPS only, do not follow
  redirects, and pin the resolved IP address; the public service refuses private network addresses.

---

**PL:** Lukę w zabezpieczeniach zgłoś prywatnie na adres **info@strefabadan.pl** (temat: `LimeControl security`),
nie przez publiczne zgłoszenie. Opisz, czego dotyczy problem, jak go odtworzyć i jaki może mieć skutek —
bez prawdziwych haseł, kluczy i danych uczestników.
