# Notatki dla recenzentów sklepów / Notes for store reviewers

**PL:** Teksty poniżej są po angielsku, bo recenzenci nie czytają po polsku. Pierwszy wklej
w App Store Connect → *App Review Information → Notes* (login i hasło demo mają tam osobne pola).
Drugi, krótszy — w Google Play Console → *Zawartość aplikacji → Dostęp do aplikacji* (pole
z instrukcjami ma limit znaków; login i hasło podajesz w osobnych polach). Uzupełnij pola
w nawiasach ostrych danymi **instancji demonstracyjnej**
(patrz [README](../README.md#instancja-demonstracyjna-dla-recenzentów)). Hasła nie zapisuj w repozytorium.

**EN:** The texts below are in English for the reviewers. Paste the first one into App Store
Connect → *App Review Information → Notes* (the demo user name and password have their own fields
there). Paste the second, shorter one into Google Play Console → *App content → App access* (the
instructions field has a character limit; the user name and password go into separate fields).
Fill in the fields in angle brackets with the details of your **demo instance**
(see the [README](../README.en.md#demo-instance-for-reviewers)). Never commit the password to the repository.

---

## App Store Connect — App Review Information → Notes

```text
LimeControl is a free, open-source client for survey servers that run the LimeSurvey software.
It manages surveys through the server's official RemoteControl 2 (JSON-RPC) API.

The app has no accounts of its own and nothing to buy: there is no registration, no in-app
purchase, no subscription, no advertising and no analytics or tracking. The user enters the
address of their own survey server and signs in with that server's user name and password.
Server profiles are stored on the device only; the password is never stored.

DEMO SERVER FOR REVIEW

  Server address:  <DEMO_URL>
  User name:       <DEMO_USER>
  Password:        <DEMO_PASSWORD>

The demo server contains fictitious surveys, responses and participants (example.com addresses).

HOW TO SIGN IN

1. Launch the app and open the "Instances" tab (bottom bar).
2. In the "Add LimeSurvey instance" form enter the server address above in
   "Instance URL or RPC endpoint", the user name in "Admin username" and the password in "Password".
3. Tap "Save profile and connect".

WHAT TO LOOK AT

- "Surveys" tab: the list of surveys with response statistics. Tap a survey to see the response
  summary and charts, the public link with a QR code, CAPI (interviewer) mode, the survey theme,
  activation and expiry controls, and the export of responses to CSV, Excel or JSON
  (saved through the system share sheet).
- "Template library" button on the "Surveys" tab: 12 ready-made questionnaires that can be
  imported into the server.
- "Participants" tab: choose the NPS survey to see the participant list, add a participant and
  send invitations or reminders.
- "Schedule" tab: scheduling runs on an optional self-hosted LimeControl server, so the tab only
  explains how to connect one. It is not needed to use the app.

NATIVE FUNCTIONALITY

The app is not a wrapper around a website: there is no LimeControl web service behind it. It
connects directly from the device to the user's server through the native networking layer,
stores server profiles in native storage, shares links and exports files through the system
share sheet, follows the system light or dark appearance and respects the screen's safe areas.

TRADEMARK NOTE

LimeSurvey is a registered trademark of LimeSurvey GmbH. LimeControl is an independent project
and is not affiliated with LimeSurvey GmbH. The name appears in the description and in the app
only to state which server software the app is compatible with.

Source code (GPL-2.0-or-later): https://github.com/lukasz5/LimeControl
Privacy policy: https://limecontrol.eu/en/privacy.html
Contact: info@strefabadan.pl
```

## Google Play Console — App access

```text
LimeControl has no accounts of its own: it signs in to the user's own survey server.
Demo server address: <DEMO_URL>
In the app open the "Instances" tab, enter the address in "Instance URL or RPC endpoint",
the user name in "Admin username" and the password, then tap "Save profile and connect".
The demo server contains fictitious data only. The "Schedule" tab needs an optional
self-hosted server and is not required to use the app.
```
