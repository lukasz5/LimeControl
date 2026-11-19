// Strona „Wtyczki StrefaAnkiet” — darmowe wtyczki łączące LimeSurvey z platformą StrefaAnkiet
// oraz płatne usługi platformy (konto, zarządzany Amazon SES, telefonia VoIP).
//   site/wtyczki.html (PL), site/en/plugins.html (EN) i site/de/plugins.html (DE)
import {
  APP_URL, CONTACT_EMAIL, PLUGINS_URL, ROUTES, STREFAANKIET_PRICING_URL, STREFAANKIET_URL,
  esc, homeUrl, layout, outputPath,
} from '../chrome.mjs';

/** Stan pakietu wtyczek opisany na stronie — zaktualizuj przy nowym wydaniu StrefaAnkiet dla LimeSurvey. */
const SUITE = { version: '0.9', testedOn: '6.15 i 7.10', testedOnEn: '6.15 and 7.10', testedOnDe: '6.15 und 7.10', php: '8.1' };

/** account: false = wtyczka działa samodzielnie, bez konta StrefaAnkiet. */
const PLUGINS = [
  {
    id: 'StrefaWorkspace',
    account: true,
    title: { pl: 'Menu badania', en: 'Study menu', de: 'Studienmenü' },
    lead: {
      pl: 'Łączy ankietę LimeSurvey z badaniem w StrefieAnkiet i dodaje do menu ankiety skróty do całego warsztatu.',
      en: 'Links a LimeSurvey survey to a study in StrefaAnkiet and adds shortcuts to the whole workspace to the survey menu.',
      de: 'Verknüpft eine LimeSurvey-Umfrage mit einer Studie in StrefaAnkiet und ergänzt das Umfragemenü um Verknüpfungen zum gesamten Arbeitsbereich.',
    },
    points: {
      pl: ['Realizacja CAWI, CATI i CAPI, wyniki, analizy, respondenci i zespół — z poziomu ankiety', 'Jawne mapowanie numeru ankiety (SID) na badanie', 'Linki nie nadają uprawnień — obowiązują role z platformy'],
      en: ['CAWI, CATI and CAPI fieldwork, results, analyses, respondents and team — from within the survey', 'An explicit mapping of the survey ID (SID) to a study', 'Links grant no permissions — the platform roles still apply'],
      de: ['CAWI-, CATI- und CAPI-Feldarbeit, Ergebnisse, Analysen, Befragte und Team — direkt aus der Umfrage', 'Eine explizite Zuordnung der Umfrage-ID (SID) zu einer Studie', 'Links vergeben keine Rechte — es gelten die Rollen der Plattform'],
    },
  },
  {
    id: 'StrefaInvitationRelay',
    account: true,
    title: { pl: 'Wysyłki przez Amazon SES', en: 'Mailing through Amazon SES', de: 'Versand über Amazon SES' },
    lead: {
      pl: 'Zaproszenia i przypomnienia LimeSurvey wysyłane kanałem Amazon SES Twojej firmy w StrefieAnkiet — bez zmiany sposobu pracy z uczestnikami.',
      en: 'LimeSurvey invitations and reminders sent through your company’s Amazon SES channel in StrefaAnkiet — without changing how you work with participants.',
      de: 'Einladungen und Erinnerungen aus LimeSurvey, verschickt über den Amazon-SES-Kanal Ihres Unternehmens in StrefaAnkiet — ohne die Arbeit mit Teilnehmern zu ändern.',
    },
    points: {
      pl: ['Odbiorcy, tokeny i treści zostają w LimeSurvey', 'Potwierdzenia doręczeń, odbicia i skargi w historii wysyłek', 'Ochrona przed podwójną wysyłką', 'Klucze AWS pozostają po stronie platformy'],
      en: ['Recipients, tokens and content stay in LimeSurvey', 'Delivery confirmations, bounces and complaints in the mailing history', 'Protection against duplicate sending', 'AWS keys stay on the platform side'],
      de: ['Empfänger, Tokens und Inhalte bleiben in LimeSurvey', 'Zustellbestätigungen, Bounces und Beschwerden im Versandverlauf', 'Schutz vor doppeltem Versand', 'AWS-Schlüssel bleiben auf der Plattformseite'],
    },
  },
  {
    id: 'StrefaResearch',
    account: true,
    title: { pl: 'Realizacja CATI i CAPI, analizy', en: 'CATI and CAPI fieldwork, analysis', de: 'CATI- und CAPI-Feldarbeit, Analyse' },
    lead: {
      pl: 'Panel pracy badawczej osadzony w LimeSurvey: przydziały ankieterów, koordynacja rozmów telefonicznych i analiza odpowiedzi.',
      en: 'A research workspace embedded in LimeSurvey: interviewer assignments, telephone fieldwork coordination and response analysis.',
      de: 'Ein in LimeSurvey eingebetteter Forschungsarbeitsplatz: Interviewer-Zuteilungen, Koordination der Telefonfeldarbeit und Antwortanalyse.',
    },
    points: {
      pl: ['CAPI: przydziały, cele i terminy dla ankieterów; wywiad w natywnej ankiecie LimeSurvey', 'CATI: próba, kolejka spraw, przydziały, oddzwonienia i przekazania między ankieterami', 'Kwoty próby i postęp realizacji w jednym widoku', 'Analiza: wersje zbiorów danych, słownik zmiennych, analizy w R, raporty'],
      en: ['CAPI: assignments, targets and deadlines for interviewers; the interview runs in the native LimeSurvey survey', 'CATI: sample, case queue, assignments, callbacks and handovers between interviewers', 'Sample quotas and fieldwork progress in one view', 'Analysis: dataset versions, variable dictionary, analyses in R, reports'],
      de: ['CAPI: Zuteilungen, Ziele und Fristen für Interviewer; das Interview läuft in der nativen LimeSurvey-Umfrage', 'CATI: Stichprobe, Fallwarteschlange, Zuteilungen, Rückrufe und Übergaben zwischen Interviewern', 'Stichprobenquoten und Feldfortschritt in einer Ansicht', 'Analyse: Datensatzversionen, Variablenverzeichnis, Analysen in R, Berichte'],
    },
  },
  {
    id: 'StrefaSurveyExchange',
    account: false,
    title: { pl: 'Wymiana kwestionariuszy', en: 'Questionnaire exchange', de: 'Fragebogenaustausch' },
    lead: {
      pl: 'Pobiera kwestionariusz z LimeSurvey jako strukturę .lss albo pakiet JSON z mapą pól i raportem różnic.',
      en: 'Downloads a questionnaire from LimeSurvey as an .lss structure or a JSON package with a field map and a difference report.',
      de: 'Lädt einen Fragebogen aus LimeSurvey als .lss-Struktur oder als JSON-Paket mit Feldzuordnung und Differenzbericht herunter.',
    },
    points: {
      pl: ['Eksport struktury (.lss) lub pakietu JSON z mapą kodów pól', 'Lista elementów, których nie da się przenieść — bez cichego upraszczania', 'Ustawienia innych wtyczek są usuwane z eksportu'],
      en: ['Export of the structure (.lss) or a JSON package with a field-code map', 'A list of elements that cannot be transferred — nothing is silently simplified', 'Settings of other plugins are stripped from the export'],
      de: ['Export der Struktur (.lss) oder eines JSON-Pakets mit Feldcode-Zuordnung', 'Eine Liste nicht übertragbarer Elemente — nichts wird stillschweigend vereinfacht', 'Einstellungen anderer Plugins werden aus dem Export entfernt'],
    },
  },
  {
    id: 'StrefaResponseExport',
    account: false,
    title: { pl: 'Eksport odpowiedzi', en: 'Response export', de: 'Antwortexport' },
    lead: {
      pl: 'Udostępnia zakodowane odpowiedzi aktywnej ankiety do analiz — stronicowane i bez technicznych identyfikatorów.',
      en: 'Provides coded responses of an active survey for analysis — paginated and without technical identifiers.',
      de: 'Stellt die codierten Antworten einer aktiven Umfrage für Analysen bereit — seitenweise und ohne technische Kennungen.',
    },
    points: {
      pl: ['Pomija tokeny, adresy IP i adres odsyłający', 'Wymaga uprawnień odczytu i eksportu odpowiedzi do konkretnej ankiety', 'Pobieranie załączników z pytań plikowych'],
      en: ['Skips tokens, IP addresses and the referrer', 'Requires read and export permissions for the specific survey', 'Download of attachments from file-upload questions'],
      de: ['Lässt Tokens, IP-Adressen und den Referrer weg', 'Erfordert Lese- und Exportrechte für die jeweilige Umfrage', 'Download von Anhängen aus Datei-Upload-Fragen'],
    },
  },
  {
    id: 'StrefaConverters',
    account: false,
    tool: true,
    title: { pl: 'Konwertery (wiersz poleceń)', en: 'Converters (command line)', de: 'Konverter (Kommandozeile)' },
    lead: {
      pl: 'Niezależne narzędzia do konwersji kwestionariuszy i odpowiedzi — przydatne przy migracjach i archiwizacji.',
      en: 'Standalone tools for converting questionnaires and responses — useful for migrations and archiving.',
      de: 'Eigenständige Werkzeuge zum Konvertieren von Fragebögen und Antworten — nützlich für Migrationen und Archivierung.',
    },
    points: {
      pl: ['LSS ↔ JSON z kontrolą sumy SHA-256', 'Odpowiedzi z JSON, CSV i eksportu VV', 'Zachowuje kody z zerami wiodącymi (np. 001) jako tekst'],
      en: ['LSS ↔ JSON with a SHA-256 checksum', 'Responses from JSON, CSV and the VV export', 'Keeps codes with leading zeros (e.g. 001) as text'],
      de: ['LSS ↔ JSON mit SHA-256-Prüfsumme', 'Antworten aus JSON, CSV und dem VV-Export', 'Behält Codes mit führenden Nullen (z. B. 001) als Text'],
    },
  },
];

const S = {
  pl: {
    title: 'Darmowe wtyczki StrefaAnkiet dla LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'Wtyczki StrefaAnkiet dla LimeSurvey są bezpłatne i mają otwarty kod. Łączą ankietę z platformą StrefaAnkiet: zarządzana wysyłka przez Amazon SES, telefonia VoIP do wywiadów CATI, praca ankieterów CAPI i analiza wyników. Płatne jest konto i usługi platformy.',
    ogTitle: 'Darmowe wtyczki łączące LimeSurvey ze StrefąAnkiet',
    eyebrow: 'Darmowe wtyczki dla LimeSurvey',
    h1: 'Połącz LimeSurvey ze StrefąAnkiet. <span class="lime">Wtyczki są darmowe</span>.',
    lead: 'Wtyczki StrefaAnkiet dla LimeSurvey są bezpłatne i mają otwarty kod. Łączą Twoją ankietę z platformą <strong>StrefaAnkiet</strong> — a płacisz dopiero za konto i usługi, z których korzystasz: zarządzaną wysyłkę przez Amazon SES, telefonię VoIP do wywiadów CATI, pracę ankieterów w terenie i analizę wyników. Respondent nadal wypełnia tę samą ankietę LimeSurvey.',
    ctaDownload: 'Pobierz wtyczki',
    ctaAsk: 'Poproś o wtyczki',
    ctaPricing: 'Cennik StrefaAnkiet',
    meta: ['Wtyczki: 0 zł, otwarty kod', `Sprawdzone na LimeSurvey ${SUITE.testedOn}`, `PHP ${SUITE.php}+`, 'Dane zostają w Twoim LimeSurvey'],
    ids: { model: 'darmowe-i-platne', modes: 'tryby', plugins: 'wtyczki', compare: 'porownanie', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'Jak to działa',
    modelH: 'Darmowe oprogramowanie, płatne usługi',
    modelP: 'Oprogramowanie instalujesz u siebie za darmo. Płatne jest to, czego nie da się rozdać jako kodu: infrastruktura wysyłkowa, telefonia i konto zespołu na platformie.',
    freeTag: 'Bezpłatnie',
    freeH: 'Wtyczki i narzędzia',
    freeP: 'Instalujesz je w swoim LimeSurvey i używasz bez ograniczeń czasowych.',
    freeList: [
      'Sześć wtyczek i narzędzi StrefaAnkiet dla LimeSurvey — z kodem źródłowym',
      'Wymiana kwestionariuszy, eksport odpowiedzi i konwertery działają bez konta',
      `Aplikacja LimeControl (iOS, Android, web), <a href="${ROUTES.themes.pl}">motywy</a> i <a href="${ROUTES.templates.pl}">szablony ankiet</a>`,
      `Zestawy wdrożeniowe Docker dla LimeSurvey i LimeControl`,
    ],
    paidTag: 'Konto StrefaAnkiet',
    paidH: 'Usługi platformy',
    paidP: 'Abonament platformy oraz usługi dodatkowe rozliczane według użycia. Zakres dobierasz do badania.',
    paidList: [
      '<strong>Zarządzany Amazon SES</strong> — podajesz nadawcę i dodajesz trzy rekordy DNS; bez własnego konta AWS i bez kluczy',
      '<strong>Telefonia VoIP do CATI</strong> — telefon w przeglądarce ankietera, serwer VoIP StrefyAnkiet, numer, połączenia i nagrania',
      '<strong>Praca w terenie (CAPI)</strong> — przydziały i cele ankieterów, aplikacja ankietera do pracy bez sieci',
      '<strong>Przestrzeń zespołu</strong> — projekty, role, kwoty między trybami, analizy w R i raporty PDF/DOCX',
    ],
    paidNote: 'Telefonia, masowe wysyłki, transkrypcja i AI wymagają osobnej konfiguracji i mają własne warunki rozliczenia.',
    ctaTalk: 'Porozmawiajmy',
    modesEyebrow: 'Tryby realizacji',
    modesH: 'Jedna ankieta, trzy sposoby zbierania odpowiedzi',
    modesP: 'Kwestionariusz i odpowiedzi pozostają w LimeSurvey. Zmienia się tylko to, kto i jak prowadzi wywiad.',
    modes: [
      ['CAWI', 'Ankieta internetowa', 'Respondent wypełnia ankietę sam, z linku lub zaproszenia e-mail. To natywny tryb LimeSurvey — w LimeControl aktywujesz ankietę, wysyłasz zaproszenia i śledzisz wyniki.', 'Darmowe w LimeControl'],
      ['CATI', 'Wywiad telefoniczny', 'Ankieter dzwoni i zapisuje odpowiedzi. Platforma dodaje próbę, kolejkę spraw, przydziały, oddzwonienia, telefon w przeglądarce i nagrania rozmów.', 'Darmowa wtyczka + telefonia StrefaAnkiet'],
      ['CAPI', 'Wywiad bezpośredni', 'Ankieter prowadzi wywiad na tablecie lub telefonie. Platforma dodaje przydziały z celami i terminami, potwierdzanie wywiadów oraz aplikację ankietera do pracy bez sieci.', 'Darmowa wtyczka + konto StrefaAnkiet'],
      ['Mixed-mode', 'Łączenie trybów', 'Jedno badanie realizowane kilkoma kanałami, ze wspólnymi kwotami, jednym zbiorem danych i analizą w R.', 'Konto StrefaAnkiet'],
    ],
    pluginsEyebrow: 'Pakiet wtyczek',
    pluginsH: 'StrefaAnkiet dla LimeSurvey',
    pluginsP: 'Sześć niezależnych elementów — instalujesz tylko te, których potrzebujesz. Wtyczki nie dodają własnych tabel do bazy LimeSurvey.',
    statusFree: 'Działa bez konta',
    statusAccount: 'Wymaga konta StrefaAnkiet',
    pluginLabel: 'Wtyczka',
    toolLabel: 'Pakiet narzędzi',
    releaseReady: (url) => `<strong>Pobieranie i kod źródłowy.</strong> Aktualne wydanie pakietu (${SUITE.version}) wraz z instrukcją instalacji jest dostępne w <a href="${url}" target="_blank" rel="noopener">publicznym repozytorium wtyczek</a>. Sprawdzone na LimeSurvey ${SUITE.testedOn}.`,
    releasePending: (mailto) => `<strong>Stan wydania.</strong> Pakiet jest w wersji kandydującej ${SUITE.version} (pilotaż), sprawdzony na LimeSurvey ${SUITE.testedOn}. Publiczne repozytorium z paczkami instalacyjnymi jest w przygotowaniu — do tego czasu <a href="${mailto}">napisz do nas</a>, a prześlemy wtyczki bezpłatnie razem z instrukcją.`,
    compareEyebrow: 'Co jest darmowe, a co płatne',
    compareH: 'Od darmowych narzędzi do usług platformy',
    compareP: 'Zacznij od tego, co darmowe. Konto StrefaAnkiet dołączasz, gdy badanie potrzebuje infrastruktury i zespołu.',
    compareHead: ['Potrzeba', 'Bezpłatnie — LimeControl i wtyczki', 'Płatnie — konto i usługi StrefaAnkiet'],
    compare: [
      ['Zarządzanie ankietami z telefonu', 'Aplikacja na iOS, Androida i web: aktywacja, harmonogram, uczestnicy, eksport', '—'],
      ['Wygląd ankiety', 'Osiem motywów WCAG 2.2 AA, w tym CATI i CAPI', '—'],
      ['Gotowe kwestionariusze', 'Dwanaście szablonów PL/EN, w tym szkielety CATI i CAPI', 'Biblioteka szablonów badań i raportów'],
      ['Połączenie LimeSurvey z platformą', 'Wtyczki: instalacja, aktualizacje i kod źródłowy', 'Konto organizacji z rolami zespołu'],
      ['Wysyłka zaproszeń', 'Poczta LimeSurvey, harmonogram zaproszeń i przypomnień w LimeControl', 'Zarządzany Amazon SES: nadawca we własnej domenie, potwierdzenia doręczeń, odbicia i skargi'],
      ['Wywiady telefoniczne', 'Motyw CATI ze skrótami klawiszowymi, szkielet wywiadu z wynikiem kontaktu', 'Kolejka spraw, przydziały, oddzwonienia, telefon VoIP w przeglądarce, serwer VoIP, nagrania'],
      ['Wywiady terenowe', 'Motyw CAPI i pętla wywiadów na tablecie (online)', 'Przydziały i cele ankieterów, potwierdzanie wywiadów, aplikacja do pracy bez sieci'],
      ['Kwoty i kontrola jakości', 'Natywne kwoty LimeSurvey', 'Kwoty łączone między trybami, kontrola jakości wywiadów'],
      ['Analiza wyników', 'Podsumowania i wykresy, eksport CSV / Excel / JSON, konwertery', 'Wersjonowane zbiory, analizy w R, raporty PDF i DOCX'],
      ['Serwer ankiet', 'Zestawy Docker do samodzielnej instalacji', `<a href="${homeUrl('pl', 'hosting')}">Wdrożenie i utrzymanie serwera ankietowego</a> przez strefabadan.pl`],
    ],
    connectEyebrow: 'Połączenie z LimeControl',
    connectH: 'Postęp realizacji w aplikacji',
    connectP: 'Jeśli ankieta jest powiązana z badaniem w StrefieAnkiet, LimeControl pokaże przy niej stan realizacji — bez otwierania panelu.',
    connectList: [
      '<strong>CAPI</strong> — ukończone wywiady, przydziały ankieterów i ich postęp względem celu.',
      '<strong>CATI</strong> — liczba spraw w kolejce, sprawy bez przydziału i sprawy wymagające uwagi.',
      '<strong>Tylko odczyt</strong> — aplikacja niczego nie zmienia w badaniu; potrzebuje klucza dostępu z zakresami <code>fieldwork.read</code> i <code>cati.read</code>.',
      '<strong>Klucz zostaje u Ciebie</strong> — jest trzymany wyłącznie w pamięci otwartej karty, tak jak hasła do LimeSurvey.',
    ],
    connectCta: 'Jak połączyć konto',
    startEyebrow: 'Jak zacząć',
    startH: 'Cztery kroki — trzy pierwsze są darmowe',
    start: [
      ['Przygotuj serwer ankiet', `Użyj własnej instancji LimeSurvey, darmowego zestawu Docker albo zleć nam <a href="${homeUrl('pl', 'hosting')}">wdrożenie i utrzymanie serwera</a>.`],
      ['Dodaj motyw i szablon', `Zainstaluj <a href="${ROUTES.themes.pl}#cati">motyw CATI lub CAPI</a> i zaimportuj <a href="${ROUTES.templates.pl}#wywiad-cati">szkielet wywiadu</a>.`],
      ['Zainstaluj darmowe wtyczki', 'Wgraj paczki w menedżerze wtyczek LimeSurvey i wskaż, która ankieta odpowiada któremu badaniu.'],
      ['Włącz usługi, gdy ich potrzebujesz', `Załóż konto StrefaAnkiet, skonfiguruj wysyłkę lub telefonię i śledź postęp w <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Planujesz badanie CATI lub CAPI?',
    ctaP: 'Opisz badanie — liczbę wywiadów, tryby i terminy. Odpowiemy, co zrobisz darmowymi narzędziami, a gdzie przyda się konto StrefaAnkiet.',
    mailSubject: 'Wtyczki StrefaAnkiet dla LimeSurvey',
    footerNote: 'StrefaAnkiet i LimeControl są rozwijane przez <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a>.',
  },
  en: {
    title: 'Free StrefaAnkiet plugins for LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'The StrefaAnkiet plugins for LimeSurvey are free and open source. They connect a survey to the StrefaAnkiet platform: managed mailing through Amazon SES, VoIP telephony for CATI interviews, CAPI fieldwork and response analysis. The platform account and services are paid.',
    ogTitle: 'Free plugins that connect LimeSurvey with StrefaAnkiet',
    eyebrow: 'Free plugins for LimeSurvey',
    h1: 'Connect LimeSurvey with StrefaAnkiet. <span class="lime">The plugins are free</span>.',
    lead: 'The StrefaAnkiet plugins for LimeSurvey are free of charge and open source. They connect your survey to the <strong>StrefaAnkiet</strong> platform — and you pay only for the account and the services you use: managed mailing through Amazon SES, VoIP telephony for CATI interviews, interviewers in the field and analysis of the results. Respondents still complete the same LimeSurvey survey.',
    ctaDownload: 'Download the plugins',
    ctaAsk: 'Request the plugins',
    ctaPricing: 'StrefaAnkiet pricing',
    meta: ['Plugins: free, open source', `Tested on LimeSurvey ${SUITE.testedOnEn}`, `PHP ${SUITE.php}+`, 'Data stays in your LimeSurvey'],
    ids: { model: 'free-and-paid', modes: 'modes', plugins: 'plugins', compare: 'compare', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'How it works',
    modelH: 'Free software, paid services',
    modelP: 'You install the software on your own server for free. What is paid is what cannot be handed out as code: mailing infrastructure, telephony and a team account on the platform.',
    freeTag: 'Free of charge',
    freeH: 'Plugins and tools',
    freeP: 'You install them in your LimeSurvey and use them with no time limit.',
    freeList: [
      'Six StrefaAnkiet plugins and tools for LimeSurvey — with source code',
      'Questionnaire exchange, response export and the converters work without an account',
      `The LimeControl app (iOS, Android, web), <a href="${ROUTES.themes.en}">themes</a> and <a href="${ROUTES.templates.en}">survey templates</a>`,
      'Docker deployment kits for LimeSurvey and LimeControl',
    ],
    paidTag: 'StrefaAnkiet account',
    paidH: 'Platform services',
    paidP: 'A platform subscription plus add-on services billed by usage. You match the scope to your study.',
    paidList: [
      '<strong>Managed Amazon SES</strong> — you enter the sender and add three DNS records; no AWS account of your own and no keys',
      '<strong>VoIP telephony for CATI</strong> — a phone in the interviewer’s browser, the StrefaAnkiet VoIP server, a number, calls and recordings',
      '<strong>Fieldwork (CAPI)</strong> — interviewer assignments and targets, an interviewer app that works offline',
      '<strong>Team workspace</strong> — projects, roles, quotas across modes, analyses in R and PDF/DOCX reports',
    ],
    paidNote: 'Telephony, bulk mailing, transcription and AI need separate configuration and have their own billing terms.',
    ctaTalk: 'Let’s talk',
    modesEyebrow: 'Fieldwork modes',
    modesH: 'One survey, three ways to collect responses',
    modesP: 'The questionnaire and the responses stay in LimeSurvey. Only who conducts the interview, and how, changes.',
    modes: [
      ['CAWI', 'Web survey', 'Respondents complete the survey themselves, from a link or an email invitation. This is the native LimeSurvey mode — in LimeControl you activate the survey, send invitations and follow the results.', 'Free in LimeControl'],
      ['CATI', 'Telephone interview', 'An interviewer calls and records the answers. The platform adds a sample, a case queue, assignments, callbacks, an in-browser phone and call recordings.', 'Free plugin + StrefaAnkiet telephony'],
      ['CAPI', 'Face-to-face interview', 'An interviewer conducts the interview on a tablet or phone. The platform adds assignments with targets and deadlines, interview confirmation and an interviewer app that works offline.', 'Free plugin + StrefaAnkiet account'],
      ['Mixed-mode', 'Combining modes', 'One study run through several channels, with shared quotas, one dataset and analysis in R.', 'StrefaAnkiet account'],
    ],
    pluginsEyebrow: 'The plugin suite',
    pluginsH: 'StrefaAnkiet for LimeSurvey',
    pluginsP: 'Six independent components — you install only the ones you need. The plugins do not add their own tables to the LimeSurvey database.',
    statusFree: 'Works without an account',
    statusAccount: 'Needs a StrefaAnkiet account',
    pluginLabel: 'Plugin',
    toolLabel: 'Tool package',
    releaseReady: (url) => `<strong>Download and source code.</strong> The current release of the suite (${SUITE.version}) and the installation guide are available in the <a href="${url}" target="_blank" rel="noopener">public plugin repository</a>. Tested on LimeSurvey ${SUITE.testedOnEn}.`,
    releasePending: (mailto) => `<strong>Release status.</strong> The suite is at release-candidate stage ${SUITE.version} (pilot), tested on LimeSurvey ${SUITE.testedOnEn}. A public repository with the installation packages is being prepared — until then <a href="${mailto}">write to us</a> and we will send you the plugins free of charge together with the guide.`,
    compareEyebrow: 'What is free and what is paid',
    compareH: 'From free tools to platform services',
    compareP: 'Start with what is free. Add a StrefaAnkiet account when a study needs infrastructure and a team.',
    compareHead: ['Need', 'Free — LimeControl and the plugins', 'Paid — StrefaAnkiet account and services'],
    compare: [
      ['Managing surveys from a phone', 'The iOS, Android and web app: activation, scheduling, participants, export', '—'],
      ['Survey look', 'Eight WCAG 2.2 AA themes, including CATI and CAPI', '—'],
      ['Ready-made questionnaires', 'Twelve EN/PL templates, including CATI and CAPI skeletons', 'A library of study and report templates'],
      ['Connecting LimeSurvey to the platform', 'The plugins: installation, updates and source code', 'An organisation account with team roles'],
      ['Sending invitations', 'LimeSurvey mail, scheduled invitations and reminders in LimeControl', 'Managed Amazon SES: a sender on your own domain, delivery confirmations, bounces and complaints'],
      ['Telephone interviews', 'The CATI theme with keyboard shortcuts, an interview skeleton with call outcome', 'Case queue, assignments, callbacks, in-browser VoIP phone, VoIP server, recordings'],
      ['Field interviews', 'The CAPI theme and the interview loop on a tablet (online)', 'Interviewer assignments and targets, interview confirmation, an offline app'],
      ['Quotas and quality control', 'Native LimeSurvey quotas', 'Quotas shared across modes, interview quality control'],
      ['Analysing results', 'Summaries and charts, CSV / Excel / JSON export, converters', 'Versioned datasets, analyses in R, PDF and DOCX reports'],
      ['Survey server', 'Docker kits for installing it yourself', `<a href="${homeUrl('en', 'hosting')}">Survey server deployment and maintenance</a> by strefabadan.pl`],
    ],
    connectEyebrow: 'Connecting with LimeControl',
    connectH: 'Fieldwork progress in the app',
    connectP: 'If a survey is linked to a study in StrefaAnkiet, LimeControl shows its fieldwork status — without opening the panel.',
    connectList: [
      '<strong>CAPI</strong> — completed interviews, interviewer assignments and their progress against the target.',
      '<strong>CATI</strong> — the number of cases in the queue, unassigned cases and cases that need attention.',
      '<strong>Read-only</strong> — the app changes nothing in the study; it needs an access key with the <code>fieldwork.read</code> and <code>cati.read</code> scopes.',
      '<strong>The key stays with you</strong> — it is kept only in the memory of the open tab, just like LimeSurvey passwords.',
    ],
    connectCta: 'How to connect your account',
    startEyebrow: 'Getting started',
    startH: 'Four steps — the first three are free',
    start: [
      ['Set up a survey server', `Use your own LimeSurvey instance, the free Docker kit, or let us handle <a href="${homeUrl('en', 'hosting')}">deployment and maintenance</a>.`],
      ['Add a theme and a template', `Install the <a href="${ROUTES.themes.en}#cati">CATI or CAPI theme</a> and import an <a href="${ROUTES.templates.en}#wywiad-cati">interview skeleton</a>.`],
      ['Install the free plugins', 'Upload the packages in the LimeSurvey plugin manager and state which survey belongs to which study.'],
      ['Switch services on when you need them', `Create a StrefaAnkiet account, set up mailing or telephony and follow the progress in <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Planning a CATI or CAPI study?',
    ctaP: 'Describe the study — the number of interviews, the modes and the dates. We will tell you what the free tools can do and where a StrefaAnkiet account helps.',
    mailSubject: 'StrefaAnkiet plugins for LimeSurvey',
    footerNote: 'StrefaAnkiet and LimeControl are developed by <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a>.',
  },
  de: {
    title: 'Kostenlose StrefaAnkiet-Plugins für LimeSurvey — CATI, CAPI, Amazon SES',
    description: 'Die StrefaAnkiet-Plugins für LimeSurvey sind kostenlos und Open Source. Sie verbinden eine Umfrage mit der Plattform StrefaAnkiet: verwalteter Versand über Amazon SES, VoIP-Telefonie für CATI-Interviews, CAPI-Feldarbeit und Antwortanalyse. Kostenpflichtig sind das Plattformkonto und die Dienste.',
    ogTitle: 'Kostenlose Plugins, die LimeSurvey mit StrefaAnkiet verbinden',
    eyebrow: 'Kostenlose Plugins für LimeSurvey',
    h1: 'Verbinden Sie LimeSurvey mit StrefaAnkiet. <span class="lime">Die Plugins sind kostenlos</span>.',
    lead: 'Die StrefaAnkiet-Plugins für LimeSurvey sind kostenlos und Open Source. Sie verbinden Ihre Umfrage mit der Plattform <strong>StrefaAnkiet</strong> — bezahlt wird nur das Konto und die Dienste, die Sie nutzen: verwalteter Versand über Amazon SES, VoIP-Telefonie für CATI-Interviews, Interviewer im Feld und die Analyse der Ergebnisse. Befragte füllen weiterhin dieselbe LimeSurvey-Umfrage aus.',
    ctaDownload: 'Plugins herunterladen',
    ctaAsk: 'Plugins anfordern',
    ctaPricing: 'Preise von StrefaAnkiet',
    meta: ['Plugins: kostenlos, Open Source', `Getestet mit LimeSurvey ${SUITE.testedOnDe}`, `PHP ${SUITE.php}+`, 'Daten bleiben in Ihrem LimeSurvey'],
    ids: { model: 'kostenlos-und-kostenpflichtig', modes: 'modi', plugins: 'plugins', compare: 'vergleich', connect: 'limecontrol', start: 'start' },
    modelEyebrow: 'So funktioniert’s',
    modelH: 'Kostenlose Software, kostenpflichtige Dienste',
    modelP: 'Die Software installieren Sie kostenlos bei sich. Kostenpflichtig ist, was sich nicht als Code verschenken lässt: Versandinfrastruktur, Telefonie und ein Teamkonto auf der Plattform.',
    freeTag: 'Kostenlos',
    freeH: 'Plugins und Werkzeuge',
    freeP: 'Sie installieren sie in Ihrem LimeSurvey und nutzen sie ohne zeitliche Begrenzung.',
    freeList: [
      'Sechs StrefaAnkiet-Plugins und -Werkzeuge für LimeSurvey — mit Quellcode',
      'Fragebogenaustausch, Antwortexport und Konverter funktionieren ohne Konto',
      `Die App LimeControl (iOS, Android, Web), <a href="${ROUTES.themes.de}">Designs</a> und <a href="${ROUTES.templates.de}">Umfragevorlagen</a>`,
      'Docker-Deployment-Kits für LimeSurvey und LimeControl',
    ],
    paidTag: 'StrefaAnkiet-Konto',
    paidH: 'Dienste der Plattform',
    paidP: 'Ein Plattform-Abonnement plus nutzungsabhängig abgerechnete Zusatzdienste. Den Umfang wählen Sie passend zur Studie.',
    paidList: [
      '<strong>Verwaltetes Amazon SES</strong> — Sie geben den Absender an und ergänzen drei DNS-Einträge; ohne eigenes AWS-Konto und ohne Schlüssel',
      '<strong>VoIP-Telefonie für CATI</strong> — ein Telefon im Browser des Interviewers, der VoIP-Server von StrefaAnkiet, eine Rufnummer, Anrufe und Aufzeichnungen',
      '<strong>Feldarbeit (CAPI)</strong> — Zuteilungen und Ziele für Interviewer, eine Interviewer-App, die offline funktioniert',
      '<strong>Team-Arbeitsbereich</strong> — Projekte, Rollen, modusübergreifende Quoten, Analysen in R und Berichte als PDF/DOCX',
    ],
    paidNote: 'Telefonie, Massenversand, Transkription und KI erfordern eine eigene Konfiguration und haben eigene Abrechnungsbedingungen.',
    ctaTalk: 'Sprechen wir darüber',
    modesEyebrow: 'Erhebungsmodi',
    modesH: 'Eine Umfrage, drei Wege zu Antworten',
    modesP: 'Fragebogen und Antworten bleiben in LimeSurvey. Es ändert sich nur, wer das Interview führt und wie.',
    modes: [
      ['CAWI', 'Online-Umfrage', 'Befragte füllen die Umfrage selbst aus, über einen Link oder eine E-Mail-Einladung. Das ist der native Modus von LimeSurvey — in LimeControl aktivieren Sie die Umfrage, versenden Einladungen und verfolgen die Ergebnisse.', 'Kostenlos in LimeControl'],
      ['CATI', 'Telefoninterview', 'Ein Interviewer ruft an und erfasst die Antworten. Die Plattform ergänzt Stichprobe, Fallwarteschlange, Zuteilungen, Rückrufe, ein Telefon im Browser und Gesprächsaufzeichnungen.', 'Kostenloses Plugin + Telefonie von StrefaAnkiet'],
      ['CAPI', 'Persönliches Interview', 'Ein Interviewer führt das Interview auf Tablet oder Smartphone. Die Plattform ergänzt Zuteilungen mit Zielen und Fristen, die Bestätigung von Interviews und eine Interviewer-App, die offline funktioniert.', 'Kostenloses Plugin + StrefaAnkiet-Konto'],
      ['Mixed-Mode', 'Modi kombinieren', 'Eine Studie über mehrere Kanäle, mit gemeinsamen Quoten, einem Datensatz und Analyse in R.', 'StrefaAnkiet-Konto'],
    ],
    pluginsEyebrow: 'Das Plugin-Paket',
    pluginsH: 'StrefaAnkiet für LimeSurvey',
    pluginsP: 'Sechs unabhängige Bausteine — Sie installieren nur, was Sie brauchen. Die Plugins legen keine eigenen Tabellen in der LimeSurvey-Datenbank an.',
    statusFree: 'Funktioniert ohne Konto',
    statusAccount: 'Benötigt ein StrefaAnkiet-Konto',
    pluginLabel: 'Plugin',
    toolLabel: 'Werkzeugpaket',
    releaseReady: (url) => `<strong>Download und Quellcode.</strong> Die aktuelle Version des Pakets (${SUITE.version}) samt Installationsanleitung finden Sie im <a href="${url}" target="_blank" rel="noopener">öffentlichen Plugin-Repository</a>. Getestet mit LimeSurvey ${SUITE.testedOnDe}.`,
    releasePending: (mailto) => `<strong>Stand der Veröffentlichung.</strong> Das Paket liegt als Release Candidate ${SUITE.version} vor (Pilotphase), getestet mit LimeSurvey ${SUITE.testedOnDe}. Ein öffentliches Repository mit den Installationspaketen ist in Vorbereitung — bis dahin <a href="${mailto}">schreiben Sie uns</a>, und wir senden Ihnen die Plugins kostenlos samt Anleitung.`,
    compareEyebrow: 'Was kostenlos ist und was nicht',
    compareH: 'Von kostenlosen Werkzeugen zu Plattformdiensten',
    compareP: 'Beginnen Sie mit dem, was kostenlos ist. Ein StrefaAnkiet-Konto kommt dazu, wenn eine Studie Infrastruktur und ein Team braucht.',
    compareHead: ['Bedarf', 'Kostenlos — LimeControl und die Plugins', 'Kostenpflichtig — StrefaAnkiet-Konto und Dienste'],
    compare: [
      ['Umfragen vom Smartphone verwalten', 'Die App für iOS, Android und Web: Aktivierung, Zeitplan, Teilnehmer, Export', '—'],
      ['Aussehen der Umfrage', 'Acht Designs nach WCAG 2.2 AA, darunter CATI und CAPI', '—'],
      ['Fertige Fragebögen', 'Zwölf Vorlagen (EN/PL), darunter Gerüste für CATI und CAPI', 'Eine Bibliothek mit Studien- und Berichtsvorlagen'],
      ['LimeSurvey mit der Plattform verbinden', 'Die Plugins: Installation, Updates und Quellcode', 'Ein Organisationskonto mit Teamrollen'],
      ['Einladungen versenden', 'LimeSurvey-Mail, geplante Einladungen und Erinnerungen in LimeControl', 'Verwaltetes Amazon SES: Absender in der eigenen Domain, Zustellbestätigungen, Bounces und Beschwerden'],
      ['Telefoninterviews', 'Das CATI-Design mit Tastenkürzeln, ein Interviewgerüst mit Kontaktergebnis', 'Fallwarteschlange, Zuteilungen, Rückrufe, VoIP-Telefon im Browser, VoIP-Server, Aufzeichnungen'],
      ['Feldinterviews', 'Das CAPI-Design und die Interview-Schleife auf dem Tablet (online)', 'Zuteilungen und Ziele für Interviewer, Bestätigung von Interviews, eine Offline-App'],
      ['Quoten und Qualitätskontrolle', 'Native LimeSurvey-Quoten', 'Modusübergreifende Quoten, Qualitätskontrolle der Interviews'],
      ['Ergebnisse analysieren', 'Übersichten und Diagramme, Export als CSV / Excel / JSON, Konverter', 'Versionierte Datensätze, Analysen in R, Berichte als PDF und DOCX'],
      ['Umfrageserver', 'Docker-Kits zur eigenen Installation', `<a href="${homeUrl('de', 'hosting')}">Einrichtung und Betreuung eines Umfrageservers</a> durch strefabadan.pl`],
    ],
    connectEyebrow: 'Verbindung mit LimeControl',
    connectH: 'Feldfortschritt in der App',
    connectP: 'Ist eine Umfrage mit einer Studie in StrefaAnkiet verknüpft, zeigt LimeControl deren Feldstatus — ohne das Panel zu öffnen.',
    connectList: [
      '<strong>CAPI</strong> — abgeschlossene Interviews, Interviewer-Zuteilungen und ihr Fortschritt gegenüber dem Ziel.',
      '<strong>CATI</strong> — die Zahl der Fälle in der Warteschlange, nicht zugeteilte Fälle und Fälle, die Aufmerksamkeit brauchen.',
      '<strong>Nur lesend</strong> — die App ändert nichts an der Studie; sie braucht einen Zugangsschlüssel mit den Scopes <code>fieldwork.read</code> und <code>cati.read</code>.',
      '<strong>Der Schlüssel bleibt bei Ihnen</strong> — er liegt nur im Speicher des geöffneten Tabs, genau wie LimeSurvey-Passwörter.',
    ],
    connectCta: 'So verbinden Sie Ihr Konto',
    startEyebrow: 'Erste Schritte',
    startH: 'Vier Schritte — die ersten drei sind kostenlos',
    start: [
      ['Umfrageserver bereitstellen', `Nutzen Sie Ihre eigene LimeSurvey-Instanz, das kostenlose Docker-Kit oder überlassen Sie uns <a href="${homeUrl('de', 'hosting')}">Einrichtung und Betreuung</a>.`],
      ['Design und Vorlage hinzufügen', `Installieren Sie das <a href="${ROUTES.themes.de}#cati">CATI- oder CAPI-Design</a> und importieren Sie ein <a href="${ROUTES.templates.de}#wywiad-cati">Interviewgerüst</a>.`],
      ['Kostenlose Plugins installieren', 'Laden Sie die Pakete im Plugin-Manager von LimeSurvey hoch und legen Sie fest, welche Umfrage zu welcher Studie gehört.'],
      ['Dienste bei Bedarf einschalten', `Legen Sie ein StrefaAnkiet-Konto an, richten Sie Versand oder Telefonie ein und verfolgen Sie den Fortschritt in <a href="${APP_URL}">LimeControl</a>.`],
    ],
    ctaH: 'Sie planen eine CATI- oder CAPI-Studie?',
    ctaP: 'Beschreiben Sie die Studie — Zahl der Interviews, Modi und Termine. Wir sagen Ihnen, was die kostenlosen Werkzeuge leisten und wo ein StrefaAnkiet-Konto hilft.',
    mailSubject: 'StrefaAnkiet-Plugins für LimeSurvey',
    footerNote: 'StrefaAnkiet und LimeControl werden von <a href="https://strefabadan.pl" rel="noopener">strefabadan.pl</a> entwickelt.',
  },
};

export function renderPluginsPage(lang) {
  const s = S[lang];
  const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(s.mailSubject)}`;
  const primaryCta = PLUGINS_URL
    ? `<a class="btn btn-primary" href="${PLUGINS_URL}" target="_blank" rel="noopener">${s.ctaDownload}</a>`
    : `<a class="btn btn-primary" href="${mailto}">${s.ctaAsk}</a>`;
  const body = `
  <main id="main">
    <section class="hero hero-themes">
      <div class="container">
        <div>
          <span class="eyebrow">${s.eyebrow}</span>
          <h1>${s.h1}</h1>
          <p class="lead">${s.lead}</p>
          <div class="hero-cta">
            ${primaryCta}
            <a class="btn btn-ghost" href="${STREFAANKIET_PRICING_URL}" rel="noopener">${s.ctaPricing}</a>
          </div>
          <ul class="hero-meta">
            ${s.meta.map((m) => `<li>${m}</li>`).join('\n            ')}
          </ul>
        </div>
      </div>
    </section>

    <section id="${s.ids.model}" class="section-soft" aria-labelledby="model-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.modelEyebrow}</span>
          <h2 id="model-h">${s.modelH}</h2>
          <p>${s.modelP}</p>
        </div>
        <div class="grid grid-2">
          <article class="card host-card">
            <span class="tag">${s.freeTag}</span>
            <h3>${s.freeH}</h3>
            <p>${s.freeP}</p>
            <ul>
              ${s.freeList.map((li) => `<li>${li}</li>`).join('\n              ')}
            </ul>
            <div class="actions">
              ${primaryCta.replace('btn-primary', 'btn-ghost')}
            </div>
          </article>
          <article class="card host-card featured">
            <span class="tag">${s.paidTag}</span>
            <h3>${s.paidH}</h3>
            <p>${s.paidP}</p>
            <ul>
              ${s.paidList.map((li) => `<li>${li}</li>`).join('\n              ')}
            </ul>
            <p class="fineprint">${s.paidNote}</p>
            <div class="actions">
              <a class="btn btn-primary" href="${STREFAANKIET_PRICING_URL}" rel="noopener">${s.ctaPricing}</a>
              <a class="btn btn-ghost" href="${mailto}">${s.ctaTalk}</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="${s.ids.plugins}" aria-labelledby="plugins-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.pluginsEyebrow}</span>
          <h2 id="plugins-h">${s.pluginsH}</h2>
          <p>${s.pluginsP}</p>
        </div>
        <div class="pgrid">
          ${PLUGINS.map((p) => `<article class="card pcard" id="${p.id}">
            <span class="status${p.account ? '' : ' is-free'}">${p.account ? s.statusAccount : s.statusFree}</span>
            <h3>${esc(p.title[lang])}</h3>
            <span class="pname">${p.tool ? s.toolLabel : s.pluginLabel}: ${p.id}</span>
            <p>${esc(p.lead[lang])}</p>
            <ul>
              ${p.points[lang].map((x) => `<li>${esc(x)}</li>`).join('\n              ')}
            </ul>
          </article>`).join('\n          ')}
        </div>
        <div class="callout" style="margin-top:32px">
          <p>${PLUGINS_URL ? s.releaseReady(PLUGINS_URL) : s.releasePending(mailto)}</p>
        </div>
      </div>
    </section>

    <section id="${s.ids.modes}" class="section-soft" aria-labelledby="modes-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.modesEyebrow}</span>
          <h2 id="modes-h">${s.modesH}</h2>
          <p>${s.modesP}</p>
        </div>
        <div class="modes">
          ${s.modes.map(([abbr, h, p, more]) => `<article class="card">
            <div class="abbr">${abbr}</div>
            <h3>${h}</h3>
            <p>${p}</p>
            <p class="more">${more}</p>
          </article>`).join('\n          ')}
        </div>
      </div>
    </section>

    <section id="${s.ids.compare}" aria-labelledby="compare-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.compareEyebrow}</span>
          <h2 id="compare-h">${s.compareH}</h2>
          <p>${s.compareP}</p>
        </div>
        <div class="table-scroll">
          <table class="compare">
            <thead>
              <tr>${s.compareHead.map((h) => `<th scope="col">${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${s.compare.map(([need, free, pro]) => `<tr><th scope="row">${need}</th><td>${free}</td><td>${pro}</td></tr>`).join('\n              ')}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section id="${s.ids.connect}" class="section-soft" aria-labelledby="connect-h">
      <div class="container split">
        <div>
          <span class="eyebrow">${s.connectEyebrow}</span>
          <h2 id="connect-h">${s.connectH}</h2>
          <p class="muted">${s.connectP}</p>
          <a class="btn btn-ghost" href="${ROUTES.docs[lang]}#strefaankiet">${s.connectCta}</a>
        </div>
        <ul class="checklist">
          ${s.connectList.map((li) => `<li><span>${li}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section id="${s.ids.start}" aria-labelledby="start-h">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">${s.startEyebrow}</span>
          <h2 id="start-h">${s.startH}</h2>
        </div>
        <ol class="steps">
          ${s.start.map(([h, p]) => `<li>
            <h3>${h}</h3>
            <p>${p}</p>
          </li>`).join('\n          ')}
        </ol>
      </div>
    </section>

    <section style="padding-top:0">
      <div class="container">
        <div class="cta">
          <h2>${s.ctaH}</h2>
          <p>${s.ctaP}</p>
          <div class="cta-actions">
            <a class="btn btn-primary" href="${mailto}">${CONTACT_EMAIL}</a>
            <a class="btn btn-ghost" href="${STREFAANKIET_URL}" rel="noopener">strefaankiet.pl</a>
          </div>
        </div>
      </div>
    </section>
  </main>`;

  const html = layout({
    lang,
    page: 'plugins',
    title: s.title,
    description: s.description,
    ogTitle: s.ogTitle,
    body,
    footerNote: s.footerNote,
  });
  return { path: outputPath('plugins', lang), html };
}
